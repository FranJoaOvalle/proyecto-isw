const prisma = require("../config/prisma");

const ForbiddenException = require("../exceptions/ForbiddenException");
const ConflictException = require("../exceptions/ConflictException");

const SeguimientoService = require("./seguimiento.service");
const DisponibilidadService = require("./disponibilidad.service");

const ReservaService = require("./reserva.service");

class EventoService {

    validarAdmin(usuario) {
        if (usuario?.rol !== "ADMIN") {
            throw new ForbiddenException(
                "Solo un administrador puede gestionar eventos."
            );
        }
    }

    async actualizar(id, datos, usuario) {
        this.validarAdmin(usuario);
        const actual = await SeguimientoService.evento(id, usuario);

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
            const productor = await prisma.productor.findFirst({
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
            await DisponibilidadService.verificarDisponibilidad(
                {
                    inicio,
                    fin,
                    lugar: datos.lugar ?? actual.lugar,
                    productorId,
                    espacioId:
                        datos.lugar && datos.lugar !== actual.lugar
                            ? null
                            : actual.espacioId
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

        if (cambios.some(cambio => ["inicio", "fin", "lugar", "asistentes"].includes(cambio.campo))) {
            return ReservaService.actualizarEvento(actual, datos, cambios);
        }
        return prisma.evento.update({
            where: { id: Number(id) },
            data: { ...datos, cambios: { create: cambios } }
        });
    }

    async cancelar(id, usuario) {
        this.validarAdmin(usuario);
        const actual = await SeguimientoService.evento(id, usuario);
        if (!["CONFIRMADO", "POSPUESTO"].includes(actual.estado)) {
            throw new ConflictException(
                "Solo se pueden cancelar eventos confirmados o pospuestos."
            );
        }
        return ReservaService.actualizarEvento(
            actual,
            { estado: "CANCELADO" },
            [
                {
                    usuarioId: usuario.id,
                    campo: "estado",
                    valorAnterior: actual.estado,
                    valorNuevo: "CANCELADO"
                }
            ]
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
