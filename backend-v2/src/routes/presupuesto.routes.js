const express = require("express");
const controller = require("../controllers/presupuesto.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    createSchema,
    updateSchema,
    idSchema,
    estadoSchema,
    envioSchema,
    aceptacionSchema
} = require("../schemas/presupuesto.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorize("ADMIN", "CLIENTE"), controller.getAll);
router.post("/", authorize("ADMIN"), validator(createSchema), controller.create);
router.get("/:id", authorize("ADMIN", "CLIENTE"), validator(idSchema), controller.getById);
router.patch("/:id", authorize("ADMIN"), validator(updateSchema), controller.update);
router.patch("/:id/estado", authorize("ADMIN"), validator(estadoSchema), controller.cancelar);
router.post("/:id/enviar", authorize("ADMIN"), validator(envioSchema), controller.enviar);
router.post("/:id/previsualizar-envio", authorize("ADMIN"), validator(envioSchema), controller.previsualizarEnvio);
router.post("/:id/aceptar", authorize("CLIENTE"), validator(aceptacionSchema), controller.aceptar);

module.exports = router;
