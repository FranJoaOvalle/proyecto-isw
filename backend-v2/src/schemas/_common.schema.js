const { z } = require("zod");

const idParamSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int("El ID debe ser un número entero.")
            .positive("El ID debe ser mayor que cero.")
    }).strict()
});

module.exports = { idParamSchema };