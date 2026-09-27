const Joi = require('joi');

const presupuestoSchema = Joi.object({
  clienteId: Joi.number().required().messages({
    'any.required': 'El ID del cliente es obligatorio',
    'number.base': 'El ID del cliente debe ser un número'
  }),
  descuento: Joi.number().min(0).default(0).messages({
    'number.min': 'El descuento no puede ser negativo'
  }),
  observaciones: Joi.string().optional(),
  servicios: Joi.array().items(
    Joi.object({
      servicioId: Joi.number().required().messages({
        'any.required': 'El ID del servicio es obligatorio'
      }),
      cantidad: Joi.number().integer().min(1).default(1).messages({
        'number.min': 'La cantidad debe ser al menos 1'
      }),
      precioUnitario: Joi.number().min(0).required().messages({
        'number.min': 'El precio unitario no puede ser negativo'
      }),
      subtotal: Joi.number().min(0).required()
    })
  ).min(1).required().messages({
    'array.min': 'El presupuesto debe incluir al menos un servicio'
  })
});

module.exports = { presupuestoSchema };