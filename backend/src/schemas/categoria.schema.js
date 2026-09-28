const { z } = require("zod");

const categoriaBaseSchema = z.object({
    nombre: z.string({
        required_error: "El nombre de la categoria es obligatorio."
    })
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(80, "El nombre no puede exceder los 80 caracteres."),

    descripcion: z.string()
        .trim()
        .max(500, "La descripcion no puede exceder los 500 caracteres.")
        .optional()
        .nullable(),

    estado: z.boolean({
        required_error: "El estado de la categoria es obligatorio."
    })
});

const createCategorySchema = z.object({
    body: categoriaBaseSchema
});

const updateCategorySchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: categoriaBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const categoryIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID invalido.")
    })
});

const getCategoriesSchema = z.object({
    query: z.object({
        incluirInactivos: z.enum(["true", "false"])
            .transform(value => value === "true")
            .optional()
    })
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    getCategoriesSchema
};