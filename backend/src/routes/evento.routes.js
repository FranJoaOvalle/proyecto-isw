const { Router } = require('express');
const eventoController = require("../controllers/evento.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { 
    createEventoSchema, 
    updateEventoSchema, 
    eventoIdSchema 
} = require('../schemas/evento.schema');

const router = Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL", "CLIENTE"),
    eventoController.getEventos
);

router.get("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL", "CLIENTE"),
    validate(eventoIdSchema),
    eventoController.getEventoById
);

router.post("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createEventoSchema),
    eventoController.createEvento
);

router.put("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(updateEventoSchema),
    eventoController.updateEvento
);

router.patch("/:id/cancelar",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(eventoIdSchema),
    eventoController.cancelarEvento
);

module.exports = router;