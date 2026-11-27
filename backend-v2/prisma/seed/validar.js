const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("../../generated/prisma/client");
const { validarRut } = require("../../src/utils/rut");
const respuestasValidas = require("../../src/utils/validarRespuestasEncuesta");
const integracion = require("../../src/services/integracionPresupuestos.service");
const recursos = require("../../src/services/contratacionRecursos.service");
const { HORA, solapan, modelos } = require("./modelo");

function integridad(s) {
    const { db } = s;
    // El generador prisma-client 6.19 expone aquí los metadatos del esquema sin conectar.
    const meta = new PrismaClient()._runtimeDataModel;
    assert.deepEqual([...modelos].sort(), Object.keys(meta.models).sort());
    for (const [nombre, m] of Object.entries(meta.models)) {
        const filas = db[nombre];
        assert(filas.length, "Entidad sin cobertura: " + nombre);
        const claves = [...m.uniqueFields, ...m.fields.filter(f => f.isId || f.isUnique).map(f => [f.name])];
        if (m.primaryKey) claves.push(m.primaryKey.fields);
        for (const campos of claves) {
            const valores = filas.filter(r => campos.every(k => r[k] != null)).map(r => JSON.stringify(campos.map(k => r[k])));
            assert.equal(new Set(valores).size, valores.length, nombre + "." + campos);
        }
        for (const f of m.fields) {
            if (f.relationFromFields?.length) {
                const ids = new Set(db[f.type].map(r => r[f.relationToFields[0]]));
                for (const r of filas) if (r[f.relationFromFields[0]] != null) assert(ids.has(r[f.relationFromFields[0]]), nombre + "." + f.name);
            }
            if (f.kind !== "object" && f.isRequired && !f.hasDefaultValue && !f.isUpdatedAt) {
                for (const r of filas) assert(r[f.name] != null, nombre + "." + f.name + " obligatorio");
            }
            if (f.kind === "enum") {
                const valores = new Set(meta.enums[f.type].values.map(v => v.name));
                for (const r of filas) if (r[f.name] != null) assert(valores.has(r[f.name]), nombre + "." + f.name);
            }
        }
        for (const r of filas) {
            if (r.createdAt) assert(r.createdAt <= s.ahora && (!r.updatedAt || r.createdAt <= r.updatedAt && r.updatedAt <= s.ahora), nombre + " fechas " + r.id);
            if (r.inicio) assert(r.inicio < r.fin, nombre + " intervalo");
        }
    }
    for (const u of db.Usuario) {
        const c = db.Cliente.find(c => c.usuarioId === u.id);
        const p = db.Productor.find(p => p.usuarioId === u.id);
        assert.equal(Boolean(c), u.rol === "CLIENTE");
        assert.equal(Boolean(p), u.rol === "PRODUCTOR");
        if (!c) continue;
        const persona = db.ClientePersona.find(x => x.clienteId === c.id);
        const empresa = db.ClienteEmpresa.find(x => x.clienteId === c.id);
        assert.equal(Boolean(persona), c.tipo === "PERSONA");
        assert.equal(Boolean(empresa), c.tipo === "EMPRESA");
        assert(validarRut(persona?.rut ?? empresa.rutEmpresa));
    }
}

function imagenes(s) {
    const archivos = new Set();
    const frontend = path.resolve(__dirname, "../../../frontend-v2");
    const directorio = ["public", "dist"].map(raiz => path.join(frontend, raiz, "assets/img/catalogo"))
        .find(ruta => fs.existsSync(ruta));
    assert(directorio, "Faltan las fotos del catálogo en frontend-v2/public o frontend-v2/dist.");
    for (const tipo of s.db.TipoEvento) {
        const prefijo = s.web + "/assets/img/catalogo/";
        assert(tipo.imagen_url.startsWith(prefijo));
        const archivo = tipo.imagen_url.slice(prefijo.length);
        assert(/^[a-z-]+\.webp$/.test(archivo) && !archivos.has(archivo));
        const bytes = fs.readFileSync(path.join(directorio, archivo));
        assert(bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" &&
            bytes.readUInt32LE(4) + 8 === bytes.length && bytes.length > 1000, "WebP dañado: " + archivo);
        let imagenValida = false;
        let offset = 12;
        while (offset + 8 <= bytes.length) {
            const longitud = bytes.readUInt32LE(offset + 4);
            const inicio = offset + 8;
            assert(inicio + longitud <= bytes.length, "Bloque WebP truncado: " + archivo);
            // Las fotografías del catálogo usan cuadros VP8 con o sin metadatos VP8X.
            if (bytes.toString("ascii", offset, offset + 4) === "VP8 " && longitud > 10) {
                imagenValida = bytes.toString("hex", inicio + 3, inicio + 6) === "9d012a" &&
                    (bytes.readUInt16LE(inicio + 6) & 0x3fff) === 960 &&
                    (bytes.readUInt16LE(inicio + 8) & 0x3fff) === 576;
            }
            offset = inicio + longitud + (longitud % 2);
        }
        assert(imagenValida && offset === bytes.length, "Fotografía o dimensiones incorrectas: " + archivo);
        archivos.add(archivo);
    }
    return archivos.size;
}

async function contratos(s) {
    const { db } = s;
    for (const solicitud of db.SolicitudEvento) {
        assert.equal(db.Evento.some(e => e.solicitudId === solicitud.id), solicitud.estado === "CONTRATADA");
        const usuarioId = db.Cliente[solicitud.clienteId - 1].usuarioId;
        const usuario = db.Usuario[usuarioId - 1];
        assert(usuario.activo && usuario.createdAt <= solicitud.createdAt && usuario.id === solicitud.autorId);
        const historial = db.SolicitudEventoCambio.filter(x => x.solicitudId === solicitud.id);
        assert(historial[0].accion === "CREACION" && +historial[0].createdAt === +solicitud.createdAt);
        assert(historial.every((x,i) => x.createdAt <= solicitud.updatedAt && (!i || x.createdAt >= historial[i-1].createdAt)));
        assert.equal(Boolean(solicitud.motivoCierre && solicitud.tipoCierre), solicitud.estado === "RECHAZADA");
    }
    for (const p of db.Presupuesto) {
        const sol = db.SolicitudEvento[p.solicitudId - 1];
        const e = db.Evento.find(e => e.presupuestoId === p.id);
        assert.equal(sol.clienteId, p.clienteId);
        assert.equal(sol.tipoEventoId, p.tipoEventoId);
        assert(sol.createdAt <= p.createdAt && p.createdAt < p.inicio);
        assert.equal(Boolean(e), p.estado === "ACEPTADO");
        if (e) assert.equal(sol.estado, "CONTRATADA");
        if (p.enviadoAt) assert(p.enviadoAt >= p.createdAt && p.enviadoAt < p.venceAt && p.venceAt <= p.inicio && db.Usuario[p.enviadoPorId - 1].rol === "ADMIN");
        if (p.estado === "ENVIADO") assert(p.venceAt > s.ahora && sol.estado === "EN_REVISION");
        if (p.estado === "VENCIDO") assert(p.venceAt <= s.ahora);
        const horas = (p.fin - p.inicio) / HORA;
        const tipo = db.TipoEvento[p.tipoEventoId - 1];
        assert(p.asistentes >= p.cantidadPersonasBaseTipoEvento && p.asistentes <= db.Espacio[p.espacioId - 1].capacidad);
        assert.equal(p.precioBaseCatalogo, tipo.precioBase ?? horas * tipo.tarifaHora);
        assert.equal(p.precioBaseTipoEvento, p.precioBaseAcordado ?? p.precioBaseCatalogo);
        const unidades = p.unidadArriendoEspacio === "HORA" ? horas : p.unidadArriendoEspacio === "DIA" ? Math.ceil(horas / 24) : 1;
        const arriendo = !p.enviadoAt || p.arriendoIncluido ? 0 : unidades * p.costoArriendoEspacio;
        assert.equal(p.subtotalArriendoEspacio ?? 0, arriendo);
        const lineas = db.PresupuestoRecurso.filter(l => l.presupuestoId === p.id);
        for (const l of lineas) assert.equal(l.subtotal, l.cantidad * l.precioUnitario);
        assert.equal(p.subtotal, p.precioBaseTipoEvento + arriendo + lineas.reduce((a,l) => a + l.subtotal, 0));
        assert.equal(p.total, p.subtotal - p.descuento + p.recargoCliente);
        assert.equal(p.montoAnticipo, p.total * 0.3);
        const pagos = db.Pago.filter(x => x.presupuestoId === p.id);
        if (!e) { assert.equal(pagos.length, 0); continue; }
        await integracion.verificarAceptacion({ presupuesto: p, actorId: sol.autorId, version: p.version });
        assert(p.enviadoAt <= p.aceptadoAt && p.aceptadoAt <= e.createdAt && e.createdAt < e.inicio);
        for (const k of ["clienteId", "tipoEventoId", "asistentes", "solicitudId", "espacioId", "lugar", "inicio", "fin"]) assert.deepEqual(e[k], p[k]);
        const compromisos = pagos.filter(x => ["PAGADO", "PENDIENTE"].includes(x.estado));
        const anticipo = compromisos.filter(x => x.tipo === "ANTICIPO").reduce((n,x) => n + x.monto, 0);
        const saldo = compromisos.filter(x => x.tipo === "SALDO").reduce((n,x) => n + x.monto, 0);
        assert.equal(anticipo, e.estado === "CANCELADO" ? 0 : p.montoAnticipo);
        assert.equal(saldo, e.estado === "CANCELADO" ? 0 : p.total - p.montoAnticipo);
        assert(pagos.every(x => Boolean(x.fechaPago) === ["PAGADO", "REEMBOLSADO"].includes(x.estado)));
        for (const pago of pagos) assert(pago.monto > 0 && pago.createdAt >= p.aceptadoAt &&
            (!pago.fechaPago || pago.fechaPago >= pago.createdAt && pago.fechaPago <= s.ahora));
        if (e.estado === "COMPLETADO") assert(e.fin <= s.ahora && compromisos.every(x => x.estado === "PAGADO"));
        if (e.estado === "EN_CURSO") assert(e.inicio <= s.ahora && s.ahora < e.fin);
        if (["CONFIRMADO", "POSPUESTO"].includes(e.estado)) assert(e.inicio > s.ahora);
        const asignados = db.EventoRecurso.filter(r => r.eventoId === e.id);
        assert.equal(asignados.length, lineas.length);
        for (const l of lineas) assert(asignados.some(r => r.recursoId === l.recursoId && r.cantidad === l.cantidad));
        const materiales = lineas.filter(l => l.tipoRecurso === "MATERIAL");
        const reservas = db.ReservaRecurso.filter(r => r.eventoId === e.id);
        assert.equal(reservas.length, materiales.length);
        for (const l of materiales) assert(reservas.some(r => r.recursoId === l.recursoId && r.cantidad === l.cantidad));
        const recintos = db.ReservaEspacio.filter(r => r.eventoId === e.id);
        assert.equal(recintos.length, 1);
        assert.equal(recintos[0].espacioId, e.espacioId);
    }
}

function disponibilidad(s) {
    const { db } = s;
    const evento = id => db.Evento[id - 1];
    for (const a of db.Actividad) {
        const e = evento(a.eventoId);
        const asignacion = db.ActividadProductor.find(x => x.actividadId === a.id && x.esResponsable);
        assert.equal(asignacion?.productorId, e.productorId);
        assert(a.inicio >= e.createdAt && a.fin <= e.fin && a.createdAt <= a.inicio);
        assert.equal(a.estado, e.estado === "CANCELADO" ? "CANCELADA" : a.fin <= s.ahora ? "COMPLETADA" : "PENDIENTE");
    }
    for (const productor of db.Productor) {
        const eventos = db.Evento.filter(e => e.productorId === productor.id && e.estado !== "CANCELADO");
        const tareas = db.Actividad.filter(a => a.estado !== "CANCELADA" && evento(a.eventoId).productorId === productor.id);
        for (const a of tareas) assert(!eventos.some(e => e.id !== a.eventoId && solapan(e,a)), "Agenda contra evento");
        for (const lista of [eventos, tareas]) {
            lista.sort((a,b) => a.inicio - b.inicio);
            lista.slice(1).forEach((a,i) => assert(!solapan(a, lista[i]), "Cruce en agenda"));
        }
    }
    for (const [modelo, campo] of [["ReservaEspacio", "espacioId"], ["ReservaVehiculo", "vehiculoId"], ["ReservaRecurso", "recursoId"]]) {
        const filas = db[modelo];
        for (const r of filas) {
            if (r.eventoId == null) {
                assert(modelo === "ReservaEspacio" && r.referencia && r.createdAt <= r.inicio);
            } else {
                const e = evento(r.eventoId);
                assert(+r.inicio === +e.inicio && +r.fin === +e.fin && r.cancelada === (e.estado === "CANCELADO"));
            }
            if (modelo !== "ReservaRecurso" && !r.cancelada) assert(!filas.some(x => !x.cancelada && x.id !== r.id && x[campo] === r[campo] && solapan(x,r)));
        }
    }
    for (const r of db.Recurso) {
        const reservas = db.ReservaRecurso.filter(x => x.recursoId === r.id && !x.cancelada);
        const asignados = db.EventoRecurso.filter(x => x.recursoId === r.id && evento(x.eventoId).estado !== "CANCELADO")
            .map(x => ({ ...x, inicio: evento(x.eventoId).inicio, fin: evento(x.eventoId).fin }));
        const max = recursos.ocupacionMaxima(reservas, asignados, s.origen, new Date(+s.ahora + 190 * 24 * HORA), r.tipo, s.ahora);
        assert(max <= r.stockTotal - r.cantidadPerdida - r.cantidadEnMantencion, r.nombre + " sin stock");
    }
}

function calidad(s) {
    const { db } = s;
    for (const tipo of ["CLIENTE_EVENTO", "ADMIN_PRODUCTOR"]) {
        const pred = db.EncuestaPredeterminada.filter(p => p.tipo === tipo);
        assert.equal(pred.length, 1);
        const f = db.Encuesta[pred[0].encuestaId - 1];
        assert(f.activo && f.tipo === tipo);
    }
    for (const x of [...db.InvitacionEncuesta, ...db.EvaluacionProductor]) {
        const e = db.Evento[x.eventoId - 1];
        assert(e.estado === "COMPLETADO" && x.createdAt >= e.fin);
        const ids = x.formulario.preguntas.map(p => p.id);
        assert(ids.length > 0 && new Set(ids).size === ids.length);
        assert(x.formulario.preguntas.every((p,i) => p.orden === i + 1 && p.enunciado.length >= 3 &&
            db.PreguntaEncuesta.some(q => q.id === p.id && q.encuestaId === x.encuestaId)));
        assert.equal(x.formulario.tipo, db.Encuesta[x.encuestaId - 1].tipo);
        assert.equal(x.formulario.tipo, x.productorId ? "ADMIN_PRODUCTOR" : "CLIENTE_EVENTO");
        if (x.respuestas) respuestasValidas(x.formulario.preguntas, x.respuestas);
        if (x.productorId) {
            assert.equal(x.productorId, e.productorId);
            assert.equal(db.Usuario[x.evaluadorId - 1].rol, "ADMIN");
        } else {
            const c = db.Calificacion.find(c => c.eventoId === e.id);
            assert.equal(Boolean(c), Boolean(x.respondidoAt));
            assert.equal(Boolean(c), Boolean(x.respuestas));
            assert(x.destinatario.endsWith("@example.invalid"));
            if (c) assert(x.estado === "ENVIADA" && x.enviadoAt <= x.respondidoAt && x.respondidoAt < x.expiraAt && +c.createdAt === +x.respondidoAt);
        }
    }
    for (const e of db.Evento) {
        assert.equal(db.InvitacionEncuesta.some(x => x.eventoId === e.id), e.estado === "COMPLETADO");
        if (e.productorId) assert(db.Usuario[db.Productor[e.productorId - 1].usuarioId - 1].activo);
    }
    for (const x of db.Calificacion) {
        assert(x.puntuacion >= 1 && x.puntuacion <= 5 && db.InvitacionEncuesta.some(y => y.eventoId === x.eventoId && y.respondidoAt));
    }
    for (const x of db.EvaluacionProductor) assert(Number.isInteger(x.puntuacion) && x.puntuacion >= 1 && x.puntuacion <= 5);
    for (const x of db.SeguimientoEvento) {
        const e = db.Evento[x.eventoId - 1];
        assert(x.createdAt >= e.createdAt && ["ADMIN", "PRODUCTOR"].includes(db.Usuario[x.usuarioId - 1].rol));
    }
    for (const x of db.ComentarioSeguimiento) assert(x.createdAt >= db.SeguimientoEvento[x.seguimientoId - 1].createdAt);
    for (const x of db.EventoCambio) assert(x.createdAt >= db.Evento[x.eventoId - 1].createdAt);
    const perfiles = db.Productor.filter(p => db.Usuario[p.usuarioId - 1].activo).map(p => {
        const g = db.EvaluacionProductor.filter(x => x.productorId === p.id).length;
        const c = db.Calificacion.filter(x => db.Evento[x.eventoId - 1].productorId === p.id).length;
        return !g || !c ? "SIN_DATOS" : Math.min(g,c) < 3 ? "PROVISIONAL" : "CLASIFICADO";
    });
    assert.equal(new Set(perfiles).size, 3);
    assert(perfiles[2] === "CLASIFICADO" && perfiles[3] === "PROVISIONAL");
    const cliente = (id, estado) => db.SolicitudEvento.some(x => x.clienteId === id && x.estado === estado);
    assert(cliente(1, "PENDIENTE") && db.Presupuesto.some(p => p.clienteId === 2 && p.estado === "ENVIADO"));
    assert(db.Evento.some(e => e.clienteId === 3 && e.estado === "CONFIRMADO" &&
        db.Pago.some(p => p.presupuestoId === e.presupuestoId && p.estado === "PENDIENTE")));
    assert([4,5].every(id => db.Evento.filter(e => e.clienteId === id && e.estado === "COMPLETADO").length >= 2));
    assert(db.Calificacion.some(x => db.Evento[x.eventoId - 1].clienteId === 6));
    assert(db.Evento.some(e => e.productorId === 1 && e.inicio > s.ahora) && db.Evento.some(e => e.productorId === 2 && e.estado === "EN_CURSO"));
    assert(db.Evento.some(e => e.productorId === null && e.estado === "CONFIRMADO"));
    return perfiles;
}

async function validar(s) {
    integridad(s);
    await contratos(s);
    disponibilidad(s);
    return { ranking: calidad(s), imagenes: imagenes(s) };
}
module.exports = validar;
