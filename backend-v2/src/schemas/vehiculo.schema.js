const { z } = require("zod");

const params = z.object({
    id: z.coerce.number().int().positive().max(2147483647)
}).strict();

const fecha = z.coerce.date();

const campos = {
    patente: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{5,15}$/, "La patente debe tener entre 5 y 15 letras, números o guiones."),
    tipo: z.string().trim().min(2).max(60),
    marca: z.string().trim().min(2).max(60),
    modelo: z.string().trim().min(1).max(80),
    anio: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
    capacidadPasajeros: z.coerce.number().int().positive().max(2147483647).nullable().optional(),
    estado: z.enum(["DISPONIBLE", "EN_MANTENCION", "RETIRADO"]).optional(),
    habilitado: z.boolean().optional(),
    observaciones: z.string().trim().max(2000).nullable().optional()
};

const getVehiculosSchema = z.object({
    query: z.object({
        inicio: fecha.optional(),
        fin: fecha.optional(),
        incluirRetirados: z.enum(["true", "false"]).transform(value => value === "true").optional()
    }).refine(
        query => (query.inicio === undefined) === (query.fin === undefined),
        "Debe indicar inicio y término para consultar disponibilidad."
    ).refine(
        query => query.inicio === undefined || query.fin > query.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const createVehiculoSchema = z.object({
    body: z.object({
        patente: campos.patente,
        tipo: campos.tipo,
        marca: campos.marca,
        modelo: campos.modelo,
        anio: campos.anio,
        capacidadPasajeros: campos.capacidadPasajeros,
        estado: campos.estado,
        observaciones: campos.observaciones
    }).strict()
});

const updateVehiculoSchema = z.object({
    params,
    body: z.object(Object.fromEntries(
        Object.entries(campos).map(([key, schema]) => [key, schema.optional()])
    )).strict().refine(
        data => Object.keys(data).length > 0,
        "Debe proporcionar al menos un campo para modificar."
    )
});

const reservaVehiculoSchema = z.object({
    params,
    body: z.object({
        eventoId: z.coerce.number().int().positive().max(2147483647).optional(),
        referencia: z.string().trim().min(2).max(150),
        inicio: fecha,
        fin: fecha
    }).strict().refine(
        data => data.fin > data.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const vehiculoIdSchema = z.object({ params });

const reservaIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
    }).strict()
});

const devolucionVehiculoSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647),
        reservaId: z.coerce.number().int().positive().max(2147483647)
    }).strict(),
    body: z.object({
        estadoDevolucion: z.enum(["CONFORME", "CON_OBSERVACIONES"]),
        observacionesDevolucion: z.string().trim().max(2000).nullable().optional()
    }).strict().refine(
        data => data.estadoDevolucion !== "CON_OBSERVACIONES" || Boolean(data.observacionesDevolucion?.trim()),
        "Describe el daño o la novedad detectada al devolver el vehículo."
    )
});

module.exports = {
    getVehiculosSchema,
    createVehiculoSchema,
    updateVehiculoSchema,
    reservaVehiculoSchema,
    vehiculoIdSchema,
    reservaIdSchema,
    devolucionVehiculoSchema
};
