const express = require("express");

const authRoutes = require("./auth.routes");
const productorRoutes = require("./productor.routes");
const clienteRoutes = require("./cliente.routes");
const usuarioRoutes = require("./usuario.routes");
const tipoEventoRoutes = require("./tipoEvento.routes");
const actividadRoutes = require("./actividad.routes");
const eventoRoutes = require("./seguimiento.routes");
const solicitudRoutes = require("./solicitud.routes");
const presupuestoRoutes = require("./presupuesto.routes");
const pagoRoutes = require("./pago.routes");
const recursoRoutes = require("./recurso.routes");
const espacioRoutes = require("./espacio.routes");
const vehiculoRoutes = require("./vehiculo.routes");
const encuestaRoutes = require("./encuesta.routes");
const encuestaPublicaRoutes = require("./encuesta-publica.routes");
const evaluacionProductorRoutes = require("./evaluacion-productor.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/productores", productorRoutes);
router.use("/clientes", clienteRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/tipos-evento", tipoEventoRoutes);
router.use("/actividades", actividadRoutes);
router.use("/eventos", eventoRoutes);
router.use("/solicitudes", solicitudRoutes);
router.use("/presupuestos", presupuestoRoutes);
router.use("/pagos", pagoRoutes);
router.use("/recursos", recursoRoutes);
router.use("/espacios", espacioRoutes);
router.use("/vehiculos", vehiculoRoutes);
router.use("/encuestas", encuestaRoutes);
router.use("/encuestas-publicas", encuestaPublicaRoutes);
router.use("/evaluaciones-productores", evaluacionProductorRoutes);

module.exports = router;
