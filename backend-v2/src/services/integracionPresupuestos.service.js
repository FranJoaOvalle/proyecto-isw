const ConflictException = require("../exceptions/ConflictException");

class IntegracionPresupuestosService {

    async verificarAceptacion({ presupuesto, actorId, version }) {
        if (
            presupuesto.estado !== "ACEPTADO" ||
            !presupuesto.enviadoAt ||
            !presupuesto.enviadoPorId ||
            !presupuesto.aceptadoAt ||
            presupuesto.aceptadoPorId !== actorId ||
            presupuesto.version !== version ||
            presupuesto.versionAceptada !== version ||
            !presupuesto.venceAt ||
            presupuesto.aceptadoAt > presupuesto.venceAt
        ) {
            throw new ConflictException(
                "La propuesta no acredita una aceptación vigente de esta versión."
            );
        }
    }

    async resolverVencidas({ tx, solicitudId, actorId }) {
        const vencidas = await tx.presupuesto.findMany({
            where: { solicitudId, estado: "ENVIADO", venceAt: { lte: new Date() } },
            select: { id: true },
            orderBy: { id: "asc" }
        });
        if (!vencidas.length) return;
        await tx.presupuesto.updateMany({
            where: { id: { in: vencidas.map((p) => p.id) }, estado: "ENVIADO" },
            data: { estado: "VENCIDO" }
        });
        await tx.solicitudEventoCambio.create({ data: {
            solicitudId, actorId, accion: "VENCIMIENTO_PROPUESTAS",
            nuevo: { presupuestos: vencidas.map((p) => p.id) }
        } });
    }

    async verificarCierreSolicitud({ tx, solicitudId, actorId }) {
        await this.resolverVencidas({ tx, solicitudId, actorId });
        // CANCELADO/VENCIDO y pagos FALLIDOS/REEMBOLSADOS son historial resuelto;
        // propuestas activas, pagos pendientes/pagados o eventos aún comprometen la solicitud.
        const propuestas = await tx.presupuesto.findMany({
            where: { solicitudId },
            select: {
                id: true,
                estado: true,
                evento: { select: { id: true } },
                pagos: { select: { estado: true } }
            }
        });
        const propuestaNoResuelta = propuestas.find((propuesta) =>
            !["CANCELADO", "VENCIDO"].includes(propuesta.estado) ||
            propuesta.evento !== null ||
            propuesta.pagos.some((pago) => ["PENDIENTE", "PAGADO"].includes(pago.estado))
        );
        if (propuestaNoResuelta) {
            throw new ConflictException(
                "La solicitud conserva una propuesta activa, un evento o un compromiso de pago pendiente de resolver."
            );
        }
    }

    async verificarEdicionSolicitud({ tx, solicitudId, actorId, invalidarBorradores }) {
        await this.resolverVencidas({ tx, solicitudId, actorId });
        const propuestas = await tx.presupuesto.findMany({
            where: { solicitudId },
            select: { id: true, estado: true, evento: { select: { id: true } }, pagos: { select: { estado: true } } },
            orderBy: { id: "asc" }
        });
        if (propuestas.some((p) => !["BORRADOR", "CANCELADO", "VENCIDO"].includes(p.estado) ||
            p.evento || p.pagos.some((pago) => ["PENDIENTE", "PAGADO"].includes(pago.estado)))) {
            throw new ConflictException("Cancela las propuestas enviadas y resuelve sus compromisos antes de cambiar la solicitud.");
        }
        const borradores = propuestas.filter((p) => p.estado === "BORRADOR");
        if (!borradores.length) return;
        if (!invalidarBorradores) {
            throw new ConflictException("Confirma la cancelación de los borradores anteriores para modificar la solicitud.");
        }
        await tx.presupuesto.updateMany({
            where: { id: { in: borradores.map((p) => p.id) }, estado: "BORRADOR" },
            data: { estado: "CANCELADO", version: { increment: 1 } }
        });
        await tx.solicitudEventoCambio.create({ data: {
            solicitudId, actorId, accion: "INVALIDACION_BORRADORES",
            nuevo: { presupuestos: borradores.map((p) => p.id) }
        } });
    }
}

module.exports = new IntegracionPresupuestosService();
