const express = require("express");
const authController = require("../controllers/auth.controller");
const validator = require("../middlewares/validator.middleware");
const {
    loginSchema,
    registroSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require("../schemas/auth.schema");

const router = express.Router();

router.post("/registro", validator(registroSchema), authController.registrar);
router.post("/login", validator(loginSchema), authController.login);

router.post("/forgot-password",
    validator(forgotPasswordSchema),
    authController.forgotPassword
);

router.post("/reset-password",
    validator(resetPasswordSchema),
    authController.resetPassword
);

module.exports = router;