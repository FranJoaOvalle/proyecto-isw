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

const recursoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int("El ID debe ser un número entero.")
            .positive("ID inválido.")
            .max(2147483647, "ID fuera de rango.")
    })
});

module.exports = {
    createRecursoSchema,
    recursoIdSchema
};
