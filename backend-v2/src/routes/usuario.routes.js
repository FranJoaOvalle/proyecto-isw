const express = require("express");
const usuarioController = require("../controllers/usuario.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    actualizarPerfilSchema,
    cambiarPasswordSchema
} = require("../schemas/usuario.schema");

const router = express.Router();

router.get("/me", authMiddleware, usuarioController.obtenerPerfil);

router.patch("/me",
    authMiddleware,
    validator(actualizarPerfilSchema),
    usuarioController.actualizarPerfil
);

router.patch("/me/password",
    authMiddleware,
    validator(cambiarPasswordSchema),
    usuarioController.cambiarPassword
);

router.patch("/me/desactivar",
    authMiddleware,
    authorize("CLIENTE", "PRODUCTOR"),
    usuarioController.desactivarCuenta
);

module.exports = router;