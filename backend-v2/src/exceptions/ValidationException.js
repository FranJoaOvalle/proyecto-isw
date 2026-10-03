const AppException = require("./AppException");

class ValidationException extends AppException {
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