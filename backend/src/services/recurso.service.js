const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");

class RecursoService {
    async getAll() {
        return prisma.recurso.findMany({
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const recurso = await prisma.recurso.findUnique({
            where: { id_recurso: Number(id) }
        });

        if (!recurso) {
            throw new NotFoundException("Recurso no encontrado.");
        }

        return recurso;
    }

    async create(data) {
        return prisma.recurso.create({ data });
    }

    async update(id, data) {
        await this.getById(id);

        return prisma.recurso.update({
            where: { id_recurso: Number(id) },
            data
        });
    }
}

module.exports = new RecursoService();
