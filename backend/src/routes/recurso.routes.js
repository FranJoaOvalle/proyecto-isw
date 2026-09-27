const express = require("express");
const recursoController = require("../controllers/recurso.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { createRecursoSchema } = require("../schemas/recurso.schema");

const router = express.Router();

router.post("/",
    authMiddleware,
    authorize("OPERACIONES_LOGISTICA", "BODEGA"),
    validate(createRecursoSchema),
    recursoController.create
);

module.exports = router;
