const ConflictException = require("../exceptions/ConflictException");

// Presupuestos debe implementar estas verificaciones con evidencias del servidor.
class IntegracionPresupuestosService {

    async verificarAceptacion() {
        throw new ConflictException(
            "Integración de aceptación con Presupuestos pendiente."
        );
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
