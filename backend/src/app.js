const express = require("express");
const cors = require("cors");
const indexRoutes = require('./routes/index.routes');
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", indexRoutes);

// IMPORTANTE: el manejo de errores debe registrarse después de las rutas.
app.use(errorHandler);

module.exports = app;