const express = require("express");

const controller = require("../controllers/encuesta-publica.controller");
const validator = require("../middlewares/validator.middleware");
const {
    consultarEncuestaSchema,
    responderEncuestaSchema
} = require("../schemas/encuesta-publica.schema");

const router = express.Router();

router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

router.post("/consultar",
    validator(consultarEncuestaSchema),
    controller.consultar
);

router.post("/responder",
    validator(responderEncuestaSchema),
    controller.responder
);

module.exports = router;