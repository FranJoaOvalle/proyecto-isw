const { z } = require('zod');

// Definición base para identificadores (enteros positivos compatibles con PostgreSQL)
const id = z.number().int().positive().max(2147483647);
const params = z.object({ id: z.coerce.number().int().positive().max(2147483647) });

// Esquema principal para la creación y actualización de presupuestos
const body = z.object({
    clienteId: id,
    tipoEventoId: id, // Reemplaza la antigua entidad Servicio
    inicio: z.string().datetime({ offset: true }).or(z.date()),
    fin: z.string().datetime({ offset: true }).or(z.date()),
    lugar: z.string().trim().min(3).max(255),
    asistentes: z.number().int().positive(), // Valor determinado por el control deslizante (slider) del cliente
    recursos: z.array(
        z.object({
            recursoId: id,
            cantidad: z.number().int().min(1).max(100000)
        }).strict()
    ).default([]), // Sustituye el modelo anterior de catálogo
    descuento: z.number().min(0).default(0),
    observaciones: z.string().trim().max(2000).nullable().optional()
}).strict().refine(
    data => new Set(data.recursos.map(r => r.recursoId)).size === data.recursos.length,
    'No se permiten recursos duplicados en el detalle del presupuesto.'
);

module.exports = {
    createSchema: z.object({ body }),
    updateSchema: z.object({ params, body }),
    idSchema: z.object({ params }),
    estadoSchema: z.object({ params, body: z.object({ estado: z.enum(['ACEPTADO', 'RECHAZADO', 'CANCELADO']) }).strict() })
};