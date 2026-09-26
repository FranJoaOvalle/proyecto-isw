const express = require("express");

const categoriaRoutes = require("./categoria.routes");

const router = express.Router();

router.use("/categorias", categoriaRoutes);

module.exports = router;