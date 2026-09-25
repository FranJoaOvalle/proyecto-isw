const express = require("express");

const personalController = require("../controllers/personal.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createPersonalSchema,
    updatePersonalSchema,
    personalIdSchema,
    createPersonalUsuarioSchema
} = require("../schemas/personal.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    personalController.getAll
);

router.post("/:id/usuario",
    authorize("ADMIN"),
    validate(createPersonalUsuarioSchema),
    personalController.createUsuario
);

router.get("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(personalIdSchema),
    personalController.getById
);

router.post("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createPersonalSchema),
    personalController.create
);

router.put("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(updatePersonalSchema),
    personalController.update
);

router.delete("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(personalIdSchema),
    personalController.remove
);

module.exports = router;