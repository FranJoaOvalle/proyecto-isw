const AppException = require("./AppException");

/**
 * @class
 *
 * @description
 * Excepción utilizada cuando los datos recibidos por la API
 * no cumplen con las reglas de validación definidas.
 *
 * Normalmente, se utiliza junto con Joi.
 *
 * Representa un error HTTP 422 Unprocessable Entity.
 *
 * Permite incluir información adicional sobre los campos
 * que no superaron la validación.
 *
 * @example
 * throw new ValidationException(
 *     "Los datos proporcionados no son válidos.",
 *     validationErrors
 * );
 */
class ValidationException extends AppException {

    /**
     * Crea una excepción de validación.
     *
     * @param {string} [message="Uno o más datos proporcionados no son válidos."]
     * Mensaje general del error.
     * @param {Array|Object|null} [details=null]
     * Información específica sobre los errores de validación.
     */
    constructor(
        message = "Uno o más datos proporcionados no son válidos.",
        details = null
    ) {
        super({
            message,
            statusCode: 422,
            code: "VALIDATION_ERROR",
            details
        });
    }
}

module.exports = ValidationException;