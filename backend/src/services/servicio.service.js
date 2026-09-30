const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class ServicioService {

    async getAll(incluirInactivos = false) {
        return prisma.servicio.findMany({
            where: incluirInactivos ? {} : { estado: true },
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const servicio = await prisma.servicio.findUnique({
            where: { id_servicio: Number(id) }
        });

        if (!servicio) {
            throw new NotFoundException("Servicio no encontrado.");
        }

        return servicio;
    }

    async create(data) {
        return prisma.servicio.create({
            data
        });
    }

    async update(id, data) {
        const servicio = await this.getById(id);

        if (!servicio.estado) {
            throw new ConflictException(
                "No se puede modificar un servicio desactivado."
            );
        }

        return prisma.servicio.update({
            where: { id_servicio: Number(id) },
            data
        });
    }

    async remove(id) {
        const servicio = await this.getById(id);

        if (!servicio.estado) {
            throw new ConflictException(
                "El servicio ya se encuentra desactivado."
            );
        }

        return prisma.servicio.update({
            where: { id_servicio: Number(id) },
            data: { estado: false }
        });
    }

    async reactivate(id) {
        const servicio = await this.getById(id);

        if (servicio.estado) {
            throw new ConflictException(
                "El servicio ya se encuentra activo."
            );
        }

        return prisma.servicio.update({
            where: { id_servicio: Number(id) },
            data: { estado: true }
        });
    }
}

module.exports = new ServicioService();