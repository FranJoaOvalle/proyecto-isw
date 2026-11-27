const catalogo = require("./catalogo");
const { cotizarExtras } = require("./inventario");
const { HORA, diaLocal, marcas, sumar } = require("./modelo");

function tipoParaFecha(s, fecha) {
    const mes = fecha.getMonth() + 1;
    const finde = [0, 6].includes(fecha.getDay());
    if (finde) return s.elegir([3, 4, 11, 9, ...(mes >= 9 || mes <= 3 ? [1, 1, 1] : [1])]);
    return s.elegir([5, 5, 6, 7, 9, 10, 12, ...([11, 12].includes(mes) ? [2, 2, 2, 8, 8, 8] : [6])]);
}

function clientePara(s, tipo, i) {
    // Una parte de los encargos proviene de cuentas recurrentes del mismo rubro.
    const sociales = [1, 3, 4, 11].includes(tipo);
    const tipoCliente = sociales ? "PERSONA" : "EMPRESA";
    if (i % 5 === 0) return sociales ? 4 : 5;
    return s.elegir(s.db.Cliente.filter(c => c.tipo === tipoCliente && c.id >= 7 && c.id <= 113)).id;
}

function cobros(s, p, estadoEvento) {
    const referencia = "DEMO-" + p.id.toString().padStart(5, "0");
    function pago(tipo, monto, estado, fecha, intento) {
        s.agregar("Pago", { presupuestoId: p.id, tipo, monto, estado,
            referencia: referencia + "-" + intento, fechaPago: ["PAGADO", "REEMBOLSADO"].includes(estado) ? fecha : null,
            ...marcas(fecha, estado === "REEMBOLSADO" ? sumar(p.aceptadoAt, 9) : fecha) });
    }
    const inicio = sumar(p.aceptadoAt, 1);
    if (p.id % 17 === 0) pago("ANTICIPO", p.montoAnticipo, "FALLIDO", p.aceptadoAt, "F");
    if (estadoEvento === "CANCELADO") {
        pago("ANTICIPO", p.montoAnticipo, "REEMBOLSADO", inicio, "R");
        return;
    }
    const adeudaAnticipo = estadoEvento === "CONFIRMADO" && p.id % 11 === 0;
    pago("ANTICIPO", p.montoAnticipo, adeudaAnticipo ? "PENDIENTE" : "PAGADO", inicio, "A");
    const saldo = p.total - p.montoAnticipo;
    const completo = estadoEvento === "COMPLETADO" || (estadoEvento === "EN_CURSO" && p.id % 2);
    const abono = !adeudaAnticipo && p.id % 4 === 0 ? Math.floor(saldo / 2000) * 1000 : 0;
    if (abono) pago("SALDO", abono, "PAGADO", sumar(inicio, 1), "B");
    pago("SALDO", saldo - abono, completo ? "PAGADO" : "PENDIENTE",
        completo ? sumar(p.inicio, -1) : sumar(inicio, 2), "S");
}

function cotizar(s, grupos, solicitud, lugar, estado, aceptado, admin) {
    const { db, agregar } = s;
    const { tipoEventoId, clienteId, asistentes, inicio, fin } = solicitud;
    const tipo = db.TipoEvento[tipoEventoId - 1];
    const horas = (fin - inicio) / HORA;
    const lineas = cotizarExtras(s, grupos, tipoEventoId, asistentes);
    const enviado = estado !== "BORRADOR";
    const incluido = solicitud.id % 4 === 0;
    const unidades = lugar.unidadArriendo === "HORA" ? horas : lugar.unidadArriendo === "DIA" ? Math.ceil(horas / 24) : 1;
    const arriendo = enviado && !incluido ? lugar.costoArriendo * unidades : 0;
    const precioBaseCatalogo = tipo.precioBase ?? tipo.tarifaHora * horas;
    const precioBaseAcordado = solicitud.id % 9 === 0 ? precioBaseCatalogo - 25000 : null;
    const precioBaseTipoEvento = precioBaseAcordado ?? precioBaseCatalogo;
    const subtotal = precioBaseTipoEvento + arriendo + lineas.reduce((n, r) => n + r.subtotal, 0);
    const descuento = solicitud.id % 7 === 0 ? 35000 : 0;
    const total = subtotal - descuento;
    const creado = sumar(solicitud.createdAt, 28);
    const enviadoAt = enviado ? sumar(creado, 4) : null;
    const aceptadoAt = aceptado ? sumar(enviadoAt, 18) : null;
    const venceAt = enviado ? new Date(Math.min(+inicio, estado === "VENCIDO" ? +sumar(enviadoAt, 48)
        : estado === "ENVIADO" ? +sumar(s.ahora, 72) : +sumar(enviadoAt, 240))) : null;
    const cierre = estado === "VENCIDO" ? venceAt : estado === "CANCELADO" ? sumar(enviadoAt, 3) : null;
    const p = agregar("Presupuesto", { solicitudId: solicitud.id, clienteId, tipoEventoId, asistentes, inicio, fin,
        lugar: lugar.nombre, espacioId: lugar.id, direccion: lugar.direccion, comuna: lugar.comuna,
        nombreTipoEvento: tipo.nombre, precioBaseCatalogo, precioBaseAcordado, precioBaseTipoEvento,
        modalidadPrecioTipoEvento: tipo.modalidadPrecio, tarifaHoraTipoEvento: tipo.tarifaHora,
        cantidadPersonasBaseTipoEvento: tipo.cantidadPersonasBase,
        costoArriendoEspacio: enviado ? lugar.costoArriendo : null, unidadArriendoEspacio: enviado ? lugar.unidadArriendo : null,
        subtotalArriendoEspacio: enviado ? arriendo : null, arriendoIncluido: enviado ? incluido : null,
        subtotal, descuento, recargoCliente: 0, total, porcentajeAnticipo: 30, montoAnticipo: total * 3 / 10,
        estado, version: enviado ? 2 : 1, enviadoAt, enviadoPorId: enviado ? admin : null, venceAt,
        aceptadoAt, aceptadoPorId: aceptado ? solicitud.autorId : null, versionAceptada: aceptado ? 2 : null,
        ...marcas(creado, cierre ?? aceptadoAt ?? enviadoAt ?? creado) });
    for (const linea of lineas) db.PresupuestoRecurso.push({ presupuestoId: p.id, ...linea });
    return { p, lineas };
}

function carpeta(s, grupos, { dia, estadoEvento, estadoPropuesta, estadoSolicitud, productorId, cliente, tipo }) {
    const { db, agregar, elegir, entero } = s;
    const tipoEventoId = tipo ?? tipoParaFecha(s, diaLocal(s.ahora, dia, 12));
    const ficha = catalogo[tipoEventoId - 1];
    const curso = estadoEvento === "EN_CURSO";
    const inicio = curso ? sumar(s.ahora, -2) : diaLocal(s.ahora, dia, [1, 4, 7, 8].includes(tipoEventoId) ? 16 : entero(8, 12));
    const fin = sumar(inicio, ficha[4]);
    const clienteId = cliente ?? clientePara(s, tipoEventoId, db.SolicitudEvento.length + 1);
    const autorId = db.Cliente[clienteId - 1].usuarioId;
    const admin = entero(1, 4);
    const asistentes = ficha[2] + entero(0, Math.floor(ficha[2] * 1.3));
    const lugares = db.Espacio.filter(e => e.habilitado && e.capacidad >= asistentes &&
        !db.Evento.some(ev => ev.espacioId === e.id && ev.estado !== "CANCELADO" && ev.inicio < fin && ev.fin > inicio));
    const lugar = elegir(lugares);
    const indicaciones = [...ficha[8]];
    if ([2, 5, 6, 9, 10, 12].includes(tipoEventoId)) {
        indicaciones.push(
            `Llevamos ${entero(2, 5)} delegaciones. Favor reservar la primera mesa para acreditación.`,
            `El furgón trae ${entero(3, 9)} cajas. ¿Quién recibe en ${lugar.nombre}?`,
            `Presupuestar café para ${asistentes} asistentes; las colaciones de los relatores vienen aparte.`,
            "La orden de compra debe llevar separados el arriendo y el equipo técnico."
        );
    } else {
        indicaciones.push(
            `Por ahora contamos ${asistentes} invitados, entre ellos ${entero(3, 12)} niños.`,
            `¿Podemos ir a ver el montaje en ${lugar.nombre} el día anterior?`,
            "Preferimos mesas separadas para que quede libre el paso al patio.",
            `Confirmamos ${entero(2, 6)} porciones sin carne. Entregaremos los nombres a cocina.`
        );
    }
    const observaciones = elegir(indicaciones);
    const reciente = ["PENDIENTE", "EN_REVISION"].includes(estadoSolicitud) && !estadoEvento;
    const anticipacion = reciente ? entero(3, 9) : entero(12, 75);
    const creado = new Date(Math.max(+s.origen + HORA, Math.min(+sumar(inicio, -anticipacion * 24), +sumar(s.ahora, -entero(3, reciente ? 6 : 24) * 24))));
    const retirada = estadoSolicitud === "RECHAZADA" && !estadoPropuesta && db.SolicitudEvento.length % 2 === 0;
    const motivoCierre = estadoSolicitud === "RECHAZADA" ? elegir(["El directorio suspendió la actividad.", "El curso optó por otro recinto.", "El monto disponible quedó por debajo de la cotización."]) : null;
    const solicitud = agregar("SolicitudEvento", { clienteId, autorId, tipoEventoId, inicio, fin, asistentes, lugar: lugar.nombre,
        observaciones, estado: estadoSolicitud, tipoCierre: motivoCierre ? retirada ? "RETIRO_CLIENTE" : "RECHAZO_ADMIN" : null,
        motivoCierre, ...marcas(creado) });
    const cambio = (actorId, accion, anterior, nuevo, createdAt, motivo) => agregar("SolicitudEventoCambio", {
        solicitudId: solicitud.id, actorId, accion, ...(anterior && { anterior }), nuevo, createdAt, motivo });
    const editada = solicitud.id % 3 === 0;
    cambio(autorId, "CREACION", null, { tipoEventoId, inicio: inicio.toISOString(), fin: fin.toISOString(), lugar: lugar.nombre,
        observaciones, asistentes: editada ? asistentes + 5 : asistentes }, creado);
    if (editada) cambio(autorId, "EDICION", { asistentes: asistentes + 5 }, { asistentes }, sumar(creado, 3));
    if (estadoSolicitud !== "PENDIENTE" && !retirada)
        cambio(admin, "INICIO_REVISION", { estado: "PENDIENTE" }, { estado: "EN_REVISION" }, sumar(creado, 12));
    let evento;
    if (estadoPropuesta) {
        if (estadoEvento && solicitud.id % 16 === 0) {
            // Un primer borrador fue retirado antes de enviar el acuerdo definitivo.
            const { p: anterior } = cotizar(s, grupos, solicitud, lugar, "BORRADOR", false, admin);
            anterior.createdAt = sumar(creado, 15);
            anterior.updatedAt = sumar(creado, 23);
            anterior.estado = "CANCELADO";
            cambio(admin, "CANCELACION_PROPUESTA", { presupuestoId: anterior.id, estado: "BORRADOR" },
                { presupuestoId: anterior.id, estado: "CANCELADO" }, anterior.updatedAt);
        }
        const { p, lineas } = cotizar(s, grupos, solicitud, lugar, estadoPropuesta, Boolean(estadoEvento), admin);
        if (p.enviadoAt) cambio(admin, "ENVIO_PROPUESTA", null, { presupuestoId: p.id, version: p.version, venceAt: p.venceAt.toISOString() }, p.enviadoAt);
        if (estadoPropuesta === "CANCELADO") cambio(admin, "CANCELACION_PROPUESTA", { presupuestoId: p.id, estado: "ENVIADO" },
            { presupuestoId: p.id, estado: "CANCELADO" }, p.updatedAt);
        if (estadoPropuesta === "VENCIDO") cambio(admin, "VENCIMIENTO_PROPUESTAS", null, { presupuestos: [p.id] }, p.updatedAt);
        if (estadoEvento) {
            evento = agregar("Evento", { solicitudId: solicitud.id, presupuestoId: p.id, clienteId, tipoEventoId, inicio, fin,
                lugar: lugar.nombre, direccion: lugar.direccion, comuna: lugar.comuna, espacioId: lugar.id, asistentes,
                observaciones, productorId, estado: estadoEvento, ...marcas(p.aceptadoAt) });
            cambio(autorId, "FORMALIZACION", { estado: "EN_REVISION" }, { estado: "CONTRATADA", eventoId: evento.id, presupuestoId: p.id, version: p.version }, p.aceptadoAt);
            for (const { recursoId, cantidad } of lineas) db.EventoRecurso.push({ eventoId: evento.id, recursoId, cantidad });
            cobros(s, p, estadoEvento);
        }
    }
    if (motivoCierre) {
        const fecha = sumar(db.SolicitudEventoCambio.at(-1).createdAt, 1);
        cambio(retirada ? autorId : admin, solicitud.tipoCierre, { estado: retirada ? "PENDIENTE" : "EN_REVISION" },
            { estado: "RECHAZADA" }, fecha, motivoCierre);
    }
    solicitud.updatedAt = db.SolicitudEventoCambio.at(-1).createdAt;
    return evento;
}

function comercial(s, grupos) {
    const futuros = Math.round(s.volumen * 0.22);
    const historicos = s.volumen - futuros - 1;
    const rango = (cantidad, inicio) => Array.from({ length: cantidad }, (_, i) => inicio + i);
    const trimestres = rango(8, 0).map(i => {
        let dia = -685 + i * 90;
        while ([0, 6].includes(diaLocal(s.ahora, dia, 12).getDay())) dia++;
        return dia;
    });
    const diasPasados = [-2, -4, ...trimestres, ...s.mezclar(rango(706, -715).filter(d => !trimestres.includes(d))).slice(0, historicos - 10)];
    const diasFuturos = [1, 3, 5, 7, 11, 14, 20, 28, 90, 174, ...s.mezclar(rango(143, 29).filter(d => d !== 90)).slice(0, futuros - 10)];
    diasPasados.forEach((dia, i) => {
        const productorId = i < 22 ? i + 1 : 1 + (i % 20);
        carpeta(s, grupos, { dia, estadoEvento: i > 23 && i % 29 === 0 ? "CANCELADO" : "COMPLETADO",
            estadoPropuesta: "ACEPTADO", estadoSolicitud: "CONTRATADA", productorId,
            cliente: trimestres.includes(dia) ? 5 : i % 33 === 0 ? 6 : i % 19 === 0 ? 4 : undefined,
            tipo: trimestres.includes(dia) ? 5 : i % 33 === 0 || i % 19 === 0 ? 4 : undefined });
    });
    carpeta(s, grupos, { dia: 0, estadoEvento: "EN_CURSO", estadoPropuesta: "ACEPTADO", estadoSolicitud: "CONTRATADA", productorId: 2 });
    diasFuturos.forEach((dia, i) => carpeta(s, grupos, { dia,
        estadoEvento: i % 13 === 9 ? "POSPUESTO" : i % 17 === 13 ? "CANCELADO" : "CONFIRMADO",
        estadoPropuesta: "ACEPTADO", estadoSolicitud: "CONTRATADA", productorId: i % 10 === 8 ? null : i % 3 === 0 ? 1 : s.entero(1, 21),
        cliente: i === 0 ? 3 : undefined, tipo: i === 0 ? 11 : undefined }));
    const libres = s.mezclar(rango(177, 2).filter(d => !diasFuturos.includes(d)));
    const extras = Math.round(s.volumen * 0.55);
    for (let i = 0; i < extras; i++) {
        const estadoPropuesta = [null, "ENVIADO", "BORRADOR", "VENCIDO", "CANCELADO", null, "ENVIADO", null][i % 8];
        const estadoSolicitud = i % 8 === 0 ? "PENDIENTE" : [3,4,5].includes(i % 8) ? "RECHAZADA" : "EN_REVISION";
        carpeta(s, grupos, { dia: estadoSolicitud === "RECHAZADA" ? -s.entero(6, 680) : libres[i % libres.length],
            estadoPropuesta, estadoSolicitud, cliente: i % 16 === 0 ? 1 : i % 16 === 1 ? 2 : undefined });
    }
}
module.exports = comercial;
