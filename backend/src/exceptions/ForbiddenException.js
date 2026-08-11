const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando el usuario está autenticado,
 * pero no tiene permisos suficientes para realizar una operación.
 *
 * Representa un error HTTP 403 Forbidden.
 *
 * @example
 * throw new ForbiddenException(
 *     "No tienes permisos para eliminar este usuario."
 * );
 */
class ForbiddenException extends AppException {

    /**
     * Crea una excepción de permisos insuficientes.
     *
     * @param {string} [message="No tienes permisos suficientes para realizar esta operación."]
     * Mensaje descriptivo del error.
     */
    constructor(
        message = "No tienes permisos suficientes para realizar esta operación."
    ) {
        super({
            message,
            statusCode: 403,
            code: "FORBIDDEN"
        });
    }
}

module.exports = ForbiddenException;