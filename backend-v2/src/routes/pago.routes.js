const express = require("express");
const controller = require("../controllers/pago.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const { listarSchema, registrarSchema, confirmarSchema, encuestaSchema } = require("../schemas/pago.schema");

const router = express.Router();

router.get("/", authMiddleware, authorize("ADMIN"), validator(listarSchema), controller.listar);
router.post("/", authMiddleware, authorize("ADMIN"), validator(registrarSchema), controller.registrar);
router.post("/:id/confirmar", authMiddleware, authorize("ADMIN"), validator(confirmarSchema), controller.confirmar);
router.post("/:id/encuesta", authMiddleware, authorize("ADMIN"), validator(encuestaSchema), controller.enviarEncuesta);

module.exports = router;
