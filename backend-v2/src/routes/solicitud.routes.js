const express = require("express");
const solicitudController = require("../controllers/solicitud.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    crear: createSolicitudSchema,
    editar: updateSolicitudSchema,
    detalle: solicitudIdSchema,
    cerrar: cerrarSolicitudSchema,
    listar: getSolicitudesSchema
} = require("../schemas/solicitud.schema");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "CLIENTE"),
    validator(getSolicitudesSchema),
    solicitudController.listar
);

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "CLIENTE"),
    validator(createSolicitudSchema),
    solicitudController.crear
);

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "CLIENTE"),
    validator(solicitudIdSchema),
    solicitudController.detalle
);

router.get(
    "/:id/historial",
    authMiddleware,
    authorize("ADMIN", "CLIENTE"),
    validator(solicitudIdSchema),
    solicitudController.historial
);

router.patch(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "CLIENTE"),
    validator(updateSolicitudSchema),
    solicitudController.editar
);

router.post(
    "/:id/revision",
    authMiddleware,
    authorize("ADMIN"),
    validator(solicitudIdSchema),
    solicitudController.revisar
);

router.post(
    "/:id/rechazo",
    authMiddleware,
    authorize("ADMIN"),
    validator(cerrarSolicitudSchema),
    solicitudController.rechazar
);

router.post(
    "/:id/retiro",
    authMiddleware,
    authorize("CLIENTE"),
    validator(cerrarSolicitudSchema),
    solicitudController.retirar
);

module.exports = router;
