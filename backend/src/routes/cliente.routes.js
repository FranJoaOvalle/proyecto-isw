const express = require("express");

const clienteController = require("../controllers/cliente.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createClienteSchema,
    updateClienteSchema,
    clienteIdSchema,
    createClienteUsuarioSchema
} = require("../schemas/cliente.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    clienteController.getAll
);

router.post("/:id/usuario",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createClienteUsuarioSchema),
    clienteController.createUsuario
);

router.get("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(clienteIdSchema),
    clienteController.getById
);

router.post("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createClienteSchema),
    clienteController.create
);

router.put("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(updateClienteSchema),
    clienteController.update
);

router.delete("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(clienteIdSchema),
    clienteController.remove
);

module.exports = router;