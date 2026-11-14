const { z } = require("zod");

const actualizarPerfilSchema = z.object({
    body: z.object({
        email: z
            .email("El correo electrónico no es válido.")
            .transform((value) => value.toLowerCase().trim())
            .optional(),

        nombres: z.string().min(1, "El nombre es obligatorio.").trim().optional(),
        apellidos: z.string().min(1, "Los apellidos son obligatorios.").trim().optional(),
        telefono: z.string().trim().optional(),

        razonSocial: z.string().min(1, "La razón social es obligatoria.").trim().optional(),
        casaMatriz: z.string().min(1, "La casa matriz es obligatoria.").trim().optional()
    }).strict().refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: "Debes proporcionar al menos un campo para actualizar." }
    )
});

const cambiarPasswordSchema = z.object({
    body: z.object({
        passwordActual: z.string().min(1, "La contraseña actual es obligatoria."),
        passwordNueva: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
    }).strict()
});

module.exports = {
    actualizarPerfilSchema,
    cambiarPasswordSchema
};