const { z } = require("zod");

const servicioBaseSchema = z.object({
    nombre: z.string({
        required_error: "El nombre del servicio es obligatorio."
    })
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(100, "El nombre no puede exceder los 100 caracteres."),

    descripcion: z.string({
        required_error: "La descripcion del servicio es obligatoria."
    })
        .trim()
        .min(10, "La descripcion debe tener al menos 10 caracteres.")
        .max(500, "La descripcion no puede exceder los 500 caracteres."),

    precio_base: z.coerce.number({
        required_error: "El precio base es obligatorio."
    })
        .positive("El precio base debe ser mayor a 0."),

    estado: z.boolean({
        required_error: "El estado del servicio es obligatorio."
    }),

    id_categoria: z.coerce.number({
        required_error: "La categoria es obligatoria."
    })
        .int("El ID de categoria debe ser un numero entero.")
        .positive("El ID de categoria debe ser mayor a 0.")
});

const createServiceSchema = z.object({
    body: servicioBaseSchema
});

const updateServiceSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID invalido.")
    }),

    body: servicioBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const serviceIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID invalido.")
    })
});

const getServicesSchema = z.object({
    query: z.object({
        incluirInactivos: z.enum(["true", "false"])
            .transform(value => value === "true")
            .optional()
    })
});

module.exports = {
    createServiceSchema,
    updateServiceSchema,
    serviceIdSchema,
    getServicesSchema
};
