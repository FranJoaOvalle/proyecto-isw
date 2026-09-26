const { z } = require("zod");

const personalBaseSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, "El nombre es obligatorio."),

    email: z
        .email("Correo electrónico inválido.")
        .optional()
        .nullable(),

    telefono: z.string()
        .trim()
        .optional()
        .nullable(),

    tipo: z.string()
        .trim()
        .optional()
        .nullable(),

    especialidad: z.string()
        .trim()
        .optional()
        .nullable(),

    notas: z.string()
        .trim()
        .optional()
        .nullable()
});

const createPersonalSchema = z.object({
    body: personalBaseSchema
});

const updatePersonalSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: personalBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const personalIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    })
});

const createPersonalUsuarioSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: z.object({
        email: z
            .email("Correo electrónico inválido."),

        password: z.string()
            .min(8, "La contraseña debe tener al menos 8 caracteres."),

        rol: z.enum([
            "ADMIN",
            "PRODUCCION",
            "COMERCIAL"
        ])
    })
});

const getPersonalSchema = z.object({
    query: z.object({
        incluirInactivos: z.enum(["true", "false"])
            .transform(value => value === "true")
            .optional()
    })
});

module.exports = {
    createPersonalSchema,
    updatePersonalSchema,
    personalIdSchema,
    createPersonalUsuarioSchema,
    getPersonalSchema
};