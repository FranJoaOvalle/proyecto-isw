const express = require("express");

const categoriaController = require("../controllers/categoria.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    getCategoriesSchema
} = require("../schemas/categoria.schema");

const router = express.Router();

router.use(authMiddleware);

router.get("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(getCategoriesSchema),
    categoriaController.getAll
);

router.get("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(categoryIdSchema),
    categoriaController.getById
);

router.post("/",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(createCategorySchema),
    categoriaController.create
);

router.put("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(updateCategorySchema),
    categoriaController.update
);

router.delete("/:id",
    authorize("ADMIN", "PRODUCCION", "COMERCIAL"),
    validate(categoryIdSchema),
    categoriaController.remove
);

router.patch("/:id/reactivar",
    authorize("ADMIN"),
    validate(categoryIdSchema),
    categoriaController.reactivate
);

module.exports = router;