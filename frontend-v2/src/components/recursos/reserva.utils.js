export function datosReservaEvento(evento) {
    if (!evento) return { eventoId: "" };
    const fechaLocal = (valor, termino = false) => {
        const original = new Date(valor);
        const fecha = new Date(termino ? Math.ceil(original.getTime() / 60000) * 60000 : original.getTime());
        return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };
    return {
        eventoId: String(evento.id),
        referencia: `${evento.tipoEvento.nombre} #${evento.id}`,
        inicio: fechaLocal(evento.inicio),
        fin: fechaLocal(evento.fin, true)
    };
}

export function fechaMinimaReserva() {
    const fecha = new Date(Math.ceil(Date.now() / 60000) * 60000);
    return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}
