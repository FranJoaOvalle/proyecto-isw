const prisma = require("../config/prisma");

const ForbiddenException = require("../exceptions/ForbiddenException");
const ConflictException = require("../exceptions/ConflictException");

const SeguimientoService = require("./seguimiento.service");
const DisponibilidadService = require("./disponibilidad.service");

class EventoService {

    validarAdmin(usuario) {
        if (usuario?.rol !== "ADMIN") {
            throw new ForbiddenException(
                "Solo un administrador puede gestionar eventos."
            );
        }
    }

    async bloquear(tx, id, usuario) {
        await SeguimientoService.evento(id, usuario, tx);
        // FOR UPDATE serializa cambios sobre el mismo evento; findUnique no bloquea.
        await tx.$queryRaw`SELECT "id" FROM "Evento" WHERE "id" = ${Number(id)} FOR UPDATE`;
        return SeguimientoService.evento(id, usuario, tx);
    }

    async actualizar(id, datos, usuario) {
        this.validarAdmin(usuario);
        return prisma.$transaction(
            async (tx) => {
                const actual = await this.bloquear(tx, id, usuario);
                if (["CANCELADO", "COMPLETADO"].includes(actual.estado)) {
                    throw new ConflictException(
                        "No se puede editar un evento cancelado o completado."
                    );
                }
                const inicio = datos.inicio ?? actual.inicio;
                const fin = datos.fin ?? actual.fin;
                if (fin <= inicio) {
                    throw new ConflictException(
                        "El término debe ser posterior al inicio."
                    );
                }
                const productorId = Object.hasOwn(datos, "productorId")
                    ? datos.productorId
                    : actual.productorId;
                if (datos.productorId != null) {
                    const productor = await tx.productor.findFirst({
                        where: {
                            id: datos.productorId,
                            usuario: { activo: true, rol: "PRODUCTOR" }
                        }
                    });
                    if (!productor) {
                        throw new ConflictException(
                            "El productor seleccionado no existe o está inactivo."
                        );
                    }
                }
                if (
                    datos.inicio ||
                    datos.fin ||
                    datos.lugar ||
                    Object.hasOwn(datos, "productorId")
                ) {
                    await DisponibilidadService.bloquearRecursos(
                        tx,
                        [actual.lugar, datos.lugar ?? actual.lugar],
                        [actual.productorId, productorId]
                    );
                    await DisponibilidadService.verificarDisponibilidad(
                        tx,
                        {
                            inicio,
                            fin,
                            lugar: datos.lugar ?? actual.lugar,
                            productorId
                        },
                        id
                    );
                }
                const cambios = Object.entries(datos)
                    .filter(([campo, valor]) => {
                        const previo = actual[campo];
                        return previo instanceof Date
                            ? previo.getTime() !== valor.getTime()
                            : previo !== valor;
                    })
                    .map(([campo, valor]) => ({
                        campo,
                        usuarioId: usuario.id,
                        valorAnterior:
                            actual[campo] instanceof Date
                                ? actual[campo].toISOString()
                                : actual[campo] == null
                                  ? null
                                  : String(actual[campo]),
                        valorNuevo:
                            valor instanceof Date
                                ? valor.toISOString()
                                : valor == null
                                  ? null
                                  : String(valor)
                    }));
                return tx.evento.update({
                    where: { id: Number(id) },
                    data: { ...datos, cambios: { create: cambios } }
                });
            },
            { isolationLevel: "ReadCommitted" }
        );
    }

    async cancelar(id, usuario) {
        this.validarAdmin(usuario);
        return prisma.$transaction(
            async (tx) => {
                const actual = await this.bloquear(tx, id, usuario);
                if (!["CONFIRMADO", "POSPUESTO"].includes(actual.estado)) {
                    throw new ConflictException(
                        "Solo se pueden cancelar eventos confirmados o pospuestos."
                    );
                }
                await DisponibilidadService.bloquearRecursos(
                    tx,
                    [actual.lugar],
                    [actual.productorId]
                );
                return tx.evento.update({
                    where: { id: Number(id) },
                    data: {
                        estado: "CANCELADO",
                        cambios: {
                            create: {
                                usuarioId: usuario.id,
                                campo: "estado",
                                valorAnterior: actual.estado,
                                valorNuevo: "CANCELADO"
                            }
                        }
                    }
                });
            },
            { isolationLevel: "ReadCommitted" }
        );
    }

    async eliminar(id, usuario) {
        this.validarAdmin(usuario);
        const actual = await SeguimientoService.evento(id, usuario);
        if (actual.estado !== "CANCELADO") {
            throw new ConflictException(
                "Solo se evalúa la eliminación de eventos cancelados."
            );
        }
        // En V2 todo evento conserva un presupuesto obligatorio. Nunca borrar en cascada sus antecedentes.
        throw new ConflictException(
            "No se puede eliminar definitivamente: el evento conserva un presupuesto contratado y antecedentes que deben mantenerse. La cancelación conserva su historial."
        );
    }
}

module.exports = new EventoService();
