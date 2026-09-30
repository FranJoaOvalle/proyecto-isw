const { Router } = require('express');
const { crearPresupuesto, obtenerPresupuestos, eliminarPresupuesto } = require('../controllers/presupuesto.controller.js');
const { createPresupuestoSchema } = require('../schemas/presupuesto.schema.js');

const router = Router();

// Middleware interceptor para validar la carga de datos entrante utilizando Zod
const validarDatos = (schema) => (req, res, next) => {
    try {
        const validado = schema.parse({ body: req.body, params: req.params, query: req.query });
        req.body = validado.body || req.body; 
        next();
    } catch (error) {
        return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
};

// Rutas de acceso para el módulo de presupuestos
router.get('/', obtenerPresupuestos);
router.post('/', validarDatos(createPresupuestoSchema), crearPresupuesto);
router.delete('/:id', eliminarPresupuesto);

module.exports = router;