const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

// Sustituye solo la persistencia: se prueban rutas, JWT, permisos y validación.
const calls = [];
const prismaPath = require.resolve("../src/db/prisma");
require.cache[prismaPath] = {
    id: prismaPath, filename: prismaPath, loaded: true,
    exports: { recurso: { create: async ({ data }) => {
        calls.push(data);
        return { id_recurso: 1, ...data };
    } } }
};

process.env.JWT_SECRET = "recurso-test-secret";
const app = express();
app.use(express.json());
app.use("/api", require("../src/routes/index.routes"));
app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
});

let server;
let url;
before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    url = `http://127.0.0.1:${server.address().port}/api/recursos`;
});
after(async () => {
    await new Promise(resolve => server.close(resolve));
});

const recurso = { tipo: " Sonido ", nombre: " Parlante activo ", cantidad: 2 };
async function post(body, rol) {
    const headers = { "Content-Type": "application/json" };
    if (rol) headers.Authorization = `Bearer ${jwt.sign({ id_usuario: 1, rol }, process.env.JWT_SECRET)}`;
    return fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
}

test("registra recursos para ambos roles y persiste datos normalizados", async () => {
    for (const rol of ["OPERACIONES_LOGISTICA", "BODEGA"]) {
        const response = await post(recurso, rol);
        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), {
            id_recurso: 1, tipo: "Sonido", nombre: "Parlante activo",
            cantidad: 2, estado: "DISPONIBLE"
        });
        assert.equal(calls.at(-1).nombre, "Parlante activo");
    }
});

test("rechaza solicitudes sin sesión y de roles ajenos a RF03", async () => {
    const count = calls.length;
    assert.equal((await post(recurso)).status, 401);
    for (const rol of ["CLIENTE", "PRODUCCION", "COMERCIAL", "ADMIN"]) {
        assert.equal((await post(recurso, rol)).status, 403);
    }
    assert.equal(calls.length, count);
});

test("rechaza cantidades inválidas, campos vacíos y estados desconocidos", async () => {
    const count = calls.length;
    for (const changes of [
        { cantidad: -1 }, { cantidad: 1.5 }, { cantidad: null },
        { cantidad: "2" }, { cantidad: 2147483648 }, { cantidad: undefined },
        { nombre: "  " }, { tipo: "" }, { estado: "INVALIDO" },
        { observaciones: "x".repeat(2001) }, { id_recurso: 9 }
    ]) {
        assert.equal((await post({ ...recurso, ...changes }, "BODEGA")).status, 422);
    }
    assert.equal(calls.length, count);
});

test("acepta stock cero, estado explícito y observaciones", async () => {
    const response = await post({ ...recurso, cantidad: 0,
        estado: "EN_REPARACION", observaciones: " Revisar cable " }, "BODEGA");
    assert.equal(response.status, 201);
    assert.equal((await response.json()).observaciones, "Revisar cable");
});
