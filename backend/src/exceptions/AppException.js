/**
 * @class
 *
 * @description
 * Clase base para todas las excepciones controladas de la aplicación.
 *
 * Todas las excepciones personalizadas deben heredar de esta clase para
 * estandarizar el mensaje, el código HTTP, el código identificador y
 * la información adicional asociada al error.
 *
 * Las excepciones que hereden de esta clase son procesadas automáticamente
 * por el middleware `errorHandler`.
 *
 * Por defecto, representa un error HTTP 500 Internal Server Error.
 *
 * @property {string} name - Nombre de la excepción.
 * @property {string} message - Descripción del error.
 * @property {number} statusCode - Código HTTP asociado al error.
 * @property {string} code - Código identificador del error.
 * @property {Object|Array|null} details - Información adicional sobre el error.
 *
 * @example
 * throw new AppException({
 *     message: "Se produjo un error interno.",
 *     statusCode: 500,
 *     code: "INTERNAL_ERROR"
 * });
 */
class AppException extends Error {

    /**
     * Crea una nueva excepción de aplicación.
     *
     * @param {Object} options - Configuración de la excepción.
     * @param {string} options.message - Descripción del error.
     * @param {number} [options.statusCode=500] - Código HTTP asociado al error.
     * @param {string} [options.code="INTERNAL_ERROR"] - Código identificador del error.
     * @param {Object|Array|null} [options.details=null] - Información adicional sobre el error.
     */
    constructor({
                    message,
                    statusCode = 500,
                    code = "INTERNAL_ERROR",
                    details = null
                }) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppException;