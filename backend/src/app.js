const express = require("express");
const cors = require("cors");
const path = require("path");

const indexRoutes = require("./routes/index.routes");
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", indexRoutes);

const frontendDist = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendDist));

app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
        return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
});

// IMPORTANTE: el manejo de errores debe registrarse después de las rutas.
app.use(errorHandler);

module.exports = app;