const { z } = require("zod");

const id = z.coerce.number().int().positive().max(2147483647);
const params = z.object({ id });

const camposCotizacion = {
    descuento: z.number().finite().min(0).max(9999999999.99)
        .refine(
            (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
            "El descuento admite hasta dos decimales."
        ),
    inicio: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    fin: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    lugar: z.string().trim().min(3).max(255),
    asistentes: z.number().int().positive().max(1000000),
    recursos: z.array(
        z.object({
            recursoId: id,
            cantidad: z.number().int().min(1).max(100000)
        }).strict()
    )
};

const datosCreacion = z.object({
    ...camposCotizacion,
    descuento: camposCotizacion.descuento.default(0),
    recursos: camposCotizacion.recursos.default([])
}).strict();

const sinRecursosDuplicados = (data) =>
    !data.recursos ||
    new Set(data.recursos.map(({ recursoId }) => recursoId)).size === data.recursos.length;

module.exports = {
    createSchema: z.object({
        body: datosCreacion.extend({ solicitudId: id })
            .refine(
                sinRecursosDuplicados,
                "No se permiten recursos duplicados en el detalle del presupuesto."
            )
            .refine((data) => data.fin > data.inicio, {
                path: ["fin"],
                message: "La fecha de término debe ser posterior al inicio."
            })
    }),
    updateSchema: z.object({
        params,
        body: z.object(camposCotizacion).strict().partial()
            .refine(
                (data) => Object.keys(data).length > 0,
                "Debes proporcionar al menos un cambio."
            )
            .refine(
                sinRecursosDuplicados,
                "No se permiten recursos duplicados en el detalle del presupuesto."
            )
            .refine((data) => !data.inicio || !data.fin || data.fin > data.inicio, {
                path: ["fin"],
                message: "La fecha de término debe ser posterior al inicio."
            })
    }),
    idSchema: z.object({ params }),
    envioSchema: z.object({
        params,
        body: z.object({
            version: id,
            confirmarFactibilidad: z.literal(true),
            venceAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
            espacioId: id.nullable(),
            lugar: z.string().trim().min(3).max(255),
            direccion: z.string().trim().min(2).max(250),
            comuna: z.string().trim().min(2).max(100),
            referenciaDireccion: z.string().trim().max(500).nullable().optional()
        }).strict()
    }),
    aceptacionSchema: z.object({
        params,
        body: z.object({ version: id, aceptar: z.literal(true) }).strict()
    }),
    estadoSchema: z.object({
        params,
        body: z.object({ estado: z.enum(["CANCELADO"]) }).strict()
    })
};
