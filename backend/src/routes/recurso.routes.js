const express = require("express");
const recursoController = require("../controllers/recurso.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createRecursoSchema,
    updateRecursoSchema,
    recursoIdSchema
} = require("../schemas/recurso.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"),
    recursoController.getAll
);

router.get("/:id",
    authorize("ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"),
    validate(recursoIdSchema),
    recursoController.getById
);

router.post("/",
    authorize("ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"),
    validate(createRecursoSchema),
    recursoController.create
);

router.put("/:id",
    authorize("ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"),
    validate(updateRecursoSchema),
    recursoController.update
);

router.delete("/:id",
    authorize("ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"),
    validate(recursoIdSchema),
    recursoController.remove
);

module.exports = router;
