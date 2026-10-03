const express = require("express");
const clienteController = require("../controllers/cliente.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {estadoClienteSchema} = require("../schemas/cliente.schema");
const {idParamSchema} = require("../schemas/_common.schema");

const router = express.Router();

router.get("/", authMiddleware, authorize("ADMIN"), clienteController.listar);

router.get("/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(idParamSchema),
    clienteController.obtener);

router.patch(
    "/:id/estado",
    authMiddleware,
    authorize("ADMIN"),
    validator(estadoClienteSchema, idParamSchema),
    clienteController.cambiarEstado
);

module.exports = router;