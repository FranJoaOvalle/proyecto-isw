import { Router } from 'express';
import { crearPresupuesto, obtenerPresupuestos, eliminarPresupuesto } from '../controllers/presupuesto.controller.js';
import { presupuestoSchema } from '../schemas/presupuesto.schema.js';

const router = Router();

// validador de Datos entrantes
const validarDatos = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ error: error.errors.map(e => e.message) });
  }
};



// Puerta GET (Leer): Llama directo a la función obtenerPresupuestos para traer todos los presupuestos activos
router.get('/', obtenerPresupuestos);

// Puerta POST (Crear): Primero pasa por el guardia Zod, si todo está bien, llama a la función crearPresupuesto para insertar el nuevo presupuesto en la base de datos
router.post('/', validarDatos(presupuestoSchema), crearPresupuesto);

// Puerta DELETE (Borrado Lógico): Le pasamos un ID en la URL para que sepa qué presupuesto eliminar, y llama a la función eliminarPresupuesto para cambiar su estado a INACTIVO
router.delete('/:id', eliminarPresupuesto);

export default router;