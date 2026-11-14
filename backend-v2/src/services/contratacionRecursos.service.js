const ConflictException = require("../exceptions/ConflictException");
const NotFoundException = require("../exceptions/NotFoundException");

class ContratacionRecursosService {

    ocupacionMaxima(reservas, compromisos, inicio, fin, tipo, ahora = new Date()) {
        const movimientos = [];
        const agregar = (grupo, campo, cantidad, desde, hasta) => {
            const primero = Math.max(inicio.getTime(), new Date(desde).getTime());
            const ultimo = Math.min(fin.getTime(), hasta === Infinity ? Infinity : new Date(hasta).getTime());
            if (primero < ultimo) {
                movimientos.push([primero, grupo, campo, cantidad], [ultimo, grupo, campo, -cantidad]);
            }
        };
        for (const reserva of reservas) {
            const hasta = tipo === "MATERIAL" && reserva.estadoDevolucion === "PENDIENTE" &&
                new Date(reserva.fin) <= ahora ? Infinity : reserva.fin;
            agregar(reserva.eventoId == null ? "externas" : `evento-${reserva.eventoId}`,
                "reservado", reserva.cantidad, reserva.inicio, hasta);
        }
        for (const compromiso of compromisos) {
            agregar(compromiso.eventoId == null ? "propuesta" : `evento-${compromiso.eventoId}`,
                "cotizado", compromiso.cantidad, compromiso.inicio, compromiso.fin);
        }
        movimientos.sort((a, b) => a[0] - b[0]);
        const grupos = new Map();
        let maxima = 0;
        for (let indice = 0; indice < movimientos.length;) {
            const instante = movimientos[indice][0];
            while (indice < movimientos.length && movimientos[indice][0] === instante) {
                const [, grupo, campo, cantidad] = movimientos[indice++];
                const actual = grupos.get(grupo) ?? { reservado: 0, cotizado: 0 };
                actual[campo] += cantidad;
                grupos.set(grupo, actual);
            }
            let ocupacion = 0;
            for (const grupo of grupos.values()) ocupacion += Math.max(grupo.reservado, grupo.cotizado);
            maxima = Math.max(maxima, ocupacion);
        }
        return maxima;
    }

    async disponible(tx, recurso, inicio, fin, opciones = {}) {
        inicio = new Date(inicio);
        fin = new Date(fin);
        if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || fin <= inicio) {
            throw new ConflictException("El intervalo de disponibilidad de recursos no es válido.");
        }
        const ahora = new Date();
        const [reservas, asignaciones] = await Promise.all([
            tx.reservaRecurso.findMany({
                where: {
                    recursoId: recurso.id, cancelada: false,
                    OR: [
                        { inicio: { lt: fin }, fin: { gt: inicio } },
                        ...(recurso.tipo === "MATERIAL"
                            ? [{ estadoDevolucion: "PENDIENTE", fin: { lte: ahora } }]
                            : [])
                    ]
                },
                select: { eventoId: true, cantidad: true, inicio: true, fin: true, estadoDevolucion: true }
            }),
            tx.eventoRecurso.findMany({
                where: {
                    recursoId: recurso.id,
                    ...(opciones.excluirEventoId != null ? { eventoId: { not: Number(opciones.excluirEventoId) } } : {}),
                    evento: { estado: { not: "CANCELADO" }, inicio: { lt: fin }, fin: { gt: inicio } }
                },
                select: { eventoId: true, cantidad: true, evento: { select: { inicio: true, fin: true } } }
            })
        ]);
        const compromisos = asignaciones.map((asignacion) => ({
            eventoId: asignacion.eventoId, cantidad: asignacion.cantidad,
            inicio: asignacion.evento.inicio, fin: asignacion.evento.fin
        }));
        if (opciones.plan) compromisos.push(opciones.plan);
        if (opciones.reserva) reservas.push(opciones.reserva);
        // La reserva física sustituye al compromiso del mismo evento, sin sumarlo dos veces.
        // Si la reserva es parcial, el resto cotizado sigue ocupando capacidad.
        const ocupado = this.ocupacionMaxima(reservas, compromisos, inicio, fin, recurso.tipo, ahora);
        const operativo = recurso.stockTotal - recurso.cantidadEnMantencion - recurso.cantidadPerdida;
        return { ocupado, operativo, disponible: Math.max(0, operativo - ocupado) };
    }

    async bloquearValidar(tx, presupuesto, excluirEventoId = null) {
        if (!Array.isArray(presupuesto.recursos)) {
            throw new ConflictException("No se cargó el detalle de recursos de la propuesta.");
        }
        const detalles = [...presupuesto.recursos].sort((a, b) => a.recursoId - b.recursoId);
        const ids = new Set();
        for (const detalle of detalles) {
            if (!Number.isInteger(detalle.recursoId) || detalle.recursoId < 1 ||
                !Number.isInteger(detalle.cantidad) || detalle.cantidad < 1 || ids.has(detalle.recursoId)) {
                throw new ConflictException("La propuesta contiene cantidades o recursos duplicados no válidos.");
            }
            ids.add(detalle.recursoId);
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${detalle.recursoId})::text`;
        }
        const actuales = [];
        for (const detalle of detalles) {
            const recurso = await tx.recurso.findUnique({ where: { id: detalle.recursoId } });
            if (!recurso) throw new NotFoundException("Un recurso cotizado ya no existe.");
            if (!recurso.activo || !["MATERIAL", "HUMANO"].includes(recurso.tipo) ||
                (detalle.tipoRecurso && detalle.tipoRecurso !== recurso.tipo)) {
                throw new ConflictException(`El recurso ${recurso.nombre} está inactivo o cambió de tipo. Prepara una nueva propuesta.`);
            }
            const capacidad = await this.disponible(tx, recurso, presupuesto.inicio, presupuesto.fin, {
                excluirEventoId,
                plan: {
                    eventoId: excluirEventoId, cantidad: detalle.cantidad,
                    inicio: presupuesto.inicio, fin: presupuesto.fin
                }
            });
            if (capacidad.ocupado > capacidad.operativo) {
                throw new ConflictException(`No hay capacidad suficiente de ${recurso.nombre} para el horario contratado.`);
            }
            actuales.push(recurso);
        }
        return actuales;
    }

    async validarReserva(tx, recurso, datos) {
        const capacidad = await this.disponible(tx, recurso, datos.inicio, datos.fin, {
            reserva: {
                eventoId: datos.eventoId ?? null, cantidad: datos.cantidad,
                inicio: datos.inicio, fin: datos.fin, estadoDevolucion: "PENDIENTE"
            }
        });
        if (capacidad.ocupado > capacidad.operativo) {
            throw new ConflictException(`Stock insuficiente para ${recurso.nombre}: existen reservas o cantidades comprometidas en eventos.`);
        }
        return capacidad;
    }

    async reservar(tx, presupuesto, eventoId) {
        const recursos = await this.bloquearValidar(tx, presupuesto, eventoId);
        const referencia = `Contrato evento #${eventoId}`;
        for (const recurso of recursos.filter((item) => item.tipo === "MATERIAL")) {
            const detalle = presupuesto.recursos.find((item) => item.recursoId === recurso.id);
            const existente = await tx.reservaRecurso.findFirst({
                where: { eventoId, recursoId: recurso.id, referencia, cancelada: false }
            });
            if (existente) {
                if (existente.cantidad !== detalle.cantidad ||
                    existente.inicio.getTime() !== new Date(presupuesto.inicio).getTime() ||
                    existente.fin.getTime() !== new Date(presupuesto.fin).getTime()) {
                    throw new ConflictException("La reserva automática cambió. Revisa las reservas del evento antes de continuar.");
                }
                continue;
            }
            const datos = {
                eventoId, recursoId: recurso.id, referencia, cantidad: detalle.cantidad,
                inicio: new Date(presupuesto.inicio), fin: new Date(presupuesto.fin)
            };
            await this.validarReserva(tx, recurso, datos);
            await tx.reservaRecurso.create({ data: datos });
        }
    }
}

module.exports = new ContratacionRecursosService();
