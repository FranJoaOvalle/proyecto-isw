const { z } = require("zod");

const id = z.coerce.number()
    .int()
    .positive()
    .max(2147483647);

const tiposSeguimiento = ["NOVEDAD", "INCIDENCIA", "OBSERVACION", "MODIFICACION", "HITO"];

const importanciasSeguimiento = ["BAJA", "MEDIA", "ALTA"];

const params = z.object({ id, seguimientoId: id.optional() });

const rangoFechas = {
    desde: z.iso.datetime({ offset: true }).optional(),
    hasta: z.iso.datetime({ offset: true }).optional()
};

const validarRango = (data) =>
    !data.desde || !data.hasta || new Date(data.hasta) > new Date(data.desde);

const eventoIdSchema = z.object({ params });

const eventosSchema = z.object({
    query: z.object({
        buscar: z.string().trim().max(200).optional(),
        estado: z
            .enum([
                "CONFIRMADO",
                "POSPUESTO",
                "EN_CURSO",
                "COMPLETADO",
                "CANCELADO"
            ])
            .optional()
    })
});

const historialSchema = z.object({
    params,
    query: z
        .object({
            buscar: z.string().trim().max(200).optional(),
            tipo: z.enum(tiposSeguimiento).optional(),
            importancia: z.enum(importanciasSeguimiento).optional(),
            usuarioId: id.optional(),
            ...rangoFechas
        })
        .refine(validarRango, "El término debe ser posterior al inicio.")
});

const registroSchema = z.object({
    params,
    body: z
        .object({
            descripcion: z.string().trim().min(1).max(5000),
            tipo: z.enum(tiposSeguimiento),
            importancia: z.enum(importanciasSeguimiento)
        })
        .strict()
});

const detalleSchema = z.object({ params: z.object({ id, seguimientoId: id }) });

const comentarioSchema = detalleSchema.extend({
    body: z
        .object({
            comentario: z.string().trim().min(1).max(2000)
        })
        .strict()
});

const editarEventoSchema = z.object({
    params,
    body: z
        .object({
            productorId: id.nullable().optional(),
            imagen_url: z
                .string()
                .trim()
                .max(2048)
                .url("La URL de imagen no es válida.")
                .refine((v) => /^https:\/\//i.test(v), "Utiliza una URL HTTPS.")
                .nullable()
                .optional(),
            inicio: z.iso
                .datetime({ offset: true })
                .transform((v) => new Date(v))
                .optional(),
            fin: z.iso
                .datetime({ offset: true })
                .transform((v) => new Date(v))
                .optional(),
            lugar: z.string().trim().min(2).max(250).optional(),
            asistentes: z.number().int().positive().max(2147483647).optional(),
            observaciones: z.string().trim().max(5000).nullable().optional()
        })
        .strict()
        .refine((v) => Object.keys(v).length > 0, "Debe proporcionar cambios.")
});

module.exports = {
    eventoIdSchema,
    eventosSchema,
    historialSchema,
    registroSchema,
    detalleSchema,
    comentarioSchema,
    editarEventoSchema
};
