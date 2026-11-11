const ConflictException = require("../exceptions/ConflictException");

class FormalizacionService {

    crearFormalizador() {
        const servicio = new FormalizacionService();
        return () => servicio.formalizarContratacion();
    }

    async formalizarContratacion() {
        throw new ConflictException(
            "La formalización está bloqueada hasta acordar una integración segura con Presupuestos."
        );
    }
}

module.exports = new FormalizacionService();
