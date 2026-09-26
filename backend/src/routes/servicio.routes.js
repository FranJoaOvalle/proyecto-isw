const express = require("express");

const servicioController = require("../controllers/servicio.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createServiceSchema,
    updateServiceSchema,
    serviceIdSchema,
    getServicesSchema
} = require("../schemas/servicio.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(getServicesSchema),
    servicioController.getAll
);

router.get("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(serviceIdSchema),
    servicioController.getById
);

router.post("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createServiceSchema),
    servicioController.create
);

router.put("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(updateServiceSchema),
    servicioController.update
);

router.delete("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(serviceIdSchema),
    servicioController.remove
);

router.patch("/:id/reactivar",
    authorize("ADMIN"),
    validate(serviceIdSchema),
    servicioController.reactivate
);

module.exports = router;