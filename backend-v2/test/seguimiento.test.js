const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const schema = require("../src/schemas/seguimiento.schema");

// Sustituye únicamente la persistencia y la configuración, manteniendo el JWT,
// middleware, rutas, controlador y servicio reales para las pruebas HTTP.
const admin = { id: 1, rol: "ADMIN", email: "admin@example.test", activo: true };
const productor = { id: 2, rol: "PRODUCTOR", email: "productor@example.test", activo: true };
const otro = { id: 3, rol: "PRODUCTOR", email: "otro@example.test", activo: true };
const cliente = { id: 4, rol: "CLIENTE", email: "cliente@example.test", activo: true };
const secret = "test-only-secret-for-seguimiento-123456789";
let registros, comentarios, llamadas;
const db = {
    usuario: {
        findUnique: async ({ where }) => [admin, productor, otro, cliente].find(u => u.id === where.id),
        findMany: async query => { llamadas.autores = query; return [productor]; }
    },
    evento: {
        findFirst: async ({ where }) => where.id === 10 && (!where.productor || where.productor.usuarioId === productor.id)
            ? { id: 10, productorId: 20 } : null,
        findMany: async query => { llamadas.eventos = query; return []; }
    },
    seguimientoEvento: {
        findFirst: async ({ where }) => registros.find(r => r.id === where.id && r.eventoId === where.eventoId),
        findMany: async query => { llamadas.historial = query; return registros; },
        create: async ({ data, include }) => {
            llamadas.crear = { data, include };
            const registro = { ...data, id: registros.length + 1, createdAt: new Date().toISOString() };
            registros.push(registro);
            return registro;
        }
    },
    comentarioSeguimiento: {
        findMany: async query => { llamadas.comentarios = query; return comentarios; },
        create: async ({ data }) => {
            const comentario = { ...data, id: comentarios.length + 1, createdAt: new Date().toISOString() };
            comentarios.push(comentario);
            return comentario;
        }
    },
    $transaction: async (callback, options) => { llamadas.transaccion = options; return callback(db); }
};
require.cache[require.resolve("../src/config/prisma")] = { exports: db };
require.cache[require.resolve("../src/config/env")] = { exports: { JWT_SECRET: secret } };
const service = require("../src/services/seguimiento.service");
const app = express();
app.use(express.json());
app.use("/eventos", require("../src/routes/seguimiento.routes"));
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(error.statusCode || 500).json({ message: error.message });
});

beforeEach(() => { registros = []; comentarios = []; llamadas = {}; });
const datos = { descripcion: "Se confirmó el recinto.", tipo: "HITO", importancia: "MEDIA" };

async function http(run) {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const request = async (path, usuario, method = "GET", body) => {
        const headers = { "Content-Type": "application/json" };
        if (usuario) headers.Authorization = `Bearer ${jwt.sign({ id_usuario: usuario.id }, secret)}`;
        return fetch(`http://127.0.0.1:${server.address().port}/eventos${path}`, {
            method, headers, ...(body ? { body: JSON.stringify(body) } : {})
        });
    };
    try { await run(request); }
    finally { await new Promise(resolve => server.close(resolve)); }
}

test("valida texto, enums y límites; rechaza autor o fecha enviados por el cliente", () => {
    const parse = body => schema.registroSchema.safeParse({ params: { id: "10" }, body });
    assert.equal(parse(datos).success, true);
    for (const body of [
        { ...datos, descripcion: "   " }, { ...datos, descripcion: "x".repeat(5001) },
        { ...datos, tipo: "TAREA" }, { ...datos, importancia: "URGENTE" },
        { ...datos, usuarioId: 99 }, { ...datos, createdAt: "2020-01-01" }
    ]) assert.equal(parse(body).success, false);
});

test("valida IDs, comentarios vacíos y rangos de fechas", () => {
    const editar = body => schema.editarEventoSchema.safeParse({ params: { id: 10 }, body });
    assert.equal(editar({ imagen_url: "https://example.test/image.jpg" }).success, true);
    for (const body of [{ imagen_url: "http://example.test/image.jpg" }, { imagen_url: "javascript:alert(1)" }, { imagen_url: "archivo" }, { asistentes: 0 }, { presupuestoId: 99 }, { estado: "COMPLETADO" }, {}]) {
        assert.equal(editar(body).success, false);
    }
    for (const id of ["0", "-1", "1.5", "abc", "2147483648"]) {
        assert.equal(schema.eventoIdSchema.safeParse({ params: { id } }).success, false);
    }
    for (const comentario of [" ", "x".repeat(2001)]) {
        assert.equal(schema.comentarioSchema.safeParse({ params: { id: 10, seguimientoId: 1 }, body: { comentario } }).success, false);
    }
    assert.equal(schema.historialSchema.safeParse({ params: { id: 10 }, query: { desde: "2026-11-08T00:00:00Z", hasta: "2026-11-07T00:00:00Z" } }).success, false);
});

test("lista eventos con alcance del productor y filtros combinados", async () => {
    await service.eventos({ estado: "CONFIRMADO", buscar: "Recinto" }, productor);
    assert.equal(llamadas.eventos.where.productor.usuarioId, 2);
    assert.equal(llamadas.eventos.where.estado, "CONFIRMADO");
    assert.equal(llamadas.eventos.where.OR[0].lugar.mode, "insensitive");
    await service.eventos({}, admin);
    assert.equal(llamadas.eventos.where.productor, undefined);
});

test("historial aplica búsqueda, autor, tipo, importancia y fechas con orden estable", async () => {
    await service.historial(10, { buscar: "recinto", tipo: "HITO", importancia: "ALTA", usuarioId: 2,
        desde: "2026-11-07T00:00:00Z", hasta: "2026-11-08T00:00:00Z" }, productor);
    const { where, orderBy, include } = llamadas.historial;
    assert.equal(where.eventoId, 10);
    assert.equal(where.evento.productor.usuarioId, 2);
    assert.equal(where.descripcion.contains, "recinto");
    assert.equal(where.tipo, "HITO");
    assert.equal(where.importancia, "ALTA");
    assert.equal(where.usuarioId, 2);
    assert.equal(where.createdAt.lt.toISOString(), "2026-11-08T00:00:00.000Z");
    assert.deepEqual(orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
    assert.equal(include.usuario.select.passwordHash, undefined);
    assert.equal(include.usuario.select.resetPasswordTokenHash, undefined);
});

test("autores se restringen al evento autorizado", async () => {
    await service.autores(10, productor);
    assert.equal(llamadas.autores.where.seguimientosEvento.some.eventoId, 10);
    assert.equal(llamadas.autores.select.passwordHash, undefined);
    await assert.rejects(service.autores(10, otro), { statusCode: 404 });
});

test("ninguna operación permite acceder a eventos ajenos", async () => {
    for (const action of [
        () => service.evento(10, otro), () => service.historial(10, {}, otro),
        () => service.crear(10, datos, otro), () => service.registro(10, 1, otro),
        () => service.comentarios(10, 1, otro), () => service.comentar(10, 1, { comentario: "Hola" }, otro)
    ]) await assert.rejects(action(), { statusCode: 404 });
    assert.equal(registros.length, 0);
    assert.equal(comentarios.length, 0);
});

test("HTTP exige JWT y rechaza CLIENTE en todas las rutas", async () => http(async request => {
    assert.equal((await request("/10/seguimiento")).status, 401);
    for (const [path, method, body] of [
        ["", "GET"], ["/10", "GET"], ["/10", "PATCH", { lugar: "Nuevo lugar" }], ["/10/cancelar", "PATCH"], ["/10", "DELETE"], ["/10/seguimiento", "GET"], ["/10/seguimiento/autores", "GET"],
        ["/10/seguimiento", "POST", datos], ["/10/seguimiento/1", "GET"],
        ["/10/seguimiento/1/comentarios", "GET"], ["/10/seguimiento/1/comentarios", "POST", { comentario: "Hola" }]
    ]) assert.equal((await request(path, cliente, method, body)).status, 403);
}));

test("HTTP crea registro con identidad y fecha del servidor, agrega comentario independiente", async () => http(async request => {
    const response = await request("/10/seguimiento", productor, "POST", datos);
    assert.equal(response.status, 201);
    const creado = await response.json();
    assert.equal(creado.usuarioId, 2);
    assert.ok(creado.createdAt);
    assert.equal(llamadas.crear.data.createdAt, undefined);
    assert.equal(llamadas.transaccion.isolationLevel, "Serializable");
    assert.equal((await request(`/10/seguimiento/${creado.id}`, admin)).status, 200);
    assert.equal((await request(`/10/seguimiento/${creado.id}/comentarios`, admin, "POST", { comentario: "Alternativa aprobada." })).status, 201);
    const lista = await request(`/10/seguimiento/${creado.id}/comentarios`, productor);
    assert.equal((await lista.json())[0].usuarioId, 1);
    assert.equal(registros[0].descripcion, datos.descripcion);
}));

test("HTTP rechaza suplantación, IDs inválidos, registros ajenos y comentarios vacíos", async () => http(async request => {
    assert.equal((await request("/10/seguimiento", productor, "POST", { ...datos, usuarioId: 1 })).status, 422);
    assert.equal((await request("/abc/seguimiento", admin)).status, 422);
    assert.equal((await request("/10/seguimiento/999/comentarios", productor, "POST", { comentario: "Hola" })).status, 404);
    registros.push({ id: 7, eventoId: 11, ...datos });
    assert.equal((await request("/10/seguimiento/7", admin)).status, 404);
    assert.equal((await request("/10/seguimiento/7/comentarios", admin, "POST", { comentario: " " })).status, 422);
    assert.equal((await request("/10/seguimiento", otro, "POST", datos)).status, 404);
}));
