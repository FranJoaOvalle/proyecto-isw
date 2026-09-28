const { z } = require("zod");

const recursoBaseSchema = z.object({
    tipo: z.string().trim().min(2).max(80),
    nombre: z.string().trim().min(2).max(100),
    cantidad: z.number().int().min(0).max(2147483647),
    estado: z.enum(["DISPONIBLE", "EN_REPARACION", "RETIRADO"]),
    observaciones: z.string().trim().max(2000).nullable().optional()
}).strict();

const createRecursoSchema = z.object({
    body: recursoBaseSchema.extend({
        estado: recursoBaseSchema.shape.estado.default("DISPONIBLE")
    })
});

const recursoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int("El ID debe ser un número entero.")
            .positive("ID inválido.")
            .max(2147483647, "ID fuera de rango.")
    })
});

const updateRecursoSchema = z.object({
    params: recursoIdSchema.shape.params,
    body: recursoBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

module.exports = {
    createRecursoSchema,
    updateRecursoSchema,
    recursoIdSchema
};
