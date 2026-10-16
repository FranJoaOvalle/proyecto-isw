const { z } = require("zod");

const tipoEventoBaseSchema = z.object({
    nombre: z.string({
        required_error: "El nombre del tipo de evento es obligatorio."
    })
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(100, "El nombre no puede exceder 100 caracteres."),

    descripcion: z.string({
        required_error: "La descripción del tipo de evento es obligatoria."
    })
        .trim()
        .min(10, "La descripción debe tener al menos 10 caracteres.")
        .max(500, "La descripción no puede exceder 500 caracteres."),

    precioBase: z.coerce.number({
        required_error: "El precio base es obligatorio."
    })
        .positive("El precio base debe ser mayor a 0."),

    cantidadPersonasBase: z.coerce.number({
        required_error: "La cantidad base de personas es obligatoria."
    })
        .int("La cantidad base de personas debe ser un número entero.")
        .positive("La cantidad base de personas debe ser mayor a 0."),

    activo: z.boolean({
        required_error: "El estado del tipo de evento es obligatorio."
    }),

    imagen_url: z.string()
        .trim()
        .url("La URL de la imagen no es válida.")
        .optional()
        .nullable()
});

const createTipoEventoSchema = z.object({
    body: tipoEventoBaseSchema
});

const updateTipoEventoSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),
    body: tipoEventoBaseSchema
        .omit({ activo: true })
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const tipoEventoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    })
});

const getTiposEventoSchema = z.object({
    query: z.object({
        incluirInactivos: z.enum(["true", "false"])
            .transform(value => value === "true")
            .optional()
    })
});

const estadoTipoEventoSchema = z.object({
    body: z.object({
        activo: z.boolean({
            required_error: "El estado del tipo de evento es obligatorio."
        })
    })
});

module.exports = {
    createTipoEventoSchema,
    updateTipoEventoSchema,
    tipoEventoIdSchema,
    getTiposEventoSchema,
    estadoTipoEventoSchema
};