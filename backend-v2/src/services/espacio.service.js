const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");

const bloquearEspacio = (tx, id) => tx.$queryRaw`
    SELECT pg_advisory_xact_lock(${Number(id)})::text AS lock
`;

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
                _count: { select: { reservas: true } }
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
        const actual = await this.getById(id);
        validarTarifa({ ...actual, ...data });
        return prisma.espacio.update({ where: { id: Number(id) }, data });
    }

    async cambiarEstado(id, habilitado) {
        const actual = await this.getById(id);
        if (actual.habilitado === habilitado) {
            throw new ConflictException(habilitado
                ? "El espacio ya está habilitado."
                : "El espacio ya está deshabilitado.");
        }
        return prisma.espacio.update({
            where: { id: Number(id) },
            data: { habilitado }
        });
    }

    async eliminar(id) {
        const espacioId = Number(id);
        await this.getById(espacioId);
        const reservas = await prisma.reservaEspacio.count({ where: { espacioId } });
        if (reservas > 0) {
            throw new ConflictException(`No se puede eliminar definitivamente porque tiene ${reservas} ${reservas === 1 ? "reserva" : "reservas"} asociadas. Deshabilítalo para conservar el historial.`);
        }
        return prisma.espacio.delete({ where: { id: espacioId } });
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

    async reservar(id, data) {
        return prisma.$transaction(async tx => {
            const espacioId = Number(id);
            await bloquearEspacio(tx, espacioId);
            const espacio = await this.getById(espacioId, tx);
            if (!espacio.habilitado) {
                throw new ConflictException("El espacio está deshabilitado para nuevas reservas.");
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

            return tx.reservaEspacio.create({
                data: { ...data, espacioId }
            });
        });
    }

    async cancelarReserva(id) {
        return prisma.$transaction(async tx => {
            const reserva = await tx.reservaEspacio.findUnique({
                where: { id: Number(id) }
            });
            if (!reserva) throw new NotFoundException("Reserva no encontrada.");

            await bloquearEspacio(tx, reserva.espacioId);
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
