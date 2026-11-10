const express = require("express");
const controller = require("../controllers/presupuesto.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    createSchema,
    updateSchema,
    idSchema,
    estadoSchema
} = require("../schemas/presupuesto.schema");

const router = express.Router();

router.use(authMiddleware, authorize("ADMIN"));

router.get("/", controller.getAll);
router.post("/", validator(createSchema), controller.create);
router.get("/:id", validator(idSchema), controller.getById);
router.patch("/:id", validator(updateSchema), controller.update);
router.patch("/:id/estado", validator(estadoSchema), controller.cancelar);

module.exports = router;
