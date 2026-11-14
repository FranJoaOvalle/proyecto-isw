const { z } = require("zod");

const crearProductorSchema = z.object({
    body: z.object({
        email: z
            .email("El correo electrónico no es válido.")
            .transform((value) => value.toLowerCase().trim()),

        password: z.string()
            .min(8, "La contraseña debe tener al menos 8 caracteres."),

        nombres: z.string()
            .min(1, "El nombre es obligatorio.")
            .trim(),

        apellidos: z.string()
            .min(1, "Los apellidos son obligatorios.")
            .trim(),

        telefono: z.string()
            .trim()
            .optional()
    }).strict()
});

const actualizarProductorSchema = z.object({
    body: z.object({
        email: z
            .email("El correo electrónico no es válido.")
            .transform((value) => value.toLowerCase().trim()),

        nombres: z
            .string()
            .min(1, "El nombre es obligatorio.")
            .trim()
            .optional(),

        apellidos: z
            .string()
            .min(1, "Los apellidos son obligatorios.")
            .trim()
            .optional(),

        telefono: z
            .string()
            .trim()
            .optional()
    }).strict().refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: "Debes proporcionar al menos un campo para actualizar." }
    )
});

const estadoProductorSchema = z.object({
    body: z.object({
        activo: z.boolean()
    }).strict()
});

module.exports = {
    crearProductorSchema,
    actualizarProductorSchema,
    estadoProductorSchema
};