require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PrismaClient } = require("../generated/prisma/client");

test("PostgreSQL: persiste, filtra, protege eventos y conserva comentarios independientes", async () => {
    const prisma = new PrismaClient();
    const rollback = new Error("ROLLBACK_PRUEBA_SEGUIMIENTO");
    try {
        await assert.rejects(prisma.$transaction(async tx => {
            const sufijo = `${Date.now()}-${process.pid}`;
            const crearUsuario = (rol, nombre) => tx.usuario.create({ data: {
                email: `${nombre}-${sufijo}@example.test`, passwordHash: "solo-prueba-no-login", rol
            } });
            const admin = await crearUsuario("ADMIN", "admin");
            const usuarioProductor = await crearUsuario("PRODUCTOR", "productor");
            const otroProductor = await crearUsuario("PRODUCTOR", "otro");
            const usuarioCliente = await crearUsuario("CLIENTE", "cliente");
            const productor = await tx.productor.create({ data: {
                usuarioId: usuarioProductor.id, nombres: "Prueba", apellidos: "Seguimiento"
            } });
            const cliente = await tx.cliente.create({ data: { usuarioId: usuarioCliente.id, tipo: "PERSONA" } });
            const tipo = await tx.tipoEvento.create({ data: {
                nombre: `Prueba seguimiento ${sufijo}`, descripcion: "Fixture transaccional", precioBase: 100,
                modalidadPrecio: "FIJO", cantidadPersonasBase: 10
            } });
            const datos = {
                clienteId: cliente.id, tipoEventoId: tipo.id,
                inicio: new Date("2027-01-01T12:00:00Z"), fin: new Date("2027-01-01T14:00:00Z"),
                lugar: "Recinto de prueba", asistentes: 10
            };
            const presupuesto = await tx.presupuesto.create({ data: {
                ...datos, nombreTipoEvento: tipo.nombre, precioBaseTipoEvento: 100,
                subtotal: 100, recargoCliente: 0, total: 100, porcentajeAnticipo: 20, montoAnticipo: 20
            } });
            const evento = await tx.evento.create({ data: {
                ...datos, productorId: productor.id, presupuestoId: presupuesto.id
            } });

            // Reutiliza el servicio real dentro de una única transacción que se revierte.
            const configPath = require.resolve("../src/config/prisma");
            const servicePath = require.resolve("../src/services/seguimiento.service");
            const anterior = require.cache[configPath];
            require.cache[configPath] = { exports: new Proxy(tx, {
                get(target, prop) {
                    if (prop === "$transaction") return callback => callback(tx);
                    return target[prop];
                }
            }) };
            delete require.cache[servicePath];
            const service = require(servicePath);
            try {
                const registro = await service.crear(evento.id, {
                    descripcion: "Recinto CONFIRMADO", tipo: "HITO", importancia: "ALTA"
                }, usuarioProductor);
                assert.equal(registro.usuarioId, usuarioProductor.id);
                assert.ok(registro.createdAt instanceof Date);
                assert.equal(registro.usuario.passwordHash, undefined);
                assert.equal(registro.usuario.resetPasswordTokenHash, undefined);
                await service.crear(evento.id, { descripcion: "Otro registro", tipo: "NOVEDAD", importancia: "BAJA" }, admin);
                const lista = await service.historial(evento.id, {
                    buscar: "recinto confirmado", tipo: "HITO", importancia: "ALTA", usuarioId: usuarioProductor.id,
                    desde: new Date(Date.now() - 60000).toISOString(), hasta: new Date(Date.now() + 60000).toISOString()
                }, admin);
                assert.deepEqual(lista.map(r => r.id), [registro.id]);
                assert.equal((await service.historial(evento.id, { tipo: "INCIDENCIA" }, admin)).length, 0);
                assert.equal((await service.autores(evento.id, admin)).length, 2);
                await assert.rejects(service.crear(evento.id, { descripcion: "No autorizado", tipo: "HITO", importancia: "BAJA" }, otroProductor), { statusCode: 404 });
                await assert.rejects(service.comentar(evento.id, registro.id, { comentario: "No autorizado" }, otroProductor), { statusCode: 404 });
                await assert.rejects(service.historial(evento.id, {}, usuarioCliente), { statusCode: 403 });
                const comentario = await service.comentar(evento.id, registro.id, { comentario: "Confirmación revisada." }, admin);
                assert.equal(comentario.usuarioId, admin.id);
                assert.ok(comentario.createdAt instanceof Date);
                assert.equal((await service.comentarios(evento.id, registro.id, usuarioProductor)).length, 1);
                assert.equal((await service.registro(evento.id, registro.id, admin)).descripcion, "Recinto CONFIRMADO");
                assert.equal((await service.historial(evento.id, { tipo: "HITO" }, admin))[0]._count.comentarios, 1);
                await tx.evento.delete({ where: { id: evento.id } });
                assert.equal(await tx.seguimientoEvento.count({ where: { eventoId: evento.id } }), 0);
                assert.equal(await tx.comentarioSeguimiento.count({ where: { seguimientoId: registro.id } }), 0);
            } finally {
                if (anterior) require.cache[configPath] = anterior;
                else delete require.cache[configPath];
                delete require.cache[servicePath];
            }
            throw rollback;
        }, { timeout: 30000 }), error => error === rollback);
    } finally {
        await prisma.$disconnect();
    }
});
