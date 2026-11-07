const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const schema = require("../schemas/seguimiento.schema");
const controller = require("../controllers/seguimiento.controller");

router.use(auth, authorize("ADMIN", "PRODUCTOR"));
router.get("/", validator(schema.eventosSchema), controller.eventos);
router.get("/:id", validator(schema.eventoIdSchema), controller.evento);
router.patch("/:id", authorize("ADMIN"), validator(schema.editarEventoSchema), controller.editarEvento);
router.patch("/:id/cancelar", authorize("ADMIN"), validator(schema.eventoIdSchema), controller.cancelarEvento);
router.delete("/:id", authorize("ADMIN"), validator(schema.eventoIdSchema), controller.eliminarEvento);
router.get("/:id/seguimiento", validator(schema.historialSchema), controller.historial);
router.get("/:id/seguimiento/autores", validator(schema.eventoIdSchema), controller.autores);
router.post("/:id/seguimiento", validator(schema.registroSchema), controller.crear);
router.get("/:id/seguimiento/:seguimientoId", validator(schema.detalleSchema), controller.registro);
router.get("/:id/seguimiento/:seguimientoId/comentarios", validator(schema.detalleSchema), controller.comentarios);
router.post("/:id/seguimiento/:seguimientoId/comentarios", validator(schema.comentarioSchema), controller.comentar);

module.exports = router;
