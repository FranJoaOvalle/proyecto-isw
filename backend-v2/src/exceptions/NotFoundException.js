const AppException = require("./AppException");

class NotFoundException extends AppException {
    constructor(
        message = "El recurso solicitado no fue encontrado."
    ) {
        super({
            message,
            statusCode: 404,
            code: "NOT_FOUND"
        });
    }
}

module.exports = NotFoundException;