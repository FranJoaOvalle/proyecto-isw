const { z } = require("zod");

// Define la estructura y valida los tipos de datos requeridos para el presupuesto
const presupuestoBaseSchema = z.object({
    clienteId: z.coerce.number().int().positive("El ID del cliente es obligatorio y debe ser válido."),
    descuento: z.coerce.number().min(0, "El descuento no puede ser negativo.").optional().default(0),
    observaciones: z.string().trim().optional().nullable(),
    servicios: z.array(
        z.object({
            servicioId: z.coerce.number().int().positive("El ID del servicio es obligatorio."),
            cantidad: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1.").default(1),
            precioUnitario: z.coerce.number().min(0, "El precio unitario no puede ser negativo.")
        })
    ).min(1, "El presupuesto debe incluir al menos un servicio.")
});

// Esquema para validar la creación de un nuevo registro
const createPresupuestoSchema = z.object({
    body: presupuestoBaseSchema
});

// Esquema para validar que el ID ingresado por parámetro sea correcto
const presupuestoIdSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive("ID inválido.")
    })
});

module.exports = {
    createPresupuestoSchema,
    presupuestoIdSchema
};