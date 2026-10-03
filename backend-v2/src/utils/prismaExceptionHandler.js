const { Prisma } = require("../../generated/prisma/client");

const BadRequestException = require("../exceptions/BadRequestException");
const ConflictException = require("../exceptions/ConflictException");
const NotFoundException = require("../exceptions/NotFoundException");

function prismaExceptionHandler(error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        switch (error.code) {

            case "P2000":
                return new BadRequestException(
                    "Uno de los valores proporcionados excede la longitud máxima permitida."
                );

            case "P2002": {
                const fields = error.meta?.target ?? [];

                return new ConflictException(
                    fields.length > 0
                        ? `Ya existe un registro con los siguientes datos únicos: ${fields.join(", ")}.`
                        : "Ya existe un registro con los datos únicos proporcionados."
                );
            }

            case "P2003": {
                const field = error.meta?.field_name;

                return new ConflictException(
                    field
                        ? `No se puede realizar la operación porque el campo "${field}" está siendo utilizado por otro registro.`
                        : "No se puede realizar la operación porque el registro está relacionado con otros datos."
                );
            }

            case "P2014":
                return new BadRequestException(
                    "La operación no puede realizarse porque viola una relación requerida entre registros."
                );

            case "P2025":
                return new NotFoundException(
                    "No se encontró el registro solicitado o este ya no existe."
                );

            default:
                return null;
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return new BadRequestException(
            "Los datos proporcionados no cumplen con el formato requerido para realizar esta operación."
        );
    }

    return null;
}

module.exports = prismaExceptionHandler;