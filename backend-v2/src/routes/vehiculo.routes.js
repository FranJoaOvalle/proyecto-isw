const express = require("express");
const controller = require("../controllers/vehiculo.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const schema = require("../schemas/vehiculo.schema");

const router = express.Router();
router.use(authMiddleware, authorize("ADMIN"));

router.get("/", validator(schema.getVehiculosSchema), controller.getAll);
router.get("/:id/reservas", validator(schema.vehiculoIdSchema), controller.reservas);
router.post("/:id/reservas", validator(schema.reservaVehiculoSchema), controller.reservar);
router.patch(
    "/:id/reservas/:reservaId/devolucion",
    validator(schema.devolucionVehiculoSchema),
    controller.registrarDevolucion
);
router.patch("/reservas/:id/cancelar", validator(schema.reservaIdSchema), controller.cancelarReserva);
router.get("/:id", validator(schema.vehiculoIdSchema), controller.getById);
router.post("/", validator(schema.createVehiculoSchema), controller.create);
router.patch("/:id", validator(schema.updateVehiculoSchema), controller.update);

module.exports = router;
