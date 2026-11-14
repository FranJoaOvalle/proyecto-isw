const express = require("express");
const productorController = require("../controllers/productor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const { idParamSchema } = require("../schemas/_common.schema");
const {
    crearProductorSchema,
    actualizarProductorSchema,
    estadoProductorSchema
} = require("../schemas/productor.schema");

const router = express.Router();

router.post("/",
    authMiddleware,
    authorize("ADMIN"),
    validator(crearProductorSchema),
    productorController.crear
);

router.get("/",
    authMiddleware,
    authorize("ADMIN"),
    productorController.listar
);

router.get("/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(idParamSchema),
    productorController.obtener
);

router.patch("/:id",
    authMiddleware,
    authorize("ADMIN"),
    validator(actualizarProductorSchema, idParamSchema),
    productorController.actualizar
);

router.patch("/:id/estado",
    authMiddleware,
    authorize("ADMIN"),
    validator(estadoProductorSchema, idParamSchema),
    productorController.cambiarEstado
);

module.exports = router;