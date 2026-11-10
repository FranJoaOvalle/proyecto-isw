const prisma = require("../config/prisma");

class RecursoService {
    async listarActivos() {
        return prisma.recurso.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                tipo: true,
                precioUnitario: true,
                stockTotal: true,
                activo: true
            },
            orderBy: [{ tipo: "asc" }, { nombre: "asc" }]
        });
    }
}

module.exports = new RecursoService();
