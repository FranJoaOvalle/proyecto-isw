const express = require("express");
const controller = require("../controllers/recurso.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const router = express.Router();

router.get("/", authMiddleware, authorize("ADMIN"), controller.listar);

module.exports = router;
