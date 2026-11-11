const ConflictException = require("../exceptions/ConflictException");

// Presupuestos debe implementar estas verificaciones con evidencias del servidor.
class IntegracionPresupuestosService {

    async verificarAceptacion() {
        throw new ConflictException(
            "Integración de aceptación con Presupuestos pendiente."
        );
    }

    async verificarCierreSolicitud({ tx, solicitudId }) {
        const propuestas = await tx.presupuesto.count({ where: { solicitudId } });
        if (propuestas > 0) {
            throw new ConflictException(
                "La solicitud tiene propuestas vinculadas y no puede cerrarse mientras su gestión comercial no las resuelva."
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
