const { marcas, sumar, solapan, diaLocal } = require("./modelo");
const catalogo = require("./catalogo");
const bitacora = require("./bitacora");

function agenda(s, e, ocupacion, cancelada) {
    if (!e.productorId) return;
    const { agregar, db } = s;
    const ocupados = ocupacion.get(e.productorId);
    const desde = sumar(e.createdAt, 5);
    function tarea(titulo, tipo, inicio, fin, descripcion) {
        const estado = cancelada ? "CANCELADA" : fin <= s.ahora ? "COMPLETADA" : "PENDIENTE";
        const a = agregar("Actividad", { eventoId: e.id, titulo, tipo, inicio, fin, estado, lugar: e.lugar,
            descripcion, ...marcas(desde, cancelada ? sumar(desde, 2) : estado === "COMPLETADA" ? fin : desde) });
        db.ActividadProductor.push({ actividadId: a.id, productorId: e.productorId, esResponsable: true });
        if (!cancelada) ocupados.push(a);
    }
    for (const [dias, tipo, titulo] of [[8, "REUNION", "Cerrar la pauta con el cliente"], [3, "VISITA_RECINTO", "Revisar accesos y puntos de energía"]]) {
        const inicio = diaLocal(e.inicio, -dias, 11);
        const fin = sumar(inicio, 1);
        if (inicio > desde && !ocupados.some(x => solapan(x, { inicio, fin })))
            tarea(titulo, tipo, inicio, fin, tipo === "REUNION" ? e.observaciones : "Contrastar el plano de montaje con las salidas del recinto.");
    }
    const titulos = [s.elegir(["Recibir al equipo de montaje", "Descargar y revisar el inventario"]),
        s.elegir(["Hacer la prueba de sonido", "Comprobar alimentación y cableado"]), ...catalogo[e.tipoEventoId - 1][7],
        s.elegir(["Entregar el salón al encargado", "Retirar equipos y cotejar la guía de carga"])];
    const tramo = (e.fin - e.inicio) / titulos.length;
    titulos.forEach((titulo, i) => tarea(titulo, "TAREA", new Date(+e.inicio + Math.floor(i * tramo)),
        new Date(+e.inicio + Math.floor((i + 1) * tramo)), null));
}

function operacion(s) {
    const { db, agregar } = s;
    const ocupacion = new Map(db.Productor.map(p => [p.id, db.Evento.filter(e => e.productorId === p.id && e.estado !== "CANCELADO")]));
    const materiales = new Set(db.RecursoMaterial.map(r => r.recursoId));
    const recursosEvento = Map.groupBy(db.EventoRecurso, r => r.eventoId);
    for (const e of db.Evento) {
        const usuarioCliente = db.Cliente[e.clienteId - 1].usuarioId;
        const usuarioId = e.productorId ? db.Productor[e.productorId - 1].usuarioId : 1;
        const cancelada = e.estado === "CANCELADO";
        const devuelto = e.estado === "COMPLETADO";
        const reserva = { referencia: `Contrato evento #${e.id}`, eventoId: e.id, inicio: e.inicio, fin: e.fin, cancelada, createdAt: e.createdAt };
        agregar("ReservaEspacio", { ...reserva, espacioId: e.espacioId });
        const estadoDevolucion = devuelto ? "CONFORME" : "PENDIENTE";
        for (const r of recursosEvento.get(e.id).filter(r => materiales.has(r.recursoId))) {
            agregar("ReservaRecurso", { ...reserva, recursoId: r.recursoId, cantidad: r.cantidad, estadoDevolucion,
                cantidadDanada: 0, cantidadPerdida: 0 });
        }
        if (e.id % 3) agregar("ReservaVehiculo", { ...reserva, vehiculoId: e.id % 4 + 1,
            estadoDevolucion: devuelto && e.id % 11 === 0 ? "CON_OBSERVACIONES" : estadoDevolucion,
            observacionesDevolucion: devuelto && e.id % 11 === 0 ? "Se recibió con el depósito a media carga." : null });
        const cambio = (campo, valorAnterior, valorNuevo, createdAt, actor = 1) => {
            agregar("EventoCambio", { eventoId: e.id, usuarioId: actor, campo, valorAnterior, valorNuevo, createdAt });
            e.updatedAt = new Date(Math.max(+e.updatedAt, +createdAt));
        };
        cambio("contratacion", null, `Solicitud #${e.solicitudId}, presupuesto #${e.presupuestoId}, versión 2`, e.createdAt, usuarioCliente);
        if (e.productorId) cambio("productorId", null, String(e.productorId), sumar(e.createdAt, 4));
        const nota = (tipo, importancia, descripcion, fecha) => agregar("SeguimientoEvento", { eventoId: e.id, usuarioId, tipo, importancia, descripcion, createdAt: fecha });
        const linea = bitacora[catalogo[e.tipoEventoId - 1][1]];
        const notas = [...linea.previas,
            ["OBSERVACION", "BAJA", "La llave del portón de carga se retira en recepción.", "Dejé el nombre de quien la va a retirar."],
            ["NOVEDAD", "MEDIA", "El recinto liberó la sala contigua para guardar los estuches.", "Avisé al equipo de montaje."],
            ["INCIDENCIA", "ALTA", "El acceso lateral está en obras. Hay que descargar por la entrada principal.", "El conductor ya tiene el nuevo punto de descarga."],
            ["HITO", "MEDIA", "Llegó el plano firmado con la distribución de mesas.", "Ya está impresa la copia para sala."]
        ];
        const [tipo, importancia, texto, respuesta] = s.elegir(notas);
        const registro = nota(tipo, importancia, texto, sumar(e.createdAt, 5));
        if (e.id % 3) agregar("ComentarioSeguimiento", { seguimientoId: registro.id, usuarioId: e.productorId ? 1 : 2,
            comentario: respuesta, createdAt: sumar(registro.createdAt, 0.5) });
        if (e.id % 3 === 0) {
            const peticion = s.elegir(["El cliente pide dejar libre la primera fila para personas mayores.",
                "Pidieron recibir las cajas por la puerta de servicio.", linea.cambio,
                "Solicitan adelantar la apertura de puertas diez minutos."]);
            nota("MODIFICACION", "MEDIA", peticion, sumar(e.createdAt, 5.5));
            cambio("observaciones", e.observaciones, peticion, sumar(e.createdAt, 6));
            e.observaciones = peticion;
        }
        if (devuelto || e.estado === "EN_CURSO") {
            cambio("estado", "CONFIRMADO", "EN_CURSO", e.inicio);
            nota("HITO", "MEDIA", linea.enSala, sumar(e.inicio, 0.5));
        }
        if (devuelto || e.estado === "EN_CURSO") cambio("motivoEstado", null, "Equipo en sala. Comienza la pauta.", e.inicio);
        if (devuelto) {
            cambio("estado", "EN_CURSO", "COMPLETADO", e.fin);
            cambio("motivoEstado", null, "Finalizó el último bloque y se entregó el recinto.", e.fin);
        }
        if (e.estado === "POSPUESTO") cambio("motivoEstado", null, "El cliente está confirmando una segunda fecha con el recinto.", sumar(e.createdAt, 7));
        if (cancelada || e.estado === "POSPUESTO") cambio("estado", "CONFIRMADO", e.estado, sumar(e.createdAt, 7));
        agenda(s, e, ocupacion, cancelada);
    }
    // Bloqueos del recinto que se pueden gestionar desde el mapa, sin contratar un evento.
    const bloqueos = [[2, "Prueba del tablero eléctrico"], [7, "Limpieza de las cortinas del escenario"],
        [12, "Revisión de las salidas de emergencia"]];
    for (const [dias, referencia] of bloqueos) {
        const inicio = diaLocal(s.ahora, dias, 8);
        const horario = { inicio, fin: sumar(inicio, 2) };
        const espacio = db.Espacio.find(e => e.habilitado &&
            !db.ReservaEspacio.some(r => r.espacioId === e.id && !r.cancelada && solapan(r, horario)) &&
            !db.Presupuesto.some(p => p.espacioId === e.id && p.estado === "ENVIADO" && solapan(p, horario)));
        if (espacio) agregar("ReservaEspacio", { espacioId: espacio.id, eventoId: null, referencia, ...horario,
            cancelada: false, createdAt: s.ahora });
    }
}
module.exports = operacion;
