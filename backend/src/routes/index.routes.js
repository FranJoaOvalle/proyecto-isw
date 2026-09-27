const express = require("express");

const authRoutes = require("./auth.routes");
const clienteRoutes = require("./cliente.routes");
const personalRoutes = require("./personal.routes");
const categoriaRoutes = require("./categoria.routes");
const servicioRoutes = require("./servicio.routes");
const usuarioRoutes = require("./usuario.routes");
const recursoRoutes = require("./recurso.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/clientes", clienteRoutes);
router.use("/personal", personalRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/servicios", servicioRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/recursos", recursoRoutes);

module.exports = router;
