const AppException = require("../exceptions/AppException");
const prismaExceptionHandler = require("../utils/prismaExceptionHandler");

/**
 * @function
 *
 * @description
 * Middleware global encargado de procesar los errores producidos
 * durante el procesamiento de una solicitud HTTP.
 *
 * El middleware maneja tres tipos principales de errores:
 *
 * 1. AppException:
 *    Errores controlados y definidos por nuestra aplicación.
 *
 * 2. Errores de Prisma:
 *    Son convertidos mediante `prismaExceptionHandler` a excepciones
 *    entendibles por nuestra aplicación.
 *
 * 3. Errores desconocidos:
 *    Se consideran errores internos del servidor y se responde
 *    con HTTP 500.
 *
 * **IMPORTANTE:**
 * Este middleware debe registrarse DESPUÉS de todas las rutas y
 * demás middlewares que puedan producir errores.
 *
 * @param {Error} error
 * Error producido durante el procesamiento de la solicitud.
 * Express identifica este middleware como un middleware de manejo
 * de errores porque recibe cuatro argumentos: `error`, `req`, `res`
 * y `next`.
 *
 * @param {import("express").Request} req
 * Solicitud HTTP recibida por el servidor.
 *
 * @param {import("express").Response} res
 * Respuesta HTTP que será enviada al cliente.
 *
 * @param {import("express").NextFunction} next
 * Función proporcionada por Express para transferir el control
 * al siguiente middleware de la cadena.
 *
 * En un middleware de errores, `next(error)` se utiliza cuando el
 * error actual no puede o no debe ser procesado por este middleware,
 * permitiendo que otro middleware de manejo de errores continúe
 * con el procesamiento.
 *
 * Este middleware no necesita llamar a `next` porque procesa todos
 * los errores que recibe y siempre genera una respuesta HTTP:
 * - Las `AppException` se responden con su código y estado HTTP.
 * - Los errores conocidos de Prisma se convierten y se responden.
 * - Los errores desconocidos se responden como HTTP 500.
 *
 * @returns {import("express").Response}
 * Respuesta HTTP enviada al cliente con la información del error.
 */
function errorHandler(error, req, res, next) {

    console.error(error);

    /*
     * 1. Errores definidos por nuestra aplicación.
     */
    if (error instanceof AppException) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                ...(error.details && {
                    details: error.details
                })
            }
        });
    }

    /*
     * 2. Errores conocidos de Prisma.
     */
    const prismaError = prismaExceptionHandler(error);

    if (prismaError) {
        return res.status(prismaError.statusCode).json({
            error: {
                code: prismaError.code,
                message: prismaError.message,
                ...(prismaError.details && {
                    details: prismaError.details
                })
            }
        });
    }

    /*
     * 3. Error desconocido.
     *
     * No enviamos `error.message` al cliente porque podría
     * contener información sensible sobre nuestra implementación.
     */
    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Ha ocurrido un error inesperado en el servidor."
        }
    });
}

module.exports = errorHandler;