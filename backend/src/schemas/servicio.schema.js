import { z } from 'zod';

export const createServiceSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del servicio es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim(),

  descripcion: z
    .string({ required_error: 'La descripcion del servicio es obligatoria' })
    .min(10, 'La descripcion debe tener al menos 10 caracteres')
    .max(500, 'La descripcion no puede exceder los 500 caracteres')
    .trim(),

  precio_base: z
    .coerce
    .number({ required_error: 'El precio base es obligatorio' })
    .positive('El precio base debe ser mayor a 0'),

  estado: z
    .string({ required_error: 'El estado del servicio es obligatorio' })
    .refine(
      (valor) => ['ACTIVO', 'INACTIVO'].includes(valor),
      'El estado debe ser ACTIVO o INACTIVO'
    ),

  id_categoria: z
    .coerce
    .number({ required_error: 'La categoria es obligatoria' })
    .int('El ID de categoria debe ser un numero entero')
    .positive('El ID de categoria debe ser mayor a 0')
});