const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando el usuario no está autenticado
 * y necesita iniciar sesión para realizar una operación.
 *
 * Representa un error HTTP 401 Unauthorized.
 *
 * @example
 * throw new UnauthorizedException(
 *     "Debes iniciar sesión para continuar."
 * );
 */
class UnauthorizedException extends AppException {

    /**
     * Crea una excepción de autenticación.
     *
     * @param {string} [message="Debes iniciar sesión para realizar esta operación."]
     * Mensaje descriptivo del error.
     */
    constructor(
        message = "Debes iniciar sesión para realizar esta operación."
    ) {
        super({
            message,
            statusCode: 401,
            code: "UNAUTHORIZED"
        });
    }
}

module.exports = UnauthorizedException;