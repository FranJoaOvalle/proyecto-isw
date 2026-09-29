const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class EspacioService {
    async lock(tx, id) {
        // Serializa reservas y cambios de estado del mismo espacio.
        await tx.$queryRaw`SELECT "id" FROM "Espacio" WHERE "id" = ${id} FOR UPDATE`;
        const espacio = await tx.espacio.findUnique({ where: { id } });
        if (!espacio) throw new NotFoundException("Espacio no encontrado.");
        return espacio;
    }

    async getAll(intervalo) {
        const ahora = new Date();
        const espacios = await prisma.espacio.findMany({ orderBy: { nombre: "asc" }, include: {
            reservas: { where: { cancelada: false, fin: { gt: ahora } }, orderBy: { inicio: "asc" }, take: 1 }
        } });
        return Promise.all(espacios.map(async ({ reservas, ...espacio }) => ({
            ...espacio,
            proximaReserva: reservas[0] || null,
            disponible: intervalo ? espacio.habilitado && !(await prisma.reservaEspacio.findFirst({ where: {
                espacioId: espacio.id, cancelada: false,
                inicio: { lt: intervalo.fin }, fin: { gt: intervalo.inicio }
            } })) : null
        })));
    }

    async create(data) {
        require("../utils/validarTarifa")(data);
        return prisma.espacio.create({ data });
    }

    async update(id, data) {
        return prisma.$transaction(async tx => {
            const actual = await this.lock(tx, id);
            require("../utils/validarTarifa")({ ...actual, ...data });
            return tx.espacio.update({ where: { id }, data });
        });
    }

    async getReservas(id) {
        if (!await prisma.espacio.findUnique({ where: { id } })) throw new NotFoundException("Espacio no encontrado.");
        return prisma.reservaEspacio.findMany({ where: { espacioId: id }, orderBy: { inicio: "asc" } });
    }

    async reservar(id, data) {
        return prisma.$transaction(async tx => {
            const espacio = await this.lock(tx, id);
            if (!espacio.habilitado) throw new ConflictException("El espacio está deshabilitado.");
            const cruce = await tx.reservaEspacio.findFirst({ where: {
                espacioId: id, cancelada: false, inicio: { lt: data.fin }, fin: { gt: data.inicio }
            } });
            if (cruce) throw new ConflictException("El espacio ya tiene una reserva en ese horario.");
            return tx.reservaEspacio.create({ data: { ...data, espacioId: id } });
        });
    }

    async cancelar(id) {
        const reserva = await prisma.reservaEspacio.findUnique({ where: { id } });
        if (!reserva) throw new NotFoundException("Reserva no encontrada.");
        return prisma.$transaction(async tx => {
            await this.lock(tx, reserva.espacioId);
            return tx.reservaEspacio.update({ where: { id }, data: { cancelada: true } });
        });
    }
}
module.exports = new EspacioService();
