const { z } = require("zod");
const params = z.object({ id: z.coerce.number().int().positive().max(2147483647) });
const fecha = z.iso.datetime({ offset: true }).transform(value => new Date(value));
const intervalo = { inicio: fecha, fin: fecha };
const base = z.object({
    nombre: z.string().trim().min(2).max(100),
    direccion: z.string().trim().min(2).max(250),
    capacidad: z.number().int().positive().max(2147483647),
    habilitado: z.boolean().default(true),
    observaciones: z.string().trim().max(2000).nullable().optional()
}).strict();
module.exports = {
    espacioIdSchema: z.object({ params }),
    createEspacioSchema: z.object({ body: base }),
    updateEspacioSchema: z.object({ params, body: base }),
    disponibilidadSchema: z.object({ query: z.object(intervalo).refine(d => d.fin > d.inicio, "El fin debe ser posterior al inicio.") }),
    reservaSchema: z.object({ params, body: z.object({
        ...intervalo, referencia: z.string().trim().min(2).max(150)
    }).strict().refine(d => d.fin > d.inicio, "El fin debe ser posterior al inicio.") })
};
