const express = require("express");

const authRoutes = require("./auth.routes");
const productorRoutes = require("./productor.routes");
const clienteRoutes = require("./cliente.routes");
const usuarioRoutes = require("./usuario.routes");
const tipoEventoRoutes = require("./tipoEvento.routes");
const actividadRoutes = require("./actividad.routes");
const recursoRoutes = require("./recurso.routes");
const espacioRoutes = require("./espacio.routes");
const vehiculoRoutes = require("./vehiculo.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/productores", productorRoutes);
router.use("/clientes", clienteRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/tipos-evento", tipoEventoRoutes);
router.use("/actividades", actividadRoutes);
router.use("/recursos", recursoRoutes);
router.use("/espacios", espacioRoutes);
router.use("/vehiculos", vehiculoRoutes);

module.exports = router;
