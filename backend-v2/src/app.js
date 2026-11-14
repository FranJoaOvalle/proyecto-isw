const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const routes = require("./routes/_index.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");
const NotFoundException = require("./exceptions/NotFoundException");

const app = express();

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

app.use((req, res, next) => {
    next(new NotFoundException("Ruta no encontrada."));
});

app.use(errorHandler);

module.exports = app;