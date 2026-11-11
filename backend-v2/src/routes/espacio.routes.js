const express = require("express");
const controller = require("../controllers/espacio.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const schema = require("../schemas/espacio.schema");

const router = express.Router();
router.use(authMiddleware, authorize("ADMIN"));

router.get(
    "/disponibilidad",
    validator(schema.disponibilidadSchema),
    controller.getAll
);
router.get("/", validator(schema.getEspaciosSchema), controller.getAll);
router.post("/", validator(schema.espacioSchema), controller.create);
router.patch("/:id", validator(schema.updateEspacioSchema), controller.update);
router.patch(
    "/:id/estado",
    validator(schema.estadoEspacioSchema),
    controller.cambiarEstado
);
router.delete(
    "/:id",
    validator(schema.espacioIdSchema),
    controller.eliminar
);
router.patch(
    "/:id/ubicacion",
    validator(schema.ubicacionEspacioSchema),
    controller.guardarUbicacion
);
router.get(
    "/:id/reservas",
    validator(schema.espacioIdSchema),
    controller.reservas
);
router.post(
    "/:id/reservas",
    validator(schema.reservaSchema),
    controller.reservar
);
router.patch(
    "/reservas/:id/cancelar",
    validator(schema.reservaIdSchema),
    controller.cancelarReserva
);

module.exports = router;
