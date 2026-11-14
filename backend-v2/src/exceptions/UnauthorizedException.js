const AppException = require("./AppException");

class UnauthorizedException extends AppException {
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