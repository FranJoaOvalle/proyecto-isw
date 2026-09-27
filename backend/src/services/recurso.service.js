const prisma = require("../db/prisma");

class RecursoService {
    async create(data) {
        return prisma.recurso.create({ data });
    }
}

module.exports = new RecursoService();
