const { z } = require("zod");

const camposComunes = {
    nombre: z.string().trim().min(2).max(120),
    descripcion: z.string().trim().max(2000).nullable().optional(),
    precioUnitario: z.coerce.number().finite().min(0).max(9999999999.99),
    stockTotal: z.coerce.number().int().min(0).max(2147483647),
    cantidadEnMantencion: z.coerce.number().int().min(0).max(2147483647).default(0),
    cantidadPerdida: z.coerce.number().int().min(0).max(2147483647).default(0)
};

const materialSchema = z.object({
    ...camposComunes,
    tipo: z.literal("MATERIAL"),
    unidad: z.string().trim().max(50).nullable().optional()
}).strict();

const recursoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
    }).strict()
});

const getRecursosSchema = z.object({
    query: z.object({
        incluirInactivos: z.enum(["true", "false"])
            .transform(value => value === "true")
            .optional(),
        inicio: z.coerce.date().optional(),
        fin: z.coerce.date().optional()
    }).refine(
        query => (query.inicio === undefined) === (query.fin === undefined),
        "Debe indicar inicio y término para consultar disponibilidad."
    ).refine(
        query => query.inicio === undefined || query.fin > query.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const createRecursoSchema = z.object({
    body: materialSchema.refine(
        data => data.cantidadEnMantencion + data.cantidadPerdida <= data.stockTotal,
        "Las cantidades en mantención y perdidas no pueden superar el stock total."
    )
});

const updateRecursoSchema = z.object({
    params: recursoIdSchema.shape.params,
    body: z.object({
        nombre: camposComunes.nombre.optional(),
        descripcion: camposComunes.descripcion,
        precioUnitario: camposComunes.precioUnitario.optional(),
        stockTotal: camposComunes.stockTotal.optional(),
        cantidadEnMantencion: camposComunes.cantidadEnMantencion.removeDefault().optional(),
        cantidadPerdida: camposComunes.cantidadPerdida.removeDefault().optional(),
        unidad: z.string().trim().max(50).nullable().optional()
    }).strict().refine(
        data => Object.keys(data).length > 0,
        "Debe proporcionar al menos un campo para modificar."
    )
});

const estadoRecursoSchema = z.object({
    params: recursoIdSchema.shape.params,
    body: z.object({ activo: z.boolean() }).strict()
});

const reservaRecursoSchema = z.object({
    params: recursoIdSchema.shape.params,
    body: z.object({
        eventoId: z.coerce.number().int().positive().max(2147483647).optional(),
        referencia: z.string().trim().min(2).max(150),
        cantidad: z.coerce.number().int().positive().max(2147483647),
        inicio: z.coerce.date(),
        fin: z.coerce.date()
    }).strict().refine(
        data => data.fin > data.inicio,
        "La fecha de término debe ser posterior a la de inicio."
    )
});

const reservaRecursoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
    }).strict()
});

const devolucionRecursoSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive().max(2147483647),
        reservaId: z.coerce.number().int().positive().max(2147483647)
    }).strict(),
    body: z.object({
        cantidadDanada: z.coerce.number().int().min(0).max(2147483647),
        cantidadPerdida: z.coerce.number().int().min(0).max(2147483647),
        observacionesDevolucion: z.string().trim().max(2000).nullable().optional()
    }).strict()
});

module.exports = {
    getRecursosSchema,
    createRecursoSchema,
    updateRecursoSchema,
    recursoIdSchema,
    estadoRecursoSchema,
    reservaRecursoSchema,
    reservaRecursoIdSchema,
    devolucionRecursoSchema
};
