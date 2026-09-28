const { z } = require("zod");

const ESTADOS_EVENTO = ["ORGANIZACION", "CONFIRMADO", "FINALIZADO", "CANCELADO"];

const eventoBaseSchema = z.object({
    clienteId: z.number().int().positive("El ID del cliente debe ser un número entero positivo."),
    tipoEvento: z.string().trim().min(2, "El tipo de evento debe tener al menos 2 caracteres.").max(100),
    fecha: z.string().datetime({ message: "Formato de fecha inválido. Debe usar formato ISO 8601 (ej. 2026-10-15T00:00:00.000Z)." }),
    horario: z.string().trim().min(1, "El horario es obligatorio."),
    cantidadAsistentes: z.number().int().positive("La cantidad de asistentes debe ser mayor a 0."),
    lugar: z.string().trim().min(2, "El lugar es obligatorio.").max(200),
    estado: z.string().trim().optional(),
    observaciones: z.string().trim().max(2000).nullable().optional()
}).strict();

const eventoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number()
            .int("El ID debe ser un número entero.")
            .positive("ID inválido.")
            .max(2147483647, "ID fuera de rango.")
    })
});

const createEventoSchema = z.object({
    body: eventoBaseSchema.extend({
        estado: eventoBaseSchema.shape.estado.default("ORGANIZACION")
    })
});

const updateEventoSchema = z.object({
    params: eventoIdSchema.shape.params,
    body: eventoBaseSchema
        .partial()
        .refine(
            data => Object.keys(data).length > 0,
            "Debe proporcionar al menos un campo para modificar."
        )
});

const updateEstadoEventoSchema = z.object({
    body: z.object({
        estado: z.enum(["ORGANIZACION", "CONFIRMADO", "FINALIZADO", "CANCELADO"], {
            errorMap: () => ({ message: "Estado de evento inválido." })
        })
    })
});

module.exports = {
    createEventoSchema,
    updateEventoSchema,
    eventoIdSchema,
    updateEstadoEventoSchema
};