const AppException = require("./AppException");

class ConflictException extends AppException {
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