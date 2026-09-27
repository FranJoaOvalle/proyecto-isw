const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const usuarioController = require("../controllers/usuario.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/gestores",
    authorize("ADMIN"),
    usuarioController.getGestores
);

module.exports = router;