const ConflictException = require("../exceptions/ConflictException");

// Puntos de integración exclusivamente servidor. Presupuestos debe sustituir
// estas guardas por consultas de sus evidencias persistidas dentro del mismo tx.
const verificarAceptacion = async () => {
    throw new ConflictException(
        "Integración de aceptación con Presupuestos pendiente."
    );
};

const verificarCierreSolicitud = async () => {
    throw new ConflictException(
        "Cierre bloqueado: falta la certificación de propuestas y compromisos por Presupuestos."
    );
};

const verificarEdicionSolicitud = async () => {
    throw new ConflictException(
        "La solicitud tiene propuestas. Presupuestos debe verificar su emisión o versionado antes de modificarla."
    );
};

module.exports = {
    verificarAceptacion,
    verificarCierreSolicitud,
    verificarEdicionSolicitud
};
