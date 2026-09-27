import { z } from 'zod';

// Manual de reglas que puede usar el backend para validar los datos de entrada de un presupuesto   
export const presupuestoSchema = z.object({ 
  clienteId: z.number({
    required_error: "El ID del cliente es obligatorio"
  }),
  descuento: z.number().min(0, "El descuento no puede ser negativo").optional().default(0),
  observaciones: z.string().optional(),
  
  // La lista de servicios solicitados (
  servicios: z.array(
    z.object({
      servicioId: z.number({
        required_error: "El ID del servicio es obligatorio"
      }),
      cantidad: z.number().int().min(1, "La cantidad debe ser al menos 1").default(1),
      precioUnitario: z.number().min(0, "El precio unitario no puede ser negativo"),
      subtotal: z.number().min(0, "El subtotal no puede ser negativo")
    })
  ).min(1, "El presupuesto debe incluir al menos un servicio")
});