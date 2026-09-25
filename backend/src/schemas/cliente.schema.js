const { z } = require("zod");

const clienteBaseSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, "El nombre es obligatorio."),

    email: z.email("Correo electrónico inválido.")
        .optional()
        .nullable(),

    telefono: z.string()
        .trim()
        .optional()
        .nullable(),

    direccion: z.string()
        .trim()
        .optional()
        .nullable(),

    notas: z.string()
        .trim()
        .optional()
        .nullable()
});

const createClienteSchema = z.object({
    body: clienteBaseSchema
});

const updateClienteSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: clienteBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const clienteIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    })
});

const createClienteUsuarioSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: z.object({
        email: z
            .email("Correo electrónico inválido."),

        password: z.string()
            .min(8, "La contraseña debe tener al menos 8 caracteres.")
    })
});

module.exports = {
    createClienteSchema,
    updateClienteSchema,
    clienteIdSchema,
    createClienteUsuarioSchema
};