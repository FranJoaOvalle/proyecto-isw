const AppException = require("./AppException");

class BadRequestException extends AppException {
    constructor(
        message = "La solicitud contiene datos inválidos o no puede ser procesada."
    ) {
        super({
            message,
            statusCode: 400,
            code: "BAD_REQUEST"
        });
    }
}

module.exports = BadRequestException;