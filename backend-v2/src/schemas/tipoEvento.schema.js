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

    modalidadPrecio: z.enum(["FIJO", "POR_HORA"], {
        required_error: "La modalidad de precio es obligatoria."
    }),

    precioBase: z.union([
        z.coerce.number().positive("El precio base debe ser mayor a 0."),
        z.null()
    ]),

    tarifaHora: z.union([
        z.coerce.number()
            .positive("La tarifa por hora debe ser mayor a 0.")
            .max(9999999999.99, "La tarifa por hora excede el máximo permitido."),
        z.null()
    ]),

    incluye: z.string()
        .trim()
        .max(2000, "La información de lo incluido no puede exceder 2000 caracteres.")
        .optional()
        .nullable(),

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

const validarModalidadPrecio = (data, ctx) => {
    const precioFijo = data.modalidadPrecio === "FIJO";
    const precioEsperado = precioFijo ? data.precioBase : data.tarifaHora;
    const precioNoAplicable = precioFijo ? data.tarifaHora : data.precioBase;

    if (precioEsperado == null) {
        ctx.addIssue({
            code: "custom",
            path: [precioFijo ? "precioBase" : "tarifaHora"],
            message: precioFijo
                ? "El precio base es obligatorio para la modalidad fija."
                : "La tarifa por hora es obligatoria para esta modalidad."
        });
    }

    if (precioNoAplicable != null) {
        ctx.addIssue({
            code: "custom",
            path: [precioFijo ? "tarifaHora" : "precioBase"],
            message: precioFijo
                ? "Deja vacía la tarifa por hora para usar un precio fijo."
                : "Deja vacío el precio base para usar una tarifa por hora."
        });
    }
};

const createTipoEventoSchema = z.object({
    body: tipoEventoBaseSchema.superRefine(validarModalidadPrecio)
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
        .superRefine((data, ctx) => {
            const actualizaPrecio = [
                "modalidadPrecio",
                "precioBase",
                "tarifaHora"
            ].some(campo => Object.hasOwn(data, campo));

            if (!actualizaPrecio) return;

            if (!data.modalidadPrecio || !Object.hasOwn(data, "precioBase") || !Object.hasOwn(data, "tarifaHora")) {
                ctx.addIssue({
                    code: "custom",
                    path: ["modalidadPrecio"],
                    message: "Al cambiar precios debes enviar la modalidad y ambos campos de precio."
                });
                return;
            }

            validarModalidadPrecio(data, ctx);
        })
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
