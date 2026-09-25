const express = require("express");

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { loginSchema } = require("../schemas/auth.schema");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

console.log("authMiddleware:", typeof authMiddleware);
console.log("authController.me:", typeof authController.me);

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.me);

module.exports = router;