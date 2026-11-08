const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const schema = require("../src/schemas/solicitud.schema");
const { normalizarRecinto, bloquearRecursos, verificarDisponibilidad } = require("../src/services/disponibilidad.service");
const usuarios = [
    { id: 1, rol: "ADMIN", activo: true }, { id: 2, rol: "CLIENTE", activo: true },
    { id: 3, rol: "CLIENTE", activo: true }, { id: 4, rol: "PRODUCTOR", activo: true }
];
const [admin, cliente, ajeno, productor] = usuarios;
const secreto = "test-only-solicitudes-secret-123456789";
const futuro = { inicio: new Date("2090-01-01T10:00:00Z"), fin: new Date("2090-01-01T12:00:00Z") };
let solicitud, auditoria, presupuestos, eventos, bloqueos, tipoActivo, actividad, productorActivo;
const permitido = where => !where.cliente || where.cliente.usuarioId === (solicitud.clienteId === 10 ? 2 : 3);
const vista = () => ({ ...solicitud, tipoEvento: { id: 20, nombre: "Matrimonio", activo: tipoActivo },
    presupuestos: presupuestos.filter(p => p.solicitudId === solicitud.id), evento: eventos.find(e => e.solicitudId === solicitud.id) ?? null });
const db = {
    $queryRaw: async (strings, ...valores) => { bloqueos.push({ sql: strings.join("?"), valores }); return strings[0].includes("SHOW") ? [{ transaction_isolation: "read committed" }] : []; },
    usuario: { findUnique: async ({ where }) => usuarios.find(u => u.id === where.id) },
    cliente: { findFirst: async ({ where }) => where.usuarioId === 2 || where.id === 10 ? { id: 10 } : null },
    tipoEvento: { findUnique: async ({ where }) => where.id === 20 ? { id: 20, activo: tipoActivo } : null },
    productor: { findFirst: async () => productorActivo ? { id: 40 } : null },
    solicitudEvento: {
        findFirst: async ({ where }) => where.id === solicitud.id && permitido(where) ? vista() : null,
        create: async ({ data }) => { solicitud = { ...data, id: 10, estado: "PENDIENTE" }; return vista(); },
        update: async ({ data }) => { Object.assign(solicitud, data); return vista(); },
        findMany: async ({ where }) => permitido(where) ? [vista()] : [],
        count: async ({ where }) => permitido(where) ? 1 : 0
    },
    solicitudEventoCambio: {
        create: async ({ data }) => { auditoria.push(data); return data; },
        findMany: async () => auditoria
    },
    presupuesto: { findUnique: async ({ where }) => {
        const p = presupuestos.find(p => p.id === where.id);
        return p ? { ...p, evento: eventos.find(e => e.presupuestoId === p.id) ?? null } : null;
    } },
    evento: {
        findFirst: async ({ where }) => eventos.find(e => e.id === where.id && (!where.productor || e.productorId === 40 && where.productor.usuarioId === 4)) ?? null,
        findUnique: async ({ where }) => eventos.find(e => e.id === where.id),
        findMany: async ({ where }) => eventos.filter(e => e.estado !== "CANCELADO" && e.id !== where.id?.not && e.inicio < where.inicio.lt && e.fin > where.fin.gt),
        create: async ({ data }) => { const e = { ...data, id: eventos.length + 1 }; eventos.push(e); return e; },
        update: async ({ where, data }) => { const e = eventos.find(e => e.id === where.id); Object.assign(e, data); return e; }
    },
    actividad: { findFirst: async () => actividad }
};
db.$transaction = async trabajo => {
    if (Array.isArray(trabajo)) return Promise.all(trabajo);
    const copia = structuredClone({ solicitud, auditoria, eventos });
    try { return await trabajo(db); }
    catch (error) { ({ solicitud, auditoria, eventos } = copia); throw error; }
};
require.cache[require.resolve("../src/config/prisma")] = { exports: db };
require.cache[require.resolve("../src/config/env")] = { exports: { JWT_SECRET: secreto } };
const service = require("../src/services/solicitud.service");
const { crearFormalizador, formalizarContratacion } = require("../src/services/formalizacion.service");
const eventoService = require("../src/services/evento.service");
beforeEach(() => {
    solicitud = { id: 10, clienteId: 10, tipoEventoId: 20, autorId: 2, ...futuro, asistentes: 30, lugar: "Salón Central", estado: "PENDIENTE" };
    auditoria = []; presupuestos = []; eventos = []; bloqueos = []; tipoActivo = true; actividad = null; productorActivo = true;
});
const datos = () => ({ tipoEventoId: 20, ...futuro, asistentes: 30 });
const propuesta = () => {
    solicitud.estado = "EN_REVISION";
    presupuestos.push({ id: 100, solicitudId: 10, clienteId: 10, tipoEventoId: 20, estado: "ACEPTADO", venceAt: new Date("2091-01-01"), ...futuro, asistentes: 30, lugar: "Salón Central" });
};
test("schema rechaza identidad/estado extra, fechas mal formadas y asistentes inválidos", () => {
    const d = { ...datos(), inicio: futuro.inicio.toISOString(), fin: futuro.fin.toISOString() };
    assert.equal(schema.crear.safeParse({ body: d }).success, true);
    for (const extra of [{ estado: "CONTRATADA" }, { autorId: 99 }, { asistentes: 0 }, { inicio: "ayer" }]) assert.equal(schema.crear.safeParse({ body: { ...d, ...extra } }).success, false);
    assert.equal(schema.cerrar.safeParse({ params: { id: 10 }, body: { motivo: " " } }).success, false);
});
test("creación propia auditada no genera Evento ni Presupuesto; rechaza suplantación y tipos inactivos", async () => {
    const s = await service.crear(datos(), cliente);
    assert.equal(s.clienteId, 10); assert.equal(auditoria[0].actorId, 2);
    assert.equal(eventos.length, 0); assert.equal(presupuestos.length, 0);
    await assert.rejects(service.crear({ ...datos(), clienteId: 10 }, cliente), { statusCode: 403 });
    await assert.rejects(service.crear(datos(), ajeno), { statusCode: 404 });
    tipoActivo = false;
    await assert.rejects(service.crear(datos(), cliente), { statusCode: 409 });
});
test("lectura y listado respetan ownership y no cambian estados", async () => {
    assert.equal((await service.detalle(10, cliente)).estado, "PENDIENTE");
    assert.equal((await service.listar({}, ajeno)).total, 0);
    await assert.rejects(service.detalle(10, ajeno), { statusCode: 404 });
    await assert.rejects(service.detalle(10, productor), { statusCode: 403 });
    assert.equal(auditoria.length, 0);
});
test("revisión explícita idempotente y edición auditada con bloqueo posterior al cliente", async () => {
    await service.editar(10, { asistentes: 45 }, cliente);
    assert.equal(auditoria[0].anterior.asistentes, 30); assert.equal(auditoria[0].nuevo.asistentes, 45);
    await service.revisar(10, admin); await service.revisar(10, admin);
    assert.equal(auditoria.filter(a => a.accion === "INICIO_REVISION").length, 1);
    await assert.rejects(service.editar(10, { asistentes: 50 }, cliente), { statusCode: 409 });
    await service.editar(10, { asistentes: 50 }, admin);
    presupuestos.push({ solicitudId: 10 });
    await assert.rejects(service.editar(10, { asistentes: 51 }, admin), { statusCode: 409 });
});
test("emisión interna solo con ADMIN activo y solicitud EN_REVISION", async () => {
    await assert.rejects(service.validarEmision({ tx: db, solicitudId: 10, actorId: 2 }), { statusCode: 403 });
    await assert.rejects(service.validarEmision({ tx: db, solicitudId: 10, actorId: 1 }), { statusCode: 409 });
    await service.revisar(10, admin);
    assert.equal((await service.validarEmision({ tx: db, solicitudId: 10, actorId: 1 })).id, 10);
});
test("retiro/rechazo con motivo; propuestas bloquean cierre; no hay reapertura", async () => {
    await service.cerrar(10, "Cambio de planes", cliente, true);
    assert.equal(solicitud.tipoCierre, "RETIRO_CLIENTE"); assert.equal(solicitud.estado, "RECHAZADA");
    assert.equal(auditoria[0].motivo, "Cambio de planes");
    await assert.rejects(service.revisar(10, admin), { statusCode: 409 });
    solicitud.estado = "EN_REVISION"; presupuestos.push({ solicitudId: 10 });
    await assert.rejects(service.cerrar(10, "No disponible", admin), { statusCode: 409 });
});
test("normaliza tildes, espacios y mayúsculas sin equiparar alias", () => {
    assert.equal(normalizarRecinto("  SALÓN   Central "), "salon central");
    assert.notEqual(normalizarRecinto("Salón Central"), normalizarRecinto("Salón Central, Concepción"));
});
test("bloqueos de recursos ordenados y sin claves nulas", async () => {
    await bloquearRecursos(db, ["Salón Central", " SALON CENTRAL "], [null, 40, 40]);
    assert.equal(bloqueos.length, 2);
    assert.deepEqual(bloqueos.map(b => b.valores[0]), ["productor:40", "recinto:salon central"]);
});
test("conflicto de recinto normalizado; intervalos adyacentes y cancelados no colisionan", async () => {
    eventos.push({ id: 1, ...futuro, estado: "CONFIRMADO", lugar: " SALON  CENTRAL ", productorId: null });
    await assert.rejects(verificarDisponibilidad(db, { ...futuro, lugar: "Salón Central", productorId: null }), { statusCode: 409 });
    await verificarDisponibilidad(db, { inicio: futuro.fin, fin: new Date("2090-01-01T14:00Z"), lugar: "Salón Central" });
    eventos[0].estado = "CANCELADO";
    await verificarDisponibilidad(db, { ...futuro, lugar: "Salón Central" });
});
test("formalización predeterminada cerrada sin evidencia comercial; no crea Evento", async () => {
    propuesta();
    await assert.rejects(formalizarContratacion({ tx: db, solicitudId: 10, presupuestoId: 100, actorId: 2 }), { statusCode: 409 });
    assert.equal(eventos.length, 0); assert.equal(solicitud.estado, "EN_REVISION");
});
test("contrato con adaptador servidor crea sin productor, audita y conserva idempotencia tras cancelación", async () => {
    propuesta(); let verificaciones = 0;
    const formalizar = crearFormalizador({ verificarAceptacion: async ({ tx }) => { assert.equal(tx, db); verificaciones++; } });
    const args = { tx: db, solicitudId: 10, presupuestoId: 100, actorId: 2 };
    const creado = await db.$transaction(tx => formalizar({ ...args, tx }));
    assert.equal(creado.productorId, null); assert.equal(creado.estado, "CONFIRMADO"); assert.equal(solicitud.estado, "CONTRATADA");
    assert.equal(auditoria[0].accion, "FORMALIZACION");
    creado.estado = "CANCELADO";
    assert.equal((await formalizar(args)).id, creado.id); assert.equal(eventos.length, 1); assert.equal(verificaciones, 1);
    assert.equal(solicitud.estado, "CONTRATADA");
    await assert.rejects(formalizar({ ...args, actorId: 3 }), { statusCode: 404 });
});
test("contrato rechaza presupuesto distinto, expirado, tipo inactivo y actor no cliente", async () => {
    propuesta(); const formalizar = crearFormalizador({ verificarAceptacion: async () => {} });
    const args = { tx: db, solicitudId: 10, presupuestoId: 100, actorId: 2 };
    tipoActivo = false; await assert.rejects(formalizar(args), { statusCode: 409 }); tipoActivo = true;
    presupuestos[0].venceAt = new Date("2000-01-01"); await assert.rejects(formalizar(args), { statusCode: 409 });
    await assert.rejects(formalizar({ ...args, actorId: 1 }), { statusCode: 403 });
    presupuestos[0].venceAt = new Date("2091-01-01"); await formalizar(args);
    presupuestos.push({ ...presupuestos[0], id: 101 });
    await assert.rejects(formalizar({ ...args, presupuestoId: 101 }), { statusCode: 409 });
});
test("rollback simulado de todas las escrituras si falla la auditoría", async () => {
    propuesta(); const formalizar = crearFormalizador({ verificarAceptacion: async () => {} });
    const original = db.solicitudEventoCambio.create;
    db.solicitudEventoCambio.create = async () => { throw new Error("fallo simulado"); };
    try {
        await assert.rejects(db.$transaction(tx => formalizar({ tx, solicitudId: 10, presupuestoId: 100, actorId: 2 })), /fallo simulado/);
        assert.equal(eventos.length, 0); assert.equal(solicitud.estado, "EN_REVISION");
    } finally { db.solicitudEventoCambio.create = original; }
});
test("asignación y reasignación ADMIN con auditoría; PRODUCTOR sin permisos", async () => {
    eventos.push({ id: 1, ...futuro, lugar: "Recinto", estado: "CONFIRMADO", productorId: null });
    await assert.rejects(eventoService.actualizar(1, { productorId: 40 }, productor), { statusCode: 403 });
    await eventoService.actualizar(1, { productorId: 40 }, admin);
    assert.equal(eventos[0].productorId, 40);
    assert.equal(eventos[0].cambios.create[0].campo, "productorId");
    assert.equal(eventos[0].cambios.create[0].valorAnterior, null);
    productorActivo = false;
    await assert.rejects(eventoService.actualizar(1, { productorId: 41 }, admin), { statusCode: 409 });
});
test("asignación bloquea conflicto de productor y Agenda", async () => {
    eventos.push({ id: 1, ...futuro, lugar: "Uno", estado: "CONFIRMADO", productorId: null }, { id: 2, ...futuro, lugar: "Dos", estado: "CONFIRMADO", productorId: 40 });
    await assert.rejects(eventoService.actualizar(1, { productorId: 40 }, admin), { statusCode: 409 });
    eventos.pop(); actividad = { id: 99 };
    await assert.rejects(eventoService.actualizar(1, { productorId: 40 }, admin), { statusCode: 409 });
});
test("HTTP usa JWT y bloquea PRODUCTOR y edición de terceros", async () => {
    const app = express(); app.use(express.json()); app.use("/solicitudes", require("../src/routes/solicitud.routes"));
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
    const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    async function request(path, u, method = "GET", body) {
        return fetch(`http://127.0.0.1:${server.address().port}/solicitudes${path}`, { method,
            headers: { "Content-Type": "application/json", ...(u ? { Authorization: `Bearer ${jwt.sign({ id_usuario: u.id }, secreto)}` } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}) });
    }
    try {
        assert.equal((await request("", null)).status, 401);
        assert.equal((await request("", productor)).status, 403);
        assert.equal((await request("/10", ajeno)).status, 404);
        assert.equal((await request("/10/revision", cliente, "POST")).status, 403);
        assert.equal((await request("/10", cliente)).status, 200);
        assert.equal(solicitud.estado, "PENDIENTE");
        assert.equal((await request("/10/revision", admin, "POST")).status, 200);
        assert.equal(solicitud.estado, "EN_REVISION");
        assert.equal((await request("/10/rechazo", admin, "POST", { motivo: " " })).status, 422);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
