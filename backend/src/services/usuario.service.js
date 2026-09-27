const prisma = require("../db/prisma");

class UsuarioService {
    async getGestores() {
        return prisma.usuario.findMany({
            where: {
                activo: true,
                rol: {
                    in: ["PRODUCCION", "COMERCIAL"]
                }
            },
            select: {
                id: true,
                email: true,
                rol: true,
                personal: {
                    select: {
                        id: true,
                        nombre: true,
                        activo: true
                    }
                }
            },
            orderBy: {
                email: "asc"
            }
        });
    }
}

module.exports = new UsuarioService();