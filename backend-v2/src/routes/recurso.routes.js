const express = require("express");
const controller = require("../controllers/recurso.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const schema = require("../schemas/recurso.schema");

const router = express.Router();
router.use(authMiddleware, authorize("ADMIN"));

router.get("/disponibilidad", validator(schema.getRecursosSchema), controller.getAll);
router.get("/", validator(schema.getRecursosSchema), controller.getAll);
router.get("/:id/reservas", validator(schema.recursoIdSchema), controller.reservas);
router.post("/:id/reservas", validator(schema.reservaRecursoSchema), controller.reservar);
router.patch(
    "/:id/reservas/:reservaId/devolucion",
    validator(schema.devolucionRecursoSchema),
    controller.registrarDevolucion
);
router.patch(
    "/reservas/:id/cancelar",
    validator(schema.reservaRecursoIdSchema),
    controller.cancelarReserva
);
router.get("/:id", validator(schema.recursoIdSchema), controller.getById);
router.post("/", validator(schema.createRecursoSchema), controller.create);
router.patch("/:id", validator(schema.updateRecursoSchema), controller.update);
router.patch(
    "/:id/estado",
    validator(schema.estadoRecursoSchema),
    controller.cambiarEstado
);

module.exports = router;
