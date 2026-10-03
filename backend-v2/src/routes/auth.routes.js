const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validator = require("../middlewares/validator.middleware");
const {
    registroSchema,
    loginSchema
} = require("../schemas/auth.schema");

const router = express.Router();

router.post("/registro", validator(registroSchema), authController.registrar);
router.post("/login", validator(loginSchema), authController.login);

module.exports = router;