const { z } = require("zod");

const createRecursoSchema = z.object({
    body: z.object({
        tipo: z.string().trim().min(2).max(80),
        nombre: z.string().trim().min(2).max(100),
        cantidad: z.number().int().min(0).max(2147483647),
        estado: z.enum(["DISPONIBLE", "EN_REPARACION", "RETIRADO"])
            .default("DISPONIBLE"),
        observaciones: z.string().trim().max(2000).nullable().optional()
    }).strict()
});

module.exports = { createRecursoSchema };
