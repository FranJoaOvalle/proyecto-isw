import { z } from 'zod';

export const createCategorySchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la categoria es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder los 80 caracteres')
    .trim(),

  descripcion: z
    .string()
    .max(500, 'La descripcion no puede exceder los 500 caracteres')
    .trim()
    .optional(),

  estado: z
    .boolean({ required_error: 'El estado de la categoria es obligatorio' })
});


export const updateCategorySchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder los 80 caracteres')
    .trim()
    .optional(),

  descripcion: z
    .string()
    .max(500, 'La descripcion no puede exceder los 500 caracteres')
    .trim()
    .optional(),

  estado: z
    .boolean()
    .optional()
});


export const idCategorySchema = z.object({
  id_categoria: z
    .coerce
    .number({ required_error: 'El ID de la categoria es obligatorio' })
    .int('El ID de categoria debe ser un numero entero')
    .positive('El ID de categoria debe ser mayor a 0')
});