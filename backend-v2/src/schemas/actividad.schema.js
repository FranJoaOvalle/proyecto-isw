
const { z } = require("zod");

const tiposActividad = [
    "REUNION",
    "VISITA_RECINTO",
    "TAREA"
];

const estadosActividad = [
    "PENDIENTE",
    "COMPLETADA",
    "CANCELADA"
];

const estadosEvento = [
    "CONFIRMADO",
    "POSPUESTO",
    "EN_CURSO",
    "COMPLETADO",
    "CANCELADO"
];

const productorActividadSchema = z.object({
    productorId: z.coerce.number()
        .int("El ID del productor debe ser un número entero.")
        .positive("El ID del productor debe ser positivo."),

    esResponsable: z.boolean().optional().default(false)
});

const productoresActividadSchema = z.array(productorActividadSchema)
    .min(1, "Debe asignar al menos un productor.")
    .refine(
        productores => {
            const ids = productores.map(
                productor => productor.productorId
            );

            return new Set(ids).size === ids.length;
        },
        "No se puede asignar el mismo productor más de una vez."
    )
    .refine(
        productores => productores.filter(
            productor => productor.esResponsable
        ).length === 1,
        "Debe asignar exactamente un productor responsable."
    );

const actividadBaseSchema = z.object({
    titulo: z.string({
        required_error: "El título de la actividad es obligatorio."
    })
        .trim()
        .min(2, "El título debe tener al menos 2 caracteres.")
        .max(100, "El título no puede exceder 100 caracteres."),

    descripcion: z.string()
        .trim()
        .max(2000, "La descripción no puede exceder 2000 caracteres.")
        .optional()
        .nullable(),

    tipo: z.enum(tiposActividad, {
        required_error: "El tipo de actividad es obligatorio.",
        invalid_type_error: "El tipo de actividad no es válido."
    }),

    inicio: z.coerce.date({
        required_error: "La fecha de inicio es obligatoria.",
        invalid_type_error: "La fecha de inicio no es válida."
    }),

    fin: z.coerce.date({
        required_error: "La fecha de término es obligatoria.",
        invalid_type_error: "La fecha de término no es válida."
    }),

    lugar: z.string()
        .trim()
        .max(200, "El lugar no puede exceder 200 caracteres.")
        .optional()
        .nullable(),

    estado: z.enum(estadosActividad, {
        invalid_type_error: "El estado de la actividad no es válido."
    }).optional(),

    eventoId: z.coerce.number()
        .int("El ID del evento debe ser un número entero.")
        .positive("El ID del evento debe ser positivo.")
        .optional()
        .nullable(),

    productores: productoresActividadSchema.optional()
});

const createActividadSchema = z.object({
    body: actividadBaseSchema
        .omit({
            estado: true
        })
        .superRefine((data, ctx) => {
            if (data.fin <= data.inicio) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "La fecha de término debe ser posterior a la fecha de inicio.",
                    path: ["fin"]
                });
            }
        })
});

const updateActividadSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: actividadBaseSchema
        .omit({
            estado: true
        })
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
        .refine(
            data => data.inicio === undefined ||
                data.fin === undefined ||
                data.fin > data.inicio,
            {
                message: "La fecha de término debe ser posterior a la fecha de inicio.",
                path: ["fin"]
            }
        )
});

const actividadIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    })
});

const getActividadesSchema = z.object({
    query: z.object({
        tipo: z.enum(tiposActividad).optional(),

        estado: z.enum(estadosActividad).optional(),

        estadoActividad: z.enum(estadosActividad).optional(),

        estadoEvento: z.enum(estadosEvento).optional(),

        eventoId: z.coerce.number()
            .int()
            .positive("ID de evento inválido.")
            .optional(),

        productorId: z.coerce.number()
            .int()
            .positive("ID de productor inválido.")
            .optional(),

        inicio: z.coerce.date().optional(),

        fin: z.coerce.date().optional()
    })
});

const estadoActividadSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int()
            .positive("ID inválido.")
    }),

    body: z.object({
        estado: z.enum(estadosActividad, {
            required_error: "El estado de la actividad es obligatorio.",
            invalid_type_error: "El estado de la actividad no es válido."
        })
    })
});

module.exports = {
    createActividadSchema,
    updateActividadSchema,
    actividadIdSchema,
    getActividadesSchema,
    estadoActividadSchema
};