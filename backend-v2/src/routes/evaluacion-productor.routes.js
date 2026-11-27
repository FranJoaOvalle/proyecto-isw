const express = require("express");
const controller = require("../controllers/evaluacion-productor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const rankingController = require("../controllers/ranking-productores.controller");

const { idParamSchema } = require("../schemas/_common.schema");
const { crearEvaluacionProductorSchema } = require("../schemas/evaluacion-productor.schema");
const { rankingProductoresSchema } = require("../schemas/ranking-productores.schema");

const router = express.Router();

router.use(authMiddleware, authorize("ADMIN"));

router.get("/eventos", controller.listarEventos);

router.get("/eventos/:id",
    validator(idParamSchema),
    controller.consultarEvento
);

router.post("/eventos/:id",
    validator(idParamSchema, crearEvaluacionProductorSchema),
    controller.crear
);

router.get("/productores/:id",
    validator(idParamSchema),
    controller.historialProductor
);

router.get("/ranking",
    validator(rankingProductoresSchema),
    rankingController.obtener
);

module.exports = router;