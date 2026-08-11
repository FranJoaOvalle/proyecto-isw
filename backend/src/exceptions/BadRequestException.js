const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando la solicitud enviada por el cliente
 * es inválida o no puede ser procesada correctamente.
 *
 * Representa un error HTTP 400 Bad Request.
 *
 * @example
 * throw new BadRequestException(
 *     "El ID proporcionado no es válido."
 * );
 */
class BadRequestException extends AppException {

    /**
     * Crea una excepción de solicitud inválida.
     *
     * @param {string} [message="La solicitud contiene datos inválidos o no puede ser procesada."]
     * Mensaje descriptivo del error.
     */
    constructor(
        message = "La solicitud contiene datos inválidos o no puede ser procesada."
    ) {
        super({
            message,
            statusCode: 400,
            code: "BAD_REQUEST"
        });
    }
}

module.exports = BadRequestException;