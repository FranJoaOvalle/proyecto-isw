const express = require("express");
const tipoEventoController = require("../controllers/tipoEvento.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");

const {
    createTipoEventoSchema,
    updateTipoEventoSchema,
    tipoEventoIdSchema,
    getTiposEventoSchema,
    estadoTipoEventoSchema
} = require("../schemas/tipoEvento.schema");

const router = express.Router();

router.get(
    "/",
    validator(getTiposEventoSchema),
    tipoEventoController.getAll
);

router.get(
    "/admin",
    authMiddleware,
    authorize("ADMIN"),
    validator(getTiposEventoSchema),
    tipoEventoController.getAllAdmin
);

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(tipoEventoIdSchema),
    tipoEventoController.getById
);

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    validator(createTipoEventoSchema),
    tipoEventoController.create
);

router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(updateTipoEventoSchema),
    tipoEventoController.update
);

router.patch(
    "/:id/estado",
    authMiddleware,
    authorize("ADMIN"),
    validator(estadoTipoEventoSchema, tipoEventoIdSchema),
    tipoEventoController.cambiarEstado
);

module.exports = router;