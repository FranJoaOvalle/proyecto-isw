const { z } = require('zod');
const id = z.number().int().positive().max(2147483647);
const params = z.object({ id: z.coerce.number().int().positive().max(2147483647) });
const body = z.object({
    clienteId: id, eventoId: id,
    descuento: z.number().min(0).max(999999999999.99).default(0),
    observaciones: z.string().trim().max(2000).nullable().optional(),
    servicios: z.array(z.object({ servicioId: id, cantidad: z.number().int().min(1).max(100000) }).strict()).min(1).max(100)
}).strict().refine(d => new Set(d.servicios.map(s => s.servicioId)).size === d.servicios.length, 'No repita servicios en el presupuesto.');
module.exports = {
    createSchema: z.object({ body }),
    updateSchema: z.object({ params, body }),
    idSchema: z.object({ params }),
    estadoSchema: z.object({ params, body: z.object({ estado: z.enum(['ACEPTADO', 'RECHAZADO']) }).strict() })
};
