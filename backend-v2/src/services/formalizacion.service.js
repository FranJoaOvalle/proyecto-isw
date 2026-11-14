const ConflictException = require("../exceptions/ConflictException");
const ForbiddenException = require("../exceptions/ForbiddenException");
const NotFoundException = require("../exceptions/NotFoundException");
const SolicitudService = require("./solicitud.service");
const IntegracionPresupuestosService = require("./integracionPresupuestos.service");
const UbicacionService = require("./ubicacion.service");
const DisponibilidadService = require("./disponibilidad.service");
const ContratacionRecursosService = require("./contratacionRecursos.service");

const resumenEvento = {
    id: true, solicitudId: true, presupuestoId: true, estado: true,
    inicio: true, fin: true, lugar: true, direccion: true, comuna: true,
    referenciaDireccion: true, asistentes: true
};

class FormalizacionService {

    async validarPropuesta(tx, presupuesto) {
        const ahora = new Date();
        if (presupuesto.inicio <= ahora || presupuesto.fin <= presupuesto.inicio) {
            throw new ConflictException("La fecha del evento debe ser futura y su horario válido.");
        }
        await tx.$queryRaw`SELECT "id" FROM "TipoEvento" WHERE "id" = ${presupuesto.tipoEventoId} FOR SHARE`;
        const tipo = await tx.tipoEvento.findUnique({ where: { id: presupuesto.tipoEventoId } });
        if (!tipo?.activo) {
            throw new ConflictException("El tipo de evento está inactivo. No se puede enviar ni contratar esta propuesta.");
        }
        const cliente = await tx.cliente.findUnique({
            where: { id: presupuesto.clienteId },
            select: { usuario: { select: { activo: true, rol: true } } }
        });
        if (!cliente?.usuario?.activo || cliente.usuario.rol !== "CLIENTE") {
            throw new ConflictException("El cliente asociado no tiene una cuenta activa.");
        }
        // Mismo bloqueo que las escrituras de ubicación y las reservas de Espacios.
        await DisponibilidadService.bloquearUbicaciones(tx);
        if (presupuesto.espacioId != null) {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${presupuesto.espacioId})::text`;
        }
        const ubicacion = await UbicacionService.preparar({}, {
            espacioId: presupuesto.espacioId ?? null,
            lugar: presupuesto.lugar,
            direccion: presupuesto.direccion,
            comuna: presupuesto.comuna,
            referenciaDireccion: presupuesto.referenciaDireccion,
            asistentes: presupuesto.asistentes
        }, tx);
        await DisponibilidadService.verificarDisponibilidad({
            ...ubicacion, inicio: presupuesto.inicio, fin: presupuesto.fin
        }, null, tx);
        await ContratacionRecursosService.bloquearValidar(tx, presupuesto);
        return ubicacion;
    }

    async formalizarContratacion({ tx, solicitudId, presupuestoId, actorId, version }) {
        if (!tx) throw new ConflictException("La formalización requiere la transacción de aceptación.");
        const actor = await tx.usuario.findUnique({ where: { id: actorId } });
        if (!actor?.activo || actor.rol !== "CLIENTE") throw new ForbiddenException();
        const solicitud = await SolicitudService.bloquear(tx, solicitudId, actor);
        await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${presupuestoId} FOR UPDATE`;
        const presupuesto = await tx.presupuesto.findUnique({
            where: { id: presupuestoId }, include: { recursos: true }
        });
        if (!presupuesto || presupuesto.solicitudId !== solicitud.id ||
            presupuesto.clienteId !== solicitud.clienteId ||
            presupuesto.tipoEventoId !== solicitud.tipoEventoId) {
            throw new NotFoundException("La propuesta no pertenece a esta solicitud.");
        }
        const existente = await tx.evento.findFirst({
            where: { OR: [{ solicitudId }, { presupuestoId }] },
            select: resumenEvento
        });
        if (existente) {
            if (existente.solicitudId !== solicitudId || existente.presupuestoId !== presupuestoId) {
                throw new ConflictException("La solicitud o el presupuesto ya están contratados con otra propuesta.");
            }
            await IntegracionPresupuestosService.verificarAceptacion({ presupuesto, actorId, version });
            return existente;
        }
        if (solicitud.estado !== "EN_REVISION") {
            throw new ConflictException("La solicitud ya no está disponible para contratar.");
        }
        await IntegracionPresupuestosService.verificarAceptacion({ presupuesto, actorId, version });
        if (presupuesto.espacioId == null) {
            throw new ConflictException("Esta propuesta anterior no tiene un espacio registrado. Solicita al administrador una propuesta actualizada.");
        }
        const ubicacion = await this.validarPropuesta(tx, presupuesto);
        const evento = await tx.evento.create({
            data: {
                ...ubicacion,
                solicitudId, presupuestoId,
                clienteId: solicitud.clienteId, tipoEventoId: solicitud.tipoEventoId,
                inicio: presupuesto.inicio, fin: presupuesto.fin,
                estado: "CONFIRMADO", productorId: null,
                observaciones: solicitud.observaciones,
                recursos: { create: presupuesto.recursos.map(({ recursoId, cantidad }) => ({ recursoId, cantidad })) },
                cambios: { create: {
                    usuarioId: actorId, campo: "contratacion", valorAnterior: null,
                    valorNuevo: `Solicitud #${solicitudId}, presupuesto #${presupuestoId}, versión ${version}`
                } }
            },
            select: resumenEvento
        });
        await ContratacionRecursosService.reservar(tx, presupuesto, evento.id);
        await tx.reservaEspacio.create({ data: {
            espacioId: ubicacion.espacioId, eventoId: evento.id,
            referencia: `Contrato evento #${evento.id}`,
            inicio: presupuesto.inicio, fin: presupuesto.fin
        } });
        await tx.solicitudEvento.update({
            where: { id: solicitudId },
            data: {
                estado: "CONTRATADA",
                cambios: { create: SolicitudService.datosCambio(actorId, "FORMALIZACION",
                    { estado: solicitud.estado },
                    { estado: "CONTRATADA", presupuestoId, version, eventoId: evento.id }) }
            }
        });
        return evento;
    }
}

module.exports = new FormalizacionService();
