const ConflictException = require("../exceptions/ConflictException");

class IntegracionPresupuestosService {

    async verificarAceptacion({ presupuesto, actorId, version }) {
        if (
            presupuesto.estado !== "ACEPTADO" ||
            !presupuesto.enviadoAt ||
            !presupuesto.enviadoPorId ||
            !presupuesto.aceptadoAt ||
            presupuesto.aceptadoPorId !== actorId ||
            presupuesto.version !== version ||
            presupuesto.versionAceptada !== version ||
            !presupuesto.venceAt ||
            presupuesto.aceptadoAt > presupuesto.venceAt
        ) {
            throw new ConflictException(
                "La propuesta no acredita una aceptación vigente de esta versión."
            );
        }
    }

    async verificarCierreSolicitud({ tx, solicitudId }) {
        // CANCELADO/VENCIDO y pagos FALLIDOS/REEMBOLSADOS son historial resuelto;
        // propuestas activas, pagos pendientes/pagados o eventos aún comprometen la solicitud.
        const propuestas = await tx.presupuesto.findMany({
            where: { solicitudId },
            select: {
                id: true,
                estado: true,
                evento: { select: { id: true } },
                pagos: { select: { estado: true } }
            }
        });
        const propuestaNoResuelta = propuestas.find((propuesta) =>
            !["CANCELADO", "VENCIDO"].includes(propuesta.estado) ||
            propuesta.evento !== null ||
            propuesta.pagos.some((pago) => ["PENDIENTE", "PAGADO"].includes(pago.estado))
        );
        if (propuestaNoResuelta) {
            throw new ConflictException(
                "La solicitud conserva una propuesta activa, un evento o un compromiso de pago pendiente de resolver."
            );
        }
    }

    async verificarEdicionSolicitud() {
        throw new ConflictException(
            "La solicitud tiene propuestas. Presupuestos debe verificar su emisión o versionado antes de modificarla."
        );
    }
}

module.exports = new IntegracionPresupuestosService();
