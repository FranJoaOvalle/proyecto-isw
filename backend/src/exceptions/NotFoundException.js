const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando el recurso solicitado
 * no existe en el sistema.
 *
 * Representa un error HTTP 404 Not Found.
 *
 * @example
 * throw new NotFoundException(
 *     "No se encontró el usuario solicitado."
 * );
 */
class NotFoundException extends AppException {

    /**
     * Crea una excepción de recurso no encontrado.
     *
     * @param {string} [message="El recurso solicitado no fue encontrado."]
     * Mensaje descriptivo del error.
     */
    constructor(
        message = "El recurso solicitado no fue encontrado."
    ) {
        super({
            message,
            statusCode: 404,
            code: "NOT_FOUND"
        });
    }
}

module.exports = NotFoundException;