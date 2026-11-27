const prisma = require("../config/prisma");
const env = require("../config/env");
const AppException = require("../exceptions/AppException");
const ConflictException = require("../exceptions/ConflictException");
const NotFoundException = require("../exceptions/NotFoundException");
const invitaciones = require("./invitacion-encuesta.service");
const { sendEncuestaEmail } = require("./email.service");
const { esCorreoDemo } = require("../utils/correo-demo");
const { generarToken, hashToken } = require("../utils/token-encuesta");

const REINTENTO_MS = 60_000;
const MAX_INTENTOS = 3;
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

function destinoEncuesta(original) {
    const destinatarioEfectivo = env.ENCUESTAS_EMAIL_PRUEBA ?? original;
    return {
        destinatarioEfectivo,
        correoDePrueba: Boolean(env.ENCUESTAS_EMAIL_PRUEBA)
    };
}

const cambioDeInvitacion = () => new ConflictException(
    "La invitación cambió desde que se consultó. Revisa el evento antes de confirmar otro envío."
);

async function reservarIntento(tx, eventoId, manual, confirmacion) {
    // La finalización del evento también bloquea esta fila antes de generar su invitación.
    await tx.$queryRaw`SELECT id FROM "Evento" WHERE id = ${eventoId} FOR NO KEY UPDATE NOWAIT`;
    await tx.$queryRaw`SELECT id FROM "InvitacionEncuesta" WHERE "eventoId" = ${eventoId} FOR UPDATE NOWAIT`;

    const evento = await tx.evento.findUnique({
        where: { id: eventoId },
        select: {
            estado: true,
            calificacion: { select: { id: true } },
            invitacionEncuesta: {
                select: {
                    id: true, createdAt: true, updatedAt: true, estado: true,
                    intentos: true, respondidoAt: true, destinatario: true
                }
            }
        }
    });
    if (!evento) throw new NotFoundException("Evento no encontrado.");
    if (evento.estado !== "COMPLETADO" || evento.calificacion) {
        throw new ConflictException("Solo puedes enviar encuestas de eventos completados sin calificación.");
    }

    let invitacion = evento.invitacionEncuesta;
    if (!invitacion) {
        if (!manual) throw cambioDeInvitacion();
        invitacion = await invitaciones.generar(tx, eventoId);
        if (!invitacion) {
            throw new ConflictException("No hay una encuesta de satisfacción predeterminada activa.");
        }
    }
    if (invitacion.respondidoAt) throw new ConflictException("La encuesta ya fue respondida.");

    const { destinatarioEfectivo } = destinoEncuesta(invitacion.destinatario);
    if (manual && esCorreoDemo(destinatarioEfectivo)) {
        throw new ConflictException("Configura un correo de prueba válido para enviar esta invitación ficticia.");
    }
    if (confirmacion && (invitacion.intentos !== confirmacion.intentos || invitacion.estado !== confirmacion.estado ||
        (manual && destinatarioEfectivo !== confirmacion.destinatarioEfectivo))) {
        throw cambioDeInvitacion();
    }

    const reciente = Date.now() - invitacion.updatedAt.getTime() < REINTENTO_MS;
    if (!confirmacion && invitacion.estado === "PENDIENTE" && invitacion.intentos > 0 && reciente) {
        throw new ConflictException("Ya hay un envío en curso para esta invitación.");
    }
    if (!manual && (esCorreoDemo(invitacion.destinatario) || invitacion.estado === "ENVIADA" ||
        invitacion.intentos >= MAX_INTENTOS || (invitacion.intentos > 0 && reciente))) {
        throw cambioDeInvitacion();
    }
    if (manual && !confirmacion && invitacion.estado === "ENVIADA" && reciente) {
        throw new ConflictException("La encuesta acaba de enviarse.");
    }

    const token = generarToken(invitacion);
    const intento = await tx.invitacionEncuesta.update({
        where: { id: invitacion.id },
        data: {
            tokenHash: hashToken(token),
            expiraAt: new Date(Date.now() + VIGENCIA_MS),
            estado: "PENDIENTE",
            ultimoError: null,
            intentos: { increment: 1 }
        },
        select: { id: true, intentos: true }
    });
    return { ...intento, eventoId, token, destinatarioEfectivo };
}

async function entregar(tx, intento) {
    // Un SMTP lento sigue siendo dueño del intento aunque venza el intervalo del job.
    await tx.$queryRaw`SELECT id FROM "Evento" WHERE id = ${intento.eventoId} FOR SHARE`;
    const filas = await tx.$queryRaw`
        SELECT id FROM "InvitacionEncuesta"
        WHERE id = ${intento.id} AND intentos = ${intento.intentos}
          AND estado = 'PENDIENTE' AND "respondidoAt" IS NULL
        FOR UPDATE
    `;
    const eventoDisponible = await tx.evento.count({
        where: { id: intento.eventoId, estado: "COMPLETADO", calificacion: null }
    });
    if (!filas.length || !eventoDisponible) throw cambioDeInvitacion();

    let errorSMTP = null;
    try {
        await sendEncuestaEmail(intento.destinatarioEfectivo, intento.token);
    } catch (error) {
        errorSMTP = String(error.code ?? "ERROR_SMTP");
    }
    await tx.invitacionEncuesta.update({
        where: { id: intento.id },
        data: errorSMTP
            ? { estado: "FALLIDA", ultimoError: errorSMTP }
            : { estado: "ENVIADA", enviadoAt: new Date(), ultimoError: null }
    });
    return errorSMTP;
}

async function enviar(eventoId, { manual, confirmacion }) {
    if (!env.ENCUESTAS_EMAIL_ACTIVO) {
        throw new ConflictException("El envío de encuestas por correo está desactivado.");
    }
    let intento;
    try {
        intento = await prisma.$transaction(tx => reservarIntento(tx, eventoId, manual, confirmacion));
    } catch (error) {
        if (error.code === "P2010" && error.meta?.code === "55P03") {
            throw new ConflictException("Ya hay un envío en curso para esta invitación.");
        }
        throw error;
    }
    // El intento queda registrado incluso si el proceso se interrumpe durante SMTP.
    const errorSMTP = await prisma.$transaction(tx => entregar(tx, intento), { timeout: 15 * 60_000 });
    if (errorSMTP) {
        throw new AppException({
            statusCode: 502, code: "ENVIO_ENCUESTA_FALLIDO",
            message: "El servidor de correo no confirmó el envío de la encuesta."
        });
    }
    return { message: `El servidor de correo aceptó la encuesta para ${intento.destinatarioEfectivo}.` };
}

module.exports = { enviar, destinoEncuesta, REINTENTO_MS, MAX_INTENTOS };
