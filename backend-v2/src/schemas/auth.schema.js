const { z } = require("zod");
const { normalizarRut, validarRut } = require("../utils/rut");

const registroSchema = z.object({
    body: z.discriminatedUnion("tipo", [
        z.object({
            tipo: z.literal("PERSONA"),

            rut: z.string()
                .transform(normalizarRut)
                .refine(validarRut, "El RUT no es válido."),

            email: z
                .email("El correo electrónico no es válido.")
                .transform((value) => value.toLowerCase().trim()),

            password: z
                .string()
                .min(8, "La contraseña debe tener al menos 8 caracteres."),

            nombres: z.string().min(1, "El nombre es obligatorio.").trim(),
            apellidos: z.string().min(1, "Los apellidos son obligatorios.").trim(),

            telefono: z
                .string()
                .trim()
                .optional()
        }),

        z.object({
            tipo: z.literal("EMPRESA"),

            rutEmpresa: z.string()
                .transform(normalizarRut)
                .refine(validarRut, "El RUT de la empresa no es válido."),

            email: z
                .email("El correo electrónico no es válido.")
                .transform((value) => value.toLowerCase().trim()),

            password: z
                .string()
                .min(8, "La contraseña debe tener al menos 8 caracteres."),

            razonSocial: z.string().min(1, "La razón social es obligatoria.").trim(),
            casaMatriz: z.string().min(1, "La casa matriz es obligatoria.").trim(),

            telefono: z
                .string()
                .trim()
                .optional()
        }).strict()
    ])
});

const loginSchema = z.object({
    body: z.object({
        email: z
            .email("El correo electrónico no es válido.")
            .transform((value) => value.toLowerCase().trim()),

        password: z.string()
            .min(1, "La contraseña es obligatoria.")
    }).strict()
});

module.exports = {
    registroSchema,
    loginSchema
};