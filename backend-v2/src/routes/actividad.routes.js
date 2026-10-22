const express = require("express");
const actividadController = require("../controllers/actividad.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");

const {
    createActividadSchema,
    updateActividadSchema,
    actividadIdSchema,
    getActividadesSchema,
    estadoActividadSchema
} = require("../schemas/actividad.schema");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(getActividadesSchema),
    actividadController.getAll
);

router.get(
    "/agenda",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(getActividadesSchema),
    actividadController.getAgenda
);

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(actividadIdSchema),
    actividadController.getById
);

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(createActividadSchema),
    actividadController.create
);

router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(updateActividadSchema),
    actividadController.update
);

router.patch(
    "/:id/estado",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(estadoActividadSchema, actividadIdSchema),
    actividadController.cambiarEstado
);

router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "PRODUCTOR"),
    validator(actividadIdSchema),
    actividadController.remove
);

router.delete(
    "/:id/fisico",
    authMiddleware,
    authorize("ADMIN"),
    validator(actividadIdSchema),
    actividadController.removePhysical
);

module.exports = router;