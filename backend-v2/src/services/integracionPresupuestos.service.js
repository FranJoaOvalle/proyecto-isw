const Conflict = require("../exceptions/ConflictException");

// Puntos de integración exclusivamente servidor. Presupuestos debe sustituir
// estas guardas por consultas de sus evidencias persistidas dentro del mismo tx.
module.exports = {
    async verificarAceptacion() {
        throw new Conflict("Integración de aceptación con Presupuestos pendiente.");
    },
    async verificarCierreSolicitud() {
        throw new Conflict("Cierre bloqueado: falta la certificación de propuestas y compromisos por Presupuestos.");
    },
    async verificarEdicionSolicitud() {
        throw new Conflict("La solicitud tiene propuestas. Presupuestos debe verificar su emisión o versionado antes de modificarla.");
    }
};
