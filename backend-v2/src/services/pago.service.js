const prisma = require("../config/prisma");

class PagoService {
    async listar() {
        return prisma.pago.findMany({
            select: {
                id: true,
                presupuestoId: true,
                tipo: true,
                monto: true,
                estado: true,
                fechaPago: true,
                referencia: true,
                createdAt: true,
                presupuesto: {
                    select: {
                        id: true,
                        solicitudId: true,
                        nombreTipoEvento: true,
                        evento: { select: { id: true } }
                    }
                }
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }]
        });
    }
}

module.exports = new PagoService();
