const prisma = require("../config/prisma");
const seguimiento = require("./seguimiento.service");
const ForbiddenException = require("../exceptions/ForbiddenException");
const ConflictException = require("../exceptions/ConflictException");

const validarAdmin = usuario => {
    if (usuario?.rol !== "ADMIN") throw new ForbiddenException("Solo un administrador puede gestionar eventos.");
};

class EventoService {
    async actualizar(id, datos, usuario) {
        validarAdmin(usuario);
        return prisma.$transaction(async tx => {
            const actual = await seguimiento.evento(id, usuario, tx);
            if (["CANCELADO", "COMPLETADO"].includes(actual.estado)) {
                throw new ConflictException("No se puede editar un evento cancelado o completado.");
            }
            const inicio = datos.inicio ?? actual.inicio;
            const fin = datos.fin ?? actual.fin;
            if (fin <= inicio) throw new ConflictException("El término debe ser posterior al inicio.");
            if (datos.inicio || datos.fin || datos.lugar) {
                const conflicto = await tx.evento.findFirst({ where: {
                    id: { not: Number(id) }, estado: { not: "CANCELADO" },
                    inicio: { lt: fin }, fin: { gt: inicio },
                    OR: [{ productorId: actual.productorId }, { lugar: { equals: datos.lugar ?? actual.lugar, mode: "insensitive" } }]
                } });
                if (conflicto) throw new ConflictException("El productor o el lugar ya tienen un evento en ese horario.");
                const actividad = await tx.actividad.findFirst({ where: {
                    estado: { not: "CANCELADA" }, inicio: { lt: fin }, fin: { gt: inicio },
                    AND: [{ OR: [{ eventoId: null }, { eventoId: { not: Number(id) } }] }],
                    OR: [{ productores: { some: { productorId: actual.productorId } } }, { lugar: { equals: datos.lugar ?? actual.lugar, mode: "insensitive" } }]
                } });
                if (actividad) throw new ConflictException("El productor o el lugar tienen una actividad en ese horario.");
            }
            const cambios = Object.entries(datos).filter(([campo, valor]) => {
                const previo = actual[campo];
                return previo instanceof Date ? previo.getTime() !== valor.getTime() : previo !== valor;
            }).map(([campo, valor]) => ({ campo, usuarioId: usuario.id,
                valorAnterior: actual[campo] instanceof Date ? actual[campo].toISOString() : actual[campo] == null ? null : String(actual[campo]),
                valorNuevo: valor instanceof Date ? valor.toISOString() : valor == null ? null : String(valor)
            }));
            return tx.evento.update({ where: { id: Number(id) }, data: { ...datos, cambios: { create: cambios } } });
        }, { isolationLevel: "Serializable" });
    }

    async cancelar(id, usuario) {
        validarAdmin(usuario);
        return prisma.$transaction(async tx => {
            const actual = await seguimiento.evento(id, usuario, tx);
            if (!["CONFIRMADO", "POSPUESTO"].includes(actual.estado)) {
                throw new ConflictException("Solo se pueden cancelar eventos confirmados o pospuestos.");
            }
            return tx.evento.update({ where: { id: Number(id) }, data: {
                estado: "CANCELADO", cambios: { create: {
                    usuarioId: usuario.id, campo: "estado", valorAnterior: actual.estado, valorNuevo: "CANCELADO"
                } }
            } });
        }, { isolationLevel: "Serializable" });
    }

    async eliminar(id, usuario) {
        validarAdmin(usuario);
        const actual = await seguimiento.evento(id, usuario);
        if (actual.estado !== "CANCELADO") throw new ConflictException("Solo se evalúa la eliminación de eventos cancelados.");
        // En V2 todo evento conserva un presupuesto obligatorio. Nunca borrar en cascada sus antecedentes.
        throw new ConflictException("No se puede eliminar definitivamente: el evento conserva un presupuesto contratado y antecedentes que deben mantenerse. La cancelación conserva su historial.");
    }
}
module.exports = new EventoService();
