const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando la operación entra en conflicto
 * con el estado actual de un recurso.
 *
 * Representa un error HTTP 409 Conflict.
 *
 * Un caso común es intentar crear un registro utilizando
 * un valor que debe ser único y que ya existe.
 *
 * @example
 * throw new ConflictException(
 *     "Ya existe un usuario registrado con este correo."
 * );
 */
class ConflictException extends AppException {

    /**
     * Crea una excepción de conflicto.
     *
     * @param {string} [message="La operación no puede completarse porque existe un conflicto con el estado actual del recurso."]
     * Mensaje descriptivo del error.
     */
    constructor(
        message = "La operación no puede completarse porque existe un conflicto con el estado actual del recurso."
    ) {
        super({
            message,
            statusCode: 409,
            code: "CONFLICT"
        });
    }
}

module.exports = ConflictException;