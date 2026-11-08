const ConflictException = require("../exceptions/ConflictException");

// Presupuestos debe implementar estas verificaciones con evidencias del servidor.
class IntegracionPresupuestosService {

    async verificarAceptacion() {
        throw new ConflictException(
            "Integración de aceptación con Presupuestos pendiente."
        );
    }

    async verificarCierreSolicitud() {
        throw new ConflictException(
            "Cierre bloqueado: falta la certificación de propuestas y compromisos por Presupuestos."
        );
    }

    async verificarEdicionSolicitud() {
        throw new ConflictException(
            "La solicitud tiene propuestas. Presupuestos debe verificar su emisión o versionado antes de modificarla."
        );
    }
}

module.exports = new IntegracionPresupuestosService();
