const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class TipoEventoService {

    async getAll(incluirInactivos = false) {
        return prisma.tipoEvento.findMany({
            where: incluirInactivos ? {} : { activo: true },
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const tipoEvento = await prisma.tipoEvento.findUnique({
            where: { id: Number(id) }
        });

        if (!tipoEvento) {
            throw new NotFoundException("Tipo de Evento no encontrado.");
        }

        return tipoEvento;
    }

    async create(data) {
        return prisma.tipoEvento.create({
            data
        });
    }

    async update(id, data) {
        const tipoEvento = await this.getById(id);

        if (!tipoEvento.activo) {
            throw new ConflictException(
                "No se puede modificar un tipo de evento desactivado."
            );
        }

        return prisma.tipoEvento.update({
            where: { id: Number(id) },
            data
        });
    }

    async remove(id) {
        const tipoEvento = await this.getById(id);

        if (!tipoEvento.activo) {
            throw new ConflictException(
                "El tipo de evento ya se encuentra desactivado."
            );
        }

        return prisma.tipoEvento.update({
            where: { id: Number(id) },
            data: { activo: false }
        });
    }

    async reactivate(id) {
        const tipoEvento = await this.getById(id);

        if (tipoEvento.activo) {
            throw new ConflictException(
                "El tipo de evento ya se encuentra activo."
            );
        }

        return prisma.tipoEvento.update({
            where: { id: Number(id) },
            data: { activo: true }
        });
    }

    async removePhysical(id) {
        await this.getById(id);

        try {
            return await prisma.tipoEvento.delete({
                where: { id: Number(id) }
            });
        } catch (error) {
            if (error.code === "P2003" || error.code === "P2014") {
                throw new ConflictException(
                    "No se puede eliminar físicamente el tipo de evento porque tiene registros relacionados."
                );
            }

            throw error;
        }
    }
}

module.exports = new TipoEventoService();