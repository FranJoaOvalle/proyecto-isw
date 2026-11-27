const prisma = require("../config/prisma");
const env = require("../config/env");
const { excluirCorreosDemo } = require("../utils/correo-demo");
const ConflictException = require("../exceptions/ConflictException");
const { hashToken } = require("../utils/token-encuesta");
const { enviar, REINTENTO_MS, MAX_INTENTOS } = require("../services/envio-encuesta.service");

const INTERVALO_MS = 30_000;
let ejecutando = false;
let timer = null;

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
                ...excluirCorreosDemo,
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
                    ...excluirCorreosDemo,
                    evento: { estado: "COMPLETADO", calificacion: null },
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
                take: 10,
                select: { eventoId: true, intentos: true, estado: true }
            });

        for (const invitacion of invitaciones) {
            try {
                await enviar(invitacion.eventoId, { manual: false, confirmacion: invitacion });
                console.log(`[Encuestas] Invitación del evento #${invitacion.eventoId} enviada.`);
            } catch (error) {
                if (!(error instanceof ConflictException)) {
                    console.error(`[Encuestas] Error de envío para el evento #${invitacion.eventoId}:`, error.code ?? error.name);
                }
            }
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
