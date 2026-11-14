const express = require("express");
const seguimientoController = require("../controllers/seguimiento.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    eventosSchema,
    eventoIdSchema,
    editarEventoSchema,
    historialSchema,
    registroSchema,
    detalleSchema,
    comentarioSchema,
    estadoEventoSchema
} = require("../schemas/seguimiento.schema");

const router = express.Router();

router.get(
    "/cliente",
    authMiddleware,
    authorize("CLIENTE"),
    seguimientoController.eventosCliente
);

router.get(
    "/cliente/:id",
    authMiddleware,
    authorize("CLIENTE"),
    validator(eventoIdSchema),
    seguimientoController.eventoCliente
);

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(eventosSchema),
    seguimientoController.eventos
);

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(eventoIdSchema),
    seguimientoController.evento
);

router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(editarEventoSchema),
    seguimientoController.editarEvento
);

router.patch(
    "/:id/estado",
    authMiddleware,
    authorize("ADMIN"),
    validator(estadoEventoSchema),
    seguimientoController.cambiarEstado
);

router.patch(
    "/:id/cancelar",
    authMiddleware,
    authorize("ADMIN"),
    validator(eventoIdSchema),
    seguimientoController.cancelarEvento
);

router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(eventoIdSchema),
    seguimientoController.eliminarEvento
);

router.get(
    "/:id/seguimiento",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(historialSchema),
    seguimientoController.historial
);

router.get(
    "/:id/seguimiento/autores",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(eventoIdSchema),
    seguimientoController.autores
);

router.post(
    "/:id/seguimiento",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(registroSchema),
    seguimientoController.crear
);

router.get(
    "/:id/seguimiento/:seguimientoId",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(detalleSchema),
    seguimientoController.registro
);

router.get(
    "/:id/seguimiento/:seguimientoId/comentarios",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(detalleSchema),
    seguimientoController.comentarios
);

router.post(
    "/:id/seguimiento/:seguimientoId/comentarios",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(comentarioSchema),
    seguimientoController.comentar
);

module.exports = router;
