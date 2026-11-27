const express = require("express");
const encuestaController = require("../controllers/encuesta.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");

const { idParamSchema } = require("../schemas/_common.schema");

const {
    createEncuestaSchema,
    updateEncuestaSchema,
    estadoEncuestaSchema,
    getEncuestasSchema
} = require("../schemas/encuesta.schema");

const router = express.Router();

router.use(authMiddleware, authorize("ADMIN"));

router.get("/",
    validator(getEncuestasSchema),
    encuestaController.getAll
);

router.get("/:id",
    validator(idParamSchema),
    encuestaController.getById
);

router.post("/",
    validator(createEncuestaSchema),
    encuestaController.create
);

router.put("/:id",
    validator(idParamSchema, updateEncuestaSchema),
    encuestaController.update
);

router.patch("/:id/estado",
    validator(idParamSchema, estadoEncuestaSchema),
    encuestaController.cambiarEstado
);

router.put("/:id/predeterminada",
    validator(idParamSchema),
    encuestaController.establecerPredeterminada
);

router.get("/eventos/:id/respuesta",
    validator(idParamSchema),
    encuestaController.obtenerRespuestaEvento
);

module.exports = router;