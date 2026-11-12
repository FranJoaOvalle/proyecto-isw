const { z } = require("zod");

const id = z.coerce.number().int().positive().max(2147483647);
const params = z.object({ id });

const camposCotizacion = {
    espacioId: id,
    precioBaseAcordado: z.number().finite().min(0).max(9999999999.99).multipleOf(0.01).nullable().optional(),
    descuento: z.number().finite().min(0).max(9999999999.99)
        .refine(
            (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
            "El descuento admite hasta dos decimales."
        ),
    inicio: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    fin: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    lugar: z.string().trim().min(3).max(255).optional(),
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
        body: z.object(camposCotizacion).strict().partial().extend({ version: id })
            .refine(
                (data) => Object.keys(data).some((campo) => campo !== "version"),
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
            arriendoIncluido: z.boolean(),
            totalConfirmado: z.number().finite().min(0).max(9999999999.99).optional(),
            venceAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
            espacioId: id,
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
