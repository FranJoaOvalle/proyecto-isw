const prisma = require("../config/prisma");
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
        await this.getById(id);

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
        const tipoEvento = await this.getById(id);

        if (tipoEvento.activo) {
            throw new ConflictException(
                "Desactiva el tipo de evento antes de eliminarlo."
            );
        }

        const [eventos, presupuestos] = await Promise.all([
            prisma.evento.count({
                where: { tipoEventoId: Number(id) }
            }),
            prisma.presupuesto.count({
                where: { tipoEventoId: Number(id) }
            })
        ]);

        if (eventos > 0 || presupuestos > 0) {
            const relaciones = [];
            if (eventos > 0) relaciones.push(`${eventos} ${eventos === 1 ? "evento" : "eventos"}`);
            if (presupuestos > 0) relaciones.push(`${presupuestos} ${presupuestos === 1 ? "presupuesto" : "presupuestos"}`);

            throw new ConflictException(
                `No se puede eliminar el tipo de evento porque está asociado a ${relaciones.join(" y ")}.`
            );
        }

        try {
            return await prisma.tipoEvento.delete({
                where: { id: Number(id) }
            });
        } catch (error) {
            if (error.code === "P2003" || error.code === "P2014") {
                throw new ConflictException(
                    "No se puede eliminar el tipo de evento porque tiene registros relacionados."
                );
            }

            throw error;
        }
    }
}

module.exports = new TipoEventoService();
