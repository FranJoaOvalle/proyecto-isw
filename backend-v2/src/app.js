const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const routes = require("./routes/_index.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");
const NotFoundException = require("./exceptions/NotFoundException");

const app = express();
const path = require("node:path");

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
    const usuarios = await prisma.usuario.count();

    res.json({
        status: "ok",
        service: "nes-eventos-api-v2",
        database: "ok",
        usuarios
    });
});

app.use("/api/v2", routes);

const frontendDist = path.resolve(__dirname, "../../frontend-v2/dist");

app.use(express.static(frontendDist));

app.use((req, res, next) => {
    if (
        req.method === "GET" &&
        !req.path.startsWith("/api/") &&
        req.path !== "/api" &&
        !path.extname(req.path) &&
        req.accepts("html")
    ) {
        return res.sendFile(path.join(frontendDist, "index.html"));
    }
    next();
});

app.use((req, res, next) => {
    next(new NotFoundException("Ruta no encontrada."));
});

app.use(errorHandler);

module.exports = app;