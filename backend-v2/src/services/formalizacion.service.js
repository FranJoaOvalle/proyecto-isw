const ConflictException = require("../exceptions/ConflictException");
const ForbiddenException = require("../exceptions/ForbiddenException");
const NotFoundException = require("../exceptions/NotFoundException");

const SolicitudService = require("./solicitud.service");
const DisponibilidadService = require("./disponibilidad.service");
const IntegracionPresupuestosService = require("./integracionPresupuestos.service");

// El adaptador debe ser código servidor de Presupuestos y consultar evidencias en tx.
// La implementación predeterminada falla cerrada; no existe ruta HTTP de formalización.
const verificarAceptacionPredeterminada =
    IntegracionPresupuestosService.verificarAceptacion;

class FormalizacionService {

    // Conserva el punto de integración que permite aportar el verificador comercial.
    crearFormalizador({
        verificarAceptacion = IntegracionPresupuestosService.verificarAceptacion
    } = {}) {
        const servicio = new FormalizacionService();

        return (datos) =>
            servicio.formalizarContratacion(datos, verificarAceptacion);
    }

    async formalizarContratacion(
        { tx, solicitudId, presupuestoId, actorId },
        verificarAceptacion = verificarAceptacionPredeterminada
    ) {
        if (!tx || typeof tx.$queryRaw !== "function") {
            throw new ConflictException(
                "La formalización requiere la transacción de Presupuestos."
            );
        }
        const actor = await tx.usuario.findUnique({ where: { id: actorId } });
        if (!actor?.activo || actor.rol !== "CLIENTE") {
            throw new ForbiddenException(
                "La aceptación debe corresponder al cliente autenticado."
            );
        }
        // Prisma no expone el aislamiento del tx recibido del orquestador.
        const aislamiento = await tx.$queryRaw`SHOW transaction_isolation`;
        if (aislamiento[0]?.transaction_isolation !== "read committed") {
            throw new ConflictException(
                "El orquestador debe usar aislamiento ReadCommitted para las lecturas posteriores a los bloqueos."
            );
        }
        const solicitud = await SolicitudService.bloquear(tx, solicitudId, actor);
        // Conserva el orden de bloqueo Solicitud -> Presupuesto -> disponibilidad.
        await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${Number(presupuestoId)} FOR UPDATE`;
        const presupuesto = await tx.presupuesto.findUnique({
            where: { id: Number(presupuestoId) },
            include: { evento: true }
        });
        if (
            !presupuesto ||
            presupuesto.solicitudId !== solicitud.id ||
            presupuesto.clienteId !== solicitud.clienteId ||
            presupuesto.tipoEventoId !== solicitud.tipoEventoId
        ) {
            throw new NotFoundException(
                "Presupuesto de la solicitud no encontrado."
            );
        }
        if (solicitud.evento) {
            const existente = await tx.evento.findUnique({
                where: { id: solicitud.evento.id }
            });
            if (existente.presupuestoId !== presupuesto.id) {
                throw new ConflictException(
                    "La solicitud ya fue contratada con otro presupuesto."
                );
            }
            return existente;
        }
        if (presupuesto.evento) {
            throw new ConflictException("El presupuesto ya tiene un evento.");
        }
        if (solicitud.estado !== "EN_REVISION") {
            throw new ConflictException("La solicitud debe estar en revisión.");
        }
        if (
            presupuesto.estado !== "ACEPTADO" ||
            !presupuesto.venceAt ||
            presupuesto.venceAt <= new Date()
        ) {
            throw new ConflictException(
                "El presupuesto no está aceptado o no tiene vigencia comprobable."
            );
        }
        // Impide desactivar el tipo entre la comprobación y el commit.
        await tx.$queryRaw`SELECT "id" FROM "TipoEvento" WHERE "id" = ${solicitud.tipoEventoId} FOR SHARE`;
        const tipo = await tx.tipoEvento.findUnique({
            where: { id: solicitud.tipoEventoId }
        });
        if (!tipo?.activo) {
            throw new ConflictException("El tipo de evento está inactivo.");
        }
        await verificarAceptacion({ tx, solicitud, presupuesto, actorId });
        const datos = {
            clienteId: solicitud.clienteId,
            tipoEventoId: solicitud.tipoEventoId,
            inicio: presupuesto.inicio,
            fin: presupuesto.fin,
            lugar: presupuesto.lugar,
            asistentes: presupuesto.asistentes,
            presupuestoId: presupuesto.id,
            solicitudId: solicitud.id,
            productorId: null,
            estado: "CONFIRMADO"
        };
        if (
            datos.inicio <= new Date() ||
            !Number.isInteger(datos.asistentes) ||
            datos.asistentes <= 0
        ) {
            throw new ConflictException(
                "Los datos definitivos del presupuesto son inválidos."
            );
        }
        await DisponibilidadService.bloquearRecursos(tx, [datos.lugar]);
        await DisponibilidadService.verificarDisponibilidad(tx, datos);
        const evento = await tx.evento.create({ data: datos });
        await tx.solicitudEvento.update({
            where: { id: solicitud.id },
            data: { estado: "CONTRATADA" }
        });
        await SolicitudService.auditar(
            tx,
            solicitud.id,
            actorId,
            "FORMALIZACION",
            { estado: solicitud.estado },
            { estado: "CONTRATADA", eventoId: evento.id, presupuestoId }
        );
        return evento;
    }
}

module.exports = new FormalizacionService();
