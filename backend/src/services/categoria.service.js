const bcrypt = require("bcryptjs");

const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class CategoriaService {
    async getAll(incluirInactivos = false) {
        return prisma.categoria.findMany({
            where: incluirInactivos ? {} : { estado: true },
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const categoria = await prisma.categoria.findUnique({
            where: { id }
        });

        if (!categoria) throw new NotFoundException("Categoria no encontrada.");

        return categoria;
    }

    async create(data) {
        return prisma.categoria.create({
            data
        });
    }

    async update(id, data) {
        const categoria = await this.getById(id);

        if (!categoria.estado) throw new ConflictException("No se puede modificar una categoria desactivada.");

        return prisma.categoria.update({
            where: { id },
            data
        });
    }

    async remove(id) {
        const categoria = await this.getById(id);

        if (!categoria.estado) throw new ConflictException("La categoria ya se encuentra desactivada.");

        return prisma.categoria.update({
            where: { id },
            data: { estado: false }
        });
    }

    async reactivate(id) {
        const categoria = await this.getById(id);

        if (categoria.estado) throw new ConflictException("La categoria ya se encuentra activa.");

        return prisma.categoria.update({
            where: { id },
            data: { estado: true }
        });
    }
}

module.exports = new CategoriaService();