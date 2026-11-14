const AppException = require("./AppException");

class ForbiddenException extends AppException {
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