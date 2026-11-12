const prisma = require("../config/prisma");

const ForbiddenException = require("../exceptions/ForbiddenException");
const ConflictException = require("../exceptions/ConflictException");
const NotFoundException = require("../exceptions/NotFoundException");

const SeguimientoService = require("./seguimiento.service");
const ReservaService = require("./reserva.service");
const UbicacionService = require("./ubicacion.service");

const resumenCliente = {
    id: true, solicitudId: true, presupuestoId: true,
    inicio: true, fin: true, lugar: true, direccion: true, comuna: true,
    referenciaDireccion: true, asistentes: true, estado: true, imagen_url: true,
    tipoEvento: { select: { id: true, nombre: true, imagen_url: true } },
    productor: { select: { id: true, nombres: true, apellidos: true } }
};

class EventoService {

    alcanceCliente(usuario) {
        if (usuario?.rol !== "CLIENTE") throw new ForbiddenException();
        return { cliente: { usuarioId: usuario.id } };
    }

    async listarCliente(usuario) {
        return prisma.evento.findMany({
            where: this.alcanceCliente(usuario),
            select: resumenCliente,
            orderBy: [{ inicio: "desc" }, { id: "desc" }]
        });
    }

    async detalleCliente(id, usuario) {
        const evento = await prisma.evento.findFirst({
            where: { id: Number(id), ...this.alcanceCliente(usuario) },
            select: resumenCliente
        });
        if (!evento) throw new NotFoundException("Evento no encontrado.");
        return evento;
    }

    validarAdmin(usuario) {
        if (usuario?.rol !== "ADMIN") {
            throw new ForbiddenException(
                "Solo un administrador puede gestionar eventos."
            );
        }
    }

    async actualizar(id, datos, usuario) {
        this.validarAdmin(usuario);
        if (Object.hasOwn(datos, "estado")) {
            throw new ConflictException("Utiliza la acción de cambio de estado e indica su motivo.");
        }
        const actual = await SeguimientoService.evento(id, usuario);

        if (["CANCELADO", "COMPLETADO"].includes(actual.estado)) {
            throw new ConflictException(
                "No se puede editar un evento cancelado o completado."
            );
        }
        datos = await UbicacionService.preparar(actual, datos);

        const inicio = datos.inicio ?? actual.inicio;
        const fin = datos.fin ?? actual.fin;

        if (fin <= inicio) {
            throw new ConflictException(
                "El término debe ser posterior al inicio."
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

        return ReservaService.actualizarEvento(actual, datos, cambios);
    }

    async cambiarEstado(id, datos, usuario) {
        this.validarAdmin(usuario);
        if (typeof datos.motivo !== "string" || datos.motivo.trim().length < 3 || datos.motivo.trim().length > 1000) {
            throw new ConflictException("Indica un motivo de entre tres y mil caracteres.");
        }
        const actual = await SeguimientoService.evento(id, usuario);
        return ReservaService.actualizarEvento(actual, { estado: datos.estado }, [{
            usuarioId: usuario.id,
            campo: "estado",
            valorAnterior: actual.estado,
            valorNuevo: datos.estado
        }, {
            usuarioId: usuario.id,
            campo: "motivoEstado",
            valorAnterior: null,
            valorNuevo: datos.motivo.trim()
        }]);
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
