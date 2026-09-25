const express = require("express");

const authRoutes = require("./auth.routes");
const clienteRoutes = require("./cliente.routes");
const personalRoutes = require("./personal.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/clientes", clienteRoutes);
router.use("/personal", personalRoutes);

module.exports = router;