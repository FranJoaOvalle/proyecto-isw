const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

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

    // El futuro servicio de asignaciones debe invocar esta validación antes de asignar.
    // Comprueba el estado del recurso; no calcula reservas ni disponibilidad por fecha.
    async validateAvailability(id) {
        const recurso = await this.getById(id);

        if (recurso.estado !== "DISPONIBLE") {
            throw new ConflictException(
                "Solo se pueden asignar recursos en estado disponible."
            );
        }

        return recurso;
    }

    async create(data) {
        require("../utils/validarTarifa")({ origen: "SIN_DEFINIR", ...data });
        return prisma.recurso.create({ data });
    }

    async update(id, data) {
        const actual = await this.getById(id);
        require("../utils/validarTarifa")({ ...actual, ...data });

        return prisma.recurso.update({
            where: { id_recurso: Number(id) },
            data
        });
    }

    async remove(id) {
        const recurso = await this.getById(id);

        if (recurso.estado === "RETIRADO") {
            throw new ConflictException(
                "El recurso ya se encuentra retirado."
            );
        }

        return prisma.recurso.update({
            where: { id_recurso: Number(id) },
            data: { estado: "RETIRADO" }
        });
    }
}

module.exports = new RecursoService();
