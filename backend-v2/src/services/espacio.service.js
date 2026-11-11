const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");

const DisponibilidadService = require("./disponibilidad.service");
const UbicacionService = require("./ubicacion.service");
const ReservaService = require("./reserva.service");

const validarTarifa = ({ costoArriendo, unidadArriendo }) => {
    const tieneCosto = costoArriendo !== undefined && costoArriendo !== null;
    const tieneUnidad = unidadArriendo !== undefined && unidadArriendo !== null;
    if (tieneCosto !== tieneUnidad) {
        throw new ValidationException("Indique el costo y la unidad de arriendo juntos, o deje ambos vacíos.");
    }
};

class EspacioService {
    async getAll(intervalo) {
        const ahora = new Date();
        const espacios = await prisma.espacio.findMany({
            orderBy: { nombre: "asc" },
            include: {
                reservas: {
                    where: { cancelada: false, fin: { gt: ahora } },
                    orderBy: { inicio: "asc" },
                    take: 1
                },
                _count: { select: { reservas: true, eventos: true, presupuestos: true } }
            }
        });

        let ocupados = new Set();
        if (intervalo) {
            const reservas = await prisma.reservaEspacio.findMany({
                where: {
                    cancelada: false,
                    inicio: { lt: intervalo.fin },
                    fin: { gt: intervalo.inicio }
                },
                select: { espacioId: true }
            });
            ocupados = new Set(reservas.map(reserva => reserva.espacioId));
            const eventos = await prisma.evento.findMany({
                where: { estado: { not: "CANCELADO" }, inicio: { lt: intervalo.fin }, fin: { gt: intervalo.inicio } },
                select: { espacioId: true, lugar: true, direccion: true }
            });
            for (const espacio of espacios) {
                if (eventos.some(evento => evento.espacioId === espacio.id ||
                    DisponibilidadService.normalizarRecinto(evento.lugar) === DisponibilidadService.normalizarRecinto(espacio.nombre) || !evento.direccion &&
                    [espacio.nombre, espacio.direccion].some(valor =>
                        DisponibilidadService.normalizarRecinto(valor) === DisponibilidadService.normalizarRecinto(evento.lugar)))) {
                    ocupados.add(espacio.id);
                }
            }
        }

        return espacios.map(({ reservas, ...espacio }) => ({
            ...espacio,
            proximaReserva: reservas[0] ?? null,
            disponible: intervalo
                ? espacio.habilitado && !ocupados.has(espacio.id)
                : null
        }));
    }

    async getById(id, tx = prisma) {
        const espacio = await tx.espacio.findUnique({ where: { id: Number(id) } });
        if (!espacio) throw new NotFoundException("Espacio no encontrado.");
        return espacio;
    }

    async create(data) {
        validarTarifa(data);
        return prisma.espacio.create({ data });
    }

    async update(id, data) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${Number(id)})::text`;
            const actual = await this.getById(id, tx);
            validarTarifa({ ...actual, ...data });
            if ((data.capacidad !== undefined && data.capacidad < actual.capacidad) ||
                (data.direccion !== undefined && data.direccion !== actual.direccion) ||
                (data.comuna !== undefined && data.comuna !== actual.comuna)) {
                const comprometida = await tx.reservaEspacio.findFirst({ where: {
                    espacioId: Number(id), cancelada: false, fin: { gt: new Date() }
                } });
                if (comprometida) throw new ConflictException("El espacio tiene reservas vigentes. Revisa esas reservas antes de cambiar la dirección o reducir su capacidad.");
            }
            const cambiaDireccion = (data.direccion !== undefined && data.direccion !== actual.direccion) ||
                (data.comuna !== undefined && data.comuna !== actual.comuna);
            return tx.espacio.update({ where: { id: Number(id) }, data: {
                ...data, ...(cambiaDireccion ? { latitud: null, longitud: null } : {})
            } });
        });
    }

    async cambiarEstado(id, habilitado) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${Number(id)})::text`;
            const actual = await this.getById(id, tx);
            if (actual.habilitado === habilitado) {
                throw new ConflictException(habilitado
                    ? "El espacio ya está habilitado."
                    : "El espacio ya está deshabilitado.");
            }
            return tx.espacio.update({
                where: { id: Number(id) },
                data: { habilitado }
            });
        });
    }

    async eliminar(id) {
        const espacioId = Number(id);
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${espacioId})::text`;
            await this.getById(espacioId, tx);
            const [reservas, eventos, presupuestos] = await Promise.all([
                tx.reservaEspacio.count({ where: { espacioId } }),
                tx.evento.count({ where: { espacioId } }),
                tx.presupuesto.count({ where: { espacioId } })
            ]);
            if (reservas || eventos || presupuestos) {
                throw new ConflictException("No se puede eliminar el espacio porque tiene reservas, eventos o propuestas vinculadas. Deshabilítalo para conservar su historial.");
            }
            return tx.espacio.delete({ where: { id: espacioId } });
        });
    }

    async guardarUbicacion(id, { latitud, longitud }) {
        await this.getById(id);
        return prisma.espacio.update({
            where: { id: Number(id) },
            data: { latitud, longitud }
        });
    }

    async getReservas(id) {
        await this.getById(id);
        return prisma.reservaEspacio.findMany({
            where: { espacioId: Number(id) },
            orderBy: { inicio: "asc" }
        });
    }

    async reservar(id, data, usuario) {
        return prisma.$transaction(async tx => {
            const evento = await ReservaService.bloquearEvento(tx, data.eventoId);
            if (evento) await DisponibilidadService.bloquearUbicaciones(tx);
            const espacioId = Number(id);
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${espacioId})::text`;
            const espacio = await this.getById(espacioId, tx);
            if (!espacio.habilitado) {
                throw new ConflictException("El espacio está deshabilitado para nuevas reservas.");
            }

            if (evento) {
                if (evento.asistentes > espacio.capacidad) throw new ConflictException("La capacidad del espacio es menor a los asistentes del evento.");
                if (data.inicio > evento.inicio || data.fin < evento.fin) throw new ConflictException("La reserva del espacio debe cubrir el horario completo del evento.");
                const otra = await tx.reservaEspacio.findFirst({ where: { eventoId: evento.id, cancelada: false } });
                if (otra) throw new ConflictException("El evento ya tiene un espacio reservado. Cancela esa reserva antes de asignar otro.");
            }
            const eventos = await tx.evento.findMany({
                where: { estado: { not: "CANCELADO" }, inicio: { lt: data.fin }, fin: { gt: data.inicio },
                    ...(evento ? { id: { not: evento.id } } : {}) },
                select: { espacioId: true, lugar: true, direccion: true }
            });
            if (eventos.some(e => e.espacioId === espacioId ||
                DisponibilidadService.normalizarRecinto(e.lugar) === DisponibilidadService.normalizarRecinto(espacio.nombre) || !e.direccion && [espacio.nombre, espacio.direccion].some(v =>
                DisponibilidadService.normalizarRecinto(v) === DisponibilidadService.normalizarRecinto(e.lugar)))) {
                throw new ConflictException("Ya existe un evento en ese espacio y horario.");
            }
            const conflicto = await tx.reservaEspacio.findFirst({
                where: {
                    espacioId,
                    cancelada: false,
                    inicio: { lt: data.fin },
                    fin: { gt: data.inicio }
                },
                select: { id: true }
            });
            if (conflicto) {
                throw new ConflictException("El espacio ya tiene una reserva en ese horario.");
            }

            if (evento) {
                const ubicacion = UbicacionService.desdeEspacio(espacio, evento);
                await DisponibilidadService.verificarDisponibilidad({
                    ...ubicacion, inicio: evento.inicio, fin: evento.fin, productorId: evento.productorId
                }, evento.id, tx);
                const cambios = Object.entries(ubicacion).filter(([campo, valor]) => (evento[campo] ?? null) !== (valor ?? null)).map(([campo, valor]) => ({
                    usuarioId: usuario.id, campo, valorAnterior: evento[campo] == null ? null : String(evento[campo]), valorNuevo: valor == null ? null : String(valor)
                }));
                await tx.evento.update({ where: { id: evento.id }, data: { ...ubicacion, cambios: { create: cambios } } });
            }
            return tx.reservaEspacio.create({
                data: { ...data, espacioId }
            });
        });
    }

    async cancelarReserva(id) {
        return prisma.$transaction(async tx => {
            let reserva = await tx.reservaEspacio.findUnique({
                where: { id: Number(id) }
            });
            if (!reserva) throw new NotFoundException("Reserva no encontrada.");

            await tx.$queryRaw`SELECT pg_advisory_xact_lock(${reserva.espacioId})::text`;
            reserva = await tx.reservaEspacio.findUnique({ where: { id: Number(id) } });
            if (reserva.cancelada) {
                throw new ConflictException("La reserva ya está cancelada.");
            }

            return tx.reservaEspacio.update({
                where: { id: Number(id) },
                data: { cancelada: true }
            });
        });
    }
}

module.exports = new EspacioService();
