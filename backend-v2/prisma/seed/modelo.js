const { createHash } = require("node:crypto");
const { z } = require("zod");

// Orden de inserción. Las claves de cada colección coinciden con los modelos Prisma.
const modelos = `Usuario Cliente ClientePersona ClienteEmpresa Productor TipoEvento Recurso
RecursoMaterial RecursoHumano Espacio Vehiculo Encuesta PreguntaEncuesta EncuestaPredeterminada
SolicitudEvento Presupuesto PresupuestoRecurso Pago Evento EventoRecurso SolicitudEventoCambio
EventoCambio Actividad ActividadProductor ReservaEspacio ReservaRecurso ReservaVehiculo
SeguimientoEvento ComentarioSeguimiento InvitacionEncuesta Calificacion EvaluacionProductor`.split(/\s+/);

const HORA = 3600000;
const DIA = 24 * HORA;
const sumar = (fecha, horas) => new Date(+fecha + horas * HORA);
const marcas = (createdAt, updatedAt = createdAt) => ({ createdAt, updatedAt });
const solapan = (a, b) => a.inicio < b.fin && b.inicio < a.fin;

function configuracion(env = process.env) {
    const texto = env.SEED_FECHA;
    if (texto && !z.iso.datetime({ offset: true }).safeParse(texto).success)
        throw Error("SEED_FECHA requiere fecha, hora y zona ISO 8601.");
    const ahora = texto ? new Date(texto) : new Date();
    const volumen = Number(env.SEED_EVENTOS ?? 250);
    if (!Number.isFinite(+ahora) || !Number.isInteger(volumen) || volumen < 200 || volumen > 300)
        throw Error("Revisa SEED_FECHA y SEED_EVENTOS (200 a 300).");
    const web = new URL(env.SEED_FRONTEND_URL || env.FRONTEND_URL || "http://localhost:5173");
    if (!["http:", "https:"].includes(web.protocol) || web.username || web.password || web.search || web.hash)
        throw Error("SEED_FRONTEND_URL debe ser la URL pública del frontend.");
    return { ahora, volumen, web: web.href.replace(/\/$/, ""), semilla: env.SEED_SEMILLA || "Biobio-27" };
}

// El huso del proceso se fija antes de construir el calendario. setDate conserva la hora civil al cruzar DST.
function diaLocal(ahora, dias, hora) {
    const fecha = new Date(ahora);
    fecha.setHours(12, 0, 0, 0);
    fecha.setDate(fecha.getDate() + dias);
    fecha.setHours(hora, 0, 0, 0);
    return fecha;
}

function escenario(config) {
    let estado = createHash("sha256").update(config.semilla).digest().readUInt32LE();
    const entero = (min, max) => {
        estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
        return min + Math.floor(estado / 0x100000000 * (max - min + 1));
    };
    const elegir = lista => lista[entero(0, lista.length - 1)];
    const mezclar = lista => {
        const copia = [...lista];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = entero(0, i);
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    };
    const db = Object.fromEntries(modelos.map(nombre => [nombre, []]));
    const agregar = (modelo, datos) => {
        const fila = { id: db[modelo].length + 1, ...datos };
        db[modelo].push(fila);
        return fila;
    };
    const origen = diaLocal(config.ahora, -729, 8);
    return { ...config, origen, db, entero, elegir, mezclar, agregar };
}

module.exports = { modelos, HORA, DIA, sumar, marcas, solapan, diaLocal, configuracion, escenario };
