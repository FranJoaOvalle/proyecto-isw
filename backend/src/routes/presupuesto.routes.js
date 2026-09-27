const { Router } = require('express');
const { crearPresupuesto, obtenerPresupuestos, eliminarPresupuesto } = require('../controllers/presupuesto.controller.js');
const { presupuestoSchema } = require('../schemas/presupuesto.schema.js');

const router = Router();

// Middleware interceptor para validar la carga de datos entrante utilizando Joi
const validarDatos = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: error.details.map(e => e.message) });
  }
  req.body = value;
  next();
};

// Ruta GET para obtener la lista de presupuestos activos
router.get('/', obtenerPresupuestos);

// Ruta POST protegida por el middleware de validación para registrar un nuevo presupuesto
router.post('/', validarDatos(presupuestoSchema), crearPresupuesto);

// Ruta DELETE para aplicar el borrado lógico a un presupuesto específico mediante su ID
router.delete('/:id', eliminarPresupuesto);

module.exports = router;