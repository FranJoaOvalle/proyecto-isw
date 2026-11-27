const { createHash } = require("node:crypto");
const { DIA, sumar, marcas } = require("./modelo");
const catalogo = require("./catalogo");
const plantillas = require("./formularios");
const validarRespuestas = require("../../src/utils/validarRespuestasEncuesta");

const notasCliente = [
    ["Tuvimos que buscar al encargado cuando llegó el primer grupo.", "Me avisaron del cambio de acceso cuando ya estaba en la puerta.",
        "La fila se alargó. Nadie nos explicó por dónde debíamos entrar.", "Faltó revisar el audio antes de abrir la sala."],
    ["La sala estaba lista. La información de los horarios llegó por partes.", "Nos ayudaron con las sillas, aunque costó encontrar a alguien al cierre.",
        "El montaje quedó bien. El cambio de micrófono tomó más de lo previsto.", "Tuve que volver a pedir la copia de la pauta."],
    ["Pude hablar con la encargada durante el montaje.", "La distribución dejó espacio para pasar con silla de ruedas.",
        "Agradecí el aviso del cambio de puerta. Alcancé a informar al grupo.", "El equipo recibió nuestras cajas y las dejó juntas para el retiro.",
        "Estaba todo dispuesto cuando llegamos.", "El sonido se entendía incluso desde atrás."]
];
const notasGerencia = [
    ["El relevo comenzó sin inventario firmado.", "No anticipó la congestión del acceso de carga. Despaché un segundo apoyo.",
        "Hubo que rehacer la distribución después de que entró el público.", "Se omitió el chequeo del canal de respaldo."],
    ["Resolvió la falla de audio, pero avisó tarde al cliente.", "El montaje cerró a tiempo. Faltó identificar las cajas en bodega.",
        "Sostuvo la pauta con ayuda de sala.", "Cubrió el cambio de turno. La minuta llegó al día siguiente."],
    ["Reubicó la descarga antes de que se formara fila.", "Devolvió el inventario cotejado y con las guías firmadas.", "Distribuyó bien las tareas del primer turno.",
        "Dejó un micrófono listo para el relevo.", "La pauta tenía un margen suficiente para el recambio de sala.",
        "Avisó de la demora al proveedor y mantuvo abierta la entrada accesible."]
];
function comentario(s, e, nota, interna) {
    const textos = (interna ? notasGerencia : notasCliente)[nota <= 2 ? 0 : nota === 3 ? 1 : 2];
    const observacion = s.elegir(textos);
    if (s.entero(1, 3) === 1) {
        const hito = catalogo[e.tipoEventoId - 1][7][1].toLocaleLowerCase("es-CL");
        if (interna) {
            if (nota <= 2) return `Tuvimos que enviar un refuerzo para ${hito}. La tarea seguía pendiente al abrir la sala.`;
            if (nota === 3) return `Asignó una segunda persona para ${hito}. Se recuperó el tiempo después del ingreso.`;
            return `Dejó a una persona a cargo de ${hito} y pudo acompañar al cliente en la entrada.`;
        }
        if (nota <= 2) return `Llegamos al recinto de ${e.comuna} y aún no había nadie recibiendo. Esperamos en la puerta.`;
        if (nota === 3) return `En ${e.lugar} costó ubicar la entrada. Una vez adentro nos atendieron bien.`;
        return `Nos reunimos en ${e.lugar} antes de abrir. Revisamos el orden y supimos a quién llamar durante la jornada.`;
    }
    if (s.entero(1, 4) === 1) return observacion + " " + s.elegir(interna
        ? [`Archivé el detalle en la carpeta de ${e.lugar}.`, `Lo revisamos al cierre del turno en ${e.comuna}.`]
        : [`Éramos ${e.asistentes} y el salón dio abasto.`, "Eso nos ayudó a decidir qué pedir para otra fecha."]);
    return observacion;
}

function responder(s, preguntas, nota, texto) {
    const datos = {};
    for (const p of preguntas) {
        if (!p.obligatoria && s.entero(0, 3) === 0) continue;
        switch (p.tipo) {
            case "ESCALA": datos[p.id] = nota; break;
            case "SI_NO": datos[p.id] = nota >= 3; break;
            case "TEXTO": datos[p.id] = texto; break;
            case "SELECCION_UNICA": datos[p.id] = p.opciones[nota >= 4 ? 0 : nota === 3 ? 1 : 2]; break;
            case "SELECCION_MULTIPLE": datos[p.id] = s.mezclar(p.opciones).slice(0, s.entero(1, p.opciones.length)); break;
        }
    }
    return validarRespuestas(preguntas, datos);
}

function tokenDemo(semilla, eventoId) {
    return createHash("sha256").update(`demo-nes:${semilla}:${eventoId}`).digest("base64url");
}

function encuestas(s) {
    const { db, agregar, ahora, origen } = s;
    const formularios = plantillas.map(([nombre, tipo, activo, descripcion, preguntas]) => {
        const formulario = agregar("Encuesta", { nombre, tipo, activo, descripcion, ...marcas(origen, activo ? origen : sumar(ahora, -365 * 24)) });
        const snapshot = { nombre, descripcion, tipo, preguntas: preguntas.map(([clase, enunciado, obligatoria = true, opciones = []], i) => {
            const p = agregar("PreguntaEncuesta", { encuestaId: formulario.id, enunciado, tipo: clase, obligatoria, opciones, orden: i + 1 });
            const { encuestaId, ...historica } = p;
            return historica;
        }) };
        return snapshot;
    });
    for (const id of [3, 6]) db.EncuestaPredeterminada.push({ tipo: formularios[id - 1].tipo, encuestaId: id, updatedAt: sumar(ahora, -30 * 24) });
    const vistos = new Map();
    for (const e of db.Evento.filter(e => e.estado === "COMPLETADO")) {
        const n = (vistos.get(e.productorId) ?? 0) + 1;
        vistos.set(e.productorId, n);
        const p = e.productorId;
        const edad = (ahora - e.fin) / DIA;
        const idCliente = edad > 365 ? 1 : edad > 30 && [1, 3, 4, 7, 8, 11].includes(e.tipoEventoId) ? 2 : 3;
        const idInterna = edad > 365 ? 4 : edad > 30 && [2, 5, 6, 9, 10].includes(e.tipoEventoId) ? 5 : 6;
        const puntuar = interna => {
            if ([8, 9].includes(p)) return 4; // Empate real en ambas fuentes.
            const centro = p === 3 ? 5 : p === 10 ? (interna ? 2 : 5) : p === 11 ? (interna ? 5 : 2) : [4, 4, 3, 2, 4, 5][p % 6];
            return Math.max(1, Math.min(5, centro + s.elegir([-1, 0, 0, 0, 1])));
        };
        // Se reservan perfiles con una sola fuente, ninguna y sólo dos evaluaciones.
        const provisional = p === 4 && n > 2;
        const calificar = ![5, 7].includes(p) && !provisional && e.id !== 1 && (n <= 3 || e.id % 5 !== 0);
        const evaluar = ![6, 7].includes(p) && !provisional && (n <= 3 || e.id % 7 !== 0);
        const fecha = sumar(e.fin, 0.5);
        const enviadoAt = sumar(fecha, 0.25);
        const respondidoAt = calificar ? new Date(Math.min(+ahora, +sumar(enviadoAt, s.entero(4, 66)))) : null;
        const estado = calificar || e.id === 1 || e.id % 3 === 0 ? "ENVIADA" : e.id % 3 === 1 ? "PENDIENTE" : "FALLIDA";
        const formulario = structuredClone(formularios[idCliente - 1]);
        const nota = puntuar(false);
        const texto = comentario(s, e, nota, false);
        const destinatario = db.Usuario[db.Cliente[e.clienteId - 1].usuarioId - 1].email;
        agregar("InvitacionEncuesta", { eventoId: e.id, encuestaId: idCliente,
            destinatario: destinatario.endsWith(".invalid") ? destinatario : "encuesta." + e.clienteId + "@example.invalid",
            formulario, estado, intentos: estado === "ENVIADA" ? 1 : 3,
            tokenHash: createHash("sha256").update(tokenDemo(s.semilla, e.id)).digest("hex"),
            enviadoAt: estado === "ENVIADA" ? enviadoAt : null, expiraAt: sumar(enviadoAt, 168),
            ultimoError: estado === "FALLIDA" ? "ERROR_SMTP" : null, respondidoAt,
            ...(calificar && { respuestas: responder(s, formulario.preguntas, nota, texto) }), ...marcas(fecha, respondidoAt ?? enviadoAt) });
        if (calificar) agregar("Calificacion", { eventoId: e.id, puntuacion: nota, comentario: e.id % 5 ? texto : null, ...marcas(respondidoAt) });
        if (evaluar) {
            const formulario = structuredClone(formularios[idInterna - 1]);
            const puntuacion = puntuar(true);
            const texto = comentario(s, e, puntuacion, true);
            const evaluada = new Date(Math.min(+ahora, +sumar(e.fin, s.entero(1, 96))));
            agregar("EvaluacionProductor", { productorId: p, eventoId: e.id, evaluadorId: s.entero(1, 4), encuestaId: idInterna,
                puntuacion, comentario: e.id % 6 ? texto : null, formulario, respuestas: responder(s, formulario.preguntas, puntuacion, texto),
                ...marcas(evaluada) });
        }
    }
}
module.exports = { encuestas, tokenDemo };
