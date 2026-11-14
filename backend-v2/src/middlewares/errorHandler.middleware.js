const AppException = require("../exceptions/AppException");
const prismaExceptionHandler = require("../utils/prismaExceptionHandler");

function errorHandler(error, req, res, next) {
    console.error(error);

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

    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Ha ocurrido un error inesperado en el servidor."
        }
    });
}

module.exports = errorHandler;