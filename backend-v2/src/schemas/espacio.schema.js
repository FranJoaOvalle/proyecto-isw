const { z } = require("zod");

const params = z.object({
    id: z.coerce.number().int().positive().max(2147483647)
}).strict();

const fecha = z.iso.datetime({ offset: true }).transform(value => new Date(value));
const intervalo = {
    inicio: fecha,
    fin: fecha
};

const campos = {
    nombre: z.string().trim().min(2).max(100),
    direccion: z.string().trim().min(2).max(250),
    capacidad: z.coerce.number().int().positive().max(2147483647),
    costoArriendo: z.coerce.number().finite().min(0).max(9999999999.99).nullable().optional(),
    unidadArriendo: z.enum(["HORA", "DIA", "EVENTO"]).nullable().optional(),
    habilitado: z.boolean().optional(),
    observaciones: z.string().trim().max(2000).nullable().optional()
};

const espacioSchema = z.object({
    body: z.object({
        nombre: campos.nombre,
        direccion: campos.direccion,
        capacidad: campos.capacidad,
        costoArriendo: campos.costoArriendo,
        unidadArriendo: campos.unidadArriendo,
        habilitado: campos.habilitado,
        observaciones: campos.observaciones
    }).strict()
});

const updateEspacioSchema = z.object({
    params,
    body: z.object(Object.fromEntries(
        Object.entries(campos).map(([key, value]) => [key, value.optional()])
    )).strict().refine(
        data => Object.keys(data).length > 0,
        "Debe proporcionar al menos un campo para modificar."
    )
});

const disponibilidadSchema = z.object({
    query: z.object(intervalo).refine(
        data => data.fin > data.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const getEspaciosSchema = z.object({
    query: z.object({})
});

const estadoEspacioSchema = z.object({
    params,
    body: z.object({ habilitado: z.boolean() }).strict()
});

const espacioIdSchema = z.object({ params });

const reservaSchema = z.object({
    params,
    body: z.object({
        ...intervalo,
        eventoId: z.coerce.number().int().positive().max(2147483647).optional(),
        referencia: z.string().trim().min(2).max(150)
    }).strict().refine(
        data => data.fin > data.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const reservaIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
    }).strict()
});

module.exports = {
    espacioSchema,
    updateEspacioSchema,
    disponibilidadSchema,
    getEspaciosSchema,
    estadoEspacioSchema,
    espacioIdSchema,
    reservaSchema,
    reservaIdSchema
};
