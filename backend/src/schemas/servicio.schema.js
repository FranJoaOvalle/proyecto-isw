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
    .boolean({ required_error: 'El estado del servicio es obligatorio' }),

  id_categoria: z
    .coerce
    .number({ required_error: 'La categoria es obligatoria' })
    .int('El ID de categoria debe ser un numero entero')
    .positive('El ID de categoria debe ser mayor a 0')
});


export const updateServiceSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim()
    .optional(),

  descripcion: z
    .string()
    .min(10, 'La descripcion debe tener al menos 10 caracteres')
    .max(500, 'La descripcion no puede exceder los 500 caracteres')
    .trim()
    .optional(),

  precio_base: z
    .coerce
    .number()
    .positive('El precio base debe ser mayor a 0')
    .optional(),

  estado: z
    .boolean()
    .optional(),

  id_categoria: z
    .coerce
    .number()
    .int('El ID de categoria debe ser un numero entero')
    .positive('El ID de categoria debe ser mayor a 0')
    .optional()
});


export const idServiceSchema = z.object({
  id_servicio: z
    .coerce
    .number({ required_error: 'El ID del servicio es obligatorio' })
    .int('El ID de servicio debe ser un numero entero')
    .positive('El ID de servicio debe ser mayor a 0')
});