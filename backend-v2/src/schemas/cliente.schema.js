const { z } = require("zod");

const estadoClienteSchema = z.object({
    body: z.object({
        activo: z.boolean()
    }).strict()
});

module.exports = {
    estadoClienteSchema
};