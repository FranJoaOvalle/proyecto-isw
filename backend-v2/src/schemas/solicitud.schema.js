const { z } = require("zod");
const id = z.coerce.number().int().positive().max(2147483647);
const campos = z.object({
    tipoEventoId: id,
    inicio: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    fin: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    asistentes: z.number().int().positive().max(1000000),
    lugar: z.string().trim().max(200).nullable().optional(),
    observaciones: z.string().trim().max(5000).nullable().optional()
});
const params = z.object({ id });
const createSolicitudSchema = z.object({
    body: campos.extend({ clienteId: id.optional() }).strict()
});
const updateSolicitudSchema = z.object({
    params,
    body: campos
        .partial()
        .strict()
        .refine((v) => Object.keys(v).length > 0, "Debes proporcionar cambios.")
});
const solicitudIdSchema = z.object({ params });
const cerrarSolicitudSchema = z.object({
    params,
    body: z.object({ motivo: z.string().trim().min(3).max(2000) }).strict()
});
const getSolicitudesSchema = z.object({
    query: z.object({
        buscar: z.string().trim().max(200).optional(),
        estado: z
            .enum(["PENDIENTE", "EN_REVISION", "CONTRATADA", "RECHAZADA"])
            .optional(),
        pagina: id.default(1),
        limite: id.max(100).default(20)
    })
});
module.exports = {
    crear: createSolicitudSchema,
    editar: updateSolicitudSchema,
    detalle: solicitudIdSchema,
    cerrar: cerrarSolicitudSchema,
    listar: getSolicitudesSchema
};
