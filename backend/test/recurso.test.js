const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

// Sustituye solo la persistencia: se prueban rutas, JWT, permisos y validación.
const calls = [];
const readCalls = [];
let records = [];
const prismaPath = require.resolve("../src/db/prisma");
require.cache[prismaPath] = {
    id: prismaPath, filename: prismaPath, loaded: true,
    exports: { recurso: {
        findMany: async (options) => {
            readCalls.push(options);
            return [...records].sort((a, b) => a.nombre.localeCompare(b.nombre));
        },
        findUnique: async ({ where }) => {
            readCalls.push(where);
            return records.find(item => item.id_recurso === where.id_recurso) || null;
        },
        create: async ({ data }) => {
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

async function get(path = "", rol = "BODEGA") {
    const headers = {};
    if (rol) headers.Authorization = `Bearer ${jwt.sign({ id_usuario: 1, rol }, process.env.JWT_SECRET)}`;
    return fetch(url + path, { headers });
}

test("consulta un listado vacío y recursos en todos sus estados", async () => {
    records = [];
    const empty = await get();
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), []);
    records = [
        { id_recurso: 1, nombre: "Parlante", estado: "DISPONIBLE" },
        { id_recurso: 2, nombre: "Generador", estado: "EN_REPARACION" },
        { id_recurso: 3, nombre: "Foco", estado: "RETIRADO" }
    ];
    for (const rol of ["OPERACIONES_LOGISTICA", "BODEGA"]) {
        const response = await get("", rol);
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).map(item => item.id_recurso), [3, 2, 1]);
        assert.deepEqual(readCalls.at(-1), { orderBy: { nombre: "asc" } });
        const detail = await get("/3", rol);
        assert.equal(detail.status, 200);
        assert.deepEqual(await detail.json(), records[2]);
    }
});

test("responde 404 si el recurso no existe y 422 para identificadores inválidos", async () => {
    const missing = await get("/999");
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).message, "Recurso no encontrado.");
    const count = readCalls.length;
    for (const id of ["0", "-1", "1.5", "abc", "2147483648"]) {
        assert.equal((await get(`/${id}`)).status, 422);
    }
    assert.equal(readCalls.length, count);
});

test("protege listado y detalle contra consultas no autorizadas", async () => {
    const count = readCalls.length;
    for (const path of ["", "/1"]) {
        assert.equal((await get(path, null)).status, 401);
        for (const rol of ["CLIENTE", "COMERCIAL", "PRODUCCION", "ADMIN"]) {
            assert.equal((await get(path, rol)).status, 403);
        }
    }
    assert.equal(readCalls.length, count);
});
