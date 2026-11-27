const crypto = require("node:crypto");

const prisma = require("../config/prisma");
const env = require("../config/env");

const {
    sendEncuestaEmail
} = require("../services/email.service");

const INTERVALO_MS = 30_000;
const REINTENTO_MS = 60_000;
const MAX_INTENTOS = 3;
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

let ejecutando = false;
let timer = null;

function generarToken(invitacion) {
    return crypto
        .createHmac("sha256", env.JWT_SECRET)
        .update(
            `encuesta:v1:${invitacion.id}:${invitacion.createdAt.toISOString()}`
        )
        .digest("base64url");
}

function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

async function enviarInvitacion(invitacion) {
    const token = generarToken(invitacion);
    const tokenHash = hashToken(token);

    const expiraAt = new Date(
        Date.now() + VIGENCIA_MS
    );

    await prisma.invitacionEncuesta.update({
        where: { id: invitacion.id },
        data: {
            tokenHash,
            expiraAt,
            estado: "PENDIENTE",
            intentos: {
                increment: 1
            }
        }
    });

    try {
        const destinatario =
            env.ENCUESTAS_EMAIL_PRUEBA ??
            invitacion.destinatario;

        await sendEncuestaEmail(destinatario, token);
    } catch (error) {
        await prisma.invitacionEncuesta.update({
            where: { id: invitacion.id },
            data: {
                estado: "FALLIDA",
                ultimoError: String(
                    error.code ?? "ERROR_SMTP"
                )
            }
        });

        console.error(
            `[Encuestas] Falló el envío #${invitacion.id}`
        );

        return;
    }

    await prisma.invitacionEncuesta.update({
        where: { id: invitacion.id },
        data: {
            estado: "ENVIADA",
            enviadoAt: new Date(),
            ultimoError: null
        }
    });

    console.log(
        `[Encuestas] Invitación #${invitacion.id} enviada.`
    );
}

async function procesarPendientes() {
    if (ejecutando) return;

    ejecutando = true;

    try {
        const limiteReintento = new Date(
            Date.now() - REINTENTO_MS
        );

        // Recuperar intentos finales interrumpidos.
        await prisma.invitacionEncuesta.updateMany({
            where: {
                estado: "PENDIENTE",
                intentos: { gte: MAX_INTENTOS },
                respondidoAt: null,
                updatedAt: { lte: limiteReintento }
            },
            data: {
                estado: "FALLIDA",
                ultimoError: "ENVIO_NO_CONFIRMADO"
            }
        });

        const invitaciones =
            await prisma.invitacionEncuesta.findMany({
                where: {
                    estado: {
                        in: ["PENDIENTE", "FALLIDA"]
                    },
                    respondidoAt: null,
                    intentos: {
                        lt: MAX_INTENTOS
                    },
                    OR: [
                        { intentos: 0 },
                        {
                            updatedAt: {
                                lte: limiteReintento
                            }
                        }
                    ]
                },
                orderBy: {
                    createdAt: "asc"
                },
                take: 10
            });

        for (const invitacion of invitaciones) {
            await enviarInvitacion(invitacion);
        }
    } catch (error) {
        console.error(
            "[Encuestas] Error al procesar invitaciones:",
            error.code ?? error.name
        );
    } finally {
        ejecutando = false;
    }
}

function iniciarEncuestasJob() {
    if (!env.ENCUESTAS_EMAIL_ACTIVO || timer) return;

    if (
        env.NODE_ENV !== "production" &&
        !env.ENCUESTAS_EMAIL_PRUEBA
    ) {
        console.warn(
            "[Encuestas] Configura un correo de prueba."
        );

        return;
    }

    console.log(
        "[Encuestas] Procesador de invitaciones iniciado."
    );

    void procesarPendientes();

    timer = setInterval(
        procesarPendientes,
        INTERVALO_MS
    );
}

function detenerEncuestasJob() {
    if (!timer) return;

    clearInterval(timer);
    timer = null;
}

module.exports = {
    iniciarEncuestasJob,
    detenerEncuestasJob,
    hashToken
};