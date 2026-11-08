const express = require("express");

const authRoutes = require("./auth.routes");
const productorRoutes = require("./productor.routes");
const clienteRoutes = require("./cliente.routes");
const usuarioRoutes = require("./usuario.routes");
const tipoEventoRoutes = require("./tipoEvento.routes");
const actividadRoutes = require("./actividad.routes");
const eventoRoutes = require("./seguimiento.routes");
const solicitudRoutes = require("./solicitud.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/productores", productorRoutes);
router.use("/clientes", clienteRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/tipos-evento", tipoEventoRoutes);
router.use("/actividades", actividadRoutes);
router.use("/eventos", eventoRoutes);
router.use("/solicitudes", solicitudRoutes);

module.exports = router;
