const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const UbicacionService = require("./ubicacion.service");
const DisponibilidadService = require("./disponibilidad.service");
const ContratacionRecursosService = require("./contratacionRecursos.service");

class ReservaService {

    validarTransicion(evento, estado, ahora) {
        if (!estado) return;
        const transiciones = {
            CONFIRMADO: ["POSPUESTO", "EN_CURSO", "CANCELADO"],
            POSPUESTO: ["CONFIRMADO", "EN_CURSO", "CANCELADO"],
            EN_CURSO: ["COMPLETADO"]
        };
        if (!transiciones[evento.estado]?.includes(estado)) {
            throw new ConflictException("El cambio de estado no está permitido para este evento.");
        }
        if (["EN_CURSO", "COMPLETADO"].includes(estado) && evento.inicio > ahora) {
            throw new ConflictException("El evento todavía no ha comenzado según su horario confirmado.");
        }
        if (estado === "COMPLETADO" && evento.fin > ahora) {
            throw new ConflictException("El evento todavía no ha terminado según su horario confirmado.");
        }
    }

    ocupacionMaxima(reservas, inicio, fin, ahora = new Date()) {
        const movimientos = [];
        for (const reserva of reservas) {
            const termino =
                reserva.estadoDevolucion === "PENDIENTE" && reserva.fin <= ahora
                    ? Infinity
                    : reserva.fin.getTime();
            const desde = Math.max(inicio.getTime(), reserva.inicio.getTime());
            const hasta = Math.min(fin.getTime(), termino);
            if (desde < hasta) {
                movimientos.push(
                    [desde, reserva.cantidad],
                    [hasta, -reserva.cantidad]
                );
            }
        }
        movimientos.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let ocupacion = 0;
        let maxima = 0;
        for (const [, cantidad] of movimientos) {
            ocupacion += cantidad;
            maxima = Math.max(maxima, ocupacion);
        }
        return maxima;
    }

    async bloquearEvento(tx, eventoId) {
        if (eventoId == null) return null;
        // Excluye otras actualizaciones sin bloquear referencias FK de Agenda.
        await tx.$queryRaw`SELECT "id" FROM "Evento" WHERE "id" = ${Number(eventoId)} FOR NO KEY UPDATE`;
        const evento = await tx.evento.findUnique({
            where: { id: Number(eventoId) }
        });
        if (!evento) throw new NotFoundException("Evento no encontrado.");
        if (["CANCELADO", "COMPLETADO"].includes(evento.estado)) {
            throw new ConflictException(
                "El evento está cancelado o completado y no admite esta operación."
            );
        }
        return evento;
    }

    async actualizarEvento(actual, datos, cambios) {
        return prisma.$transaction(async (tx) => {
            const evento = await this.bloquearEvento(tx, actual.id);
            if (evento.updatedAt.getTime() !== actual.updatedAt.getTime()) {
                throw new ConflictException(
                    "El evento cambió. Actualiza la página antes de continuar."
                );
            }
            await DisponibilidadService.bloquearUbicaciones(tx);
            const ahora = new Date();
            this.validarTransicion(evento, datos.estado, ahora);
            datos = await UbicacionService.preparar(evento, datos, tx);
            const inicio = datos.inicio ?? evento.inicio;
            const fin = datos.fin ?? evento.fin;
            if (fin <= inicio) throw new ConflictException("El término debe ser posterior al inicio.");
            const difiere = campo => Object.hasOwn(datos, campo) && (
                evento[campo] instanceof Date
                    ? evento[campo].getTime() !== datos[campo].getTime()
                    : (evento[campo] ?? null) !== (datos[campo] ?? null)
            );
            const cambiaOperacion = ["inicio", "fin", "lugar", "asistentes", "espacioId", "direccion", "comuna"].some(difiere);
            const cambiaHorario = ["inicio", "fin"].some(difiere);
            const cambiaProductor = difiere("productorId");
            const productorId = Object.hasOwn(datos, "productorId") ? datos.productorId : evento.productorId;
            if (productorId != null && (cambiaOperacion || cambiaProductor || datos.estado === "EN_CURSO")) {
                const productor = await tx.productor.findFirst({
                    where: { id: productorId, usuario: { activo: true, rol: "PRODUCTOR" } }
                });
                if (!productor) throw new ConflictException("El productor seleccionado no existe o está inactivo.");
            }
            const lugares = [evento.lugar, datos.lugar ?? evento.lugar].map(
                (lugar) => DisponibilidadService.normalizarRecinto(lugar)
            );
            const espaciosRegistrados = await tx.espacio.findMany({
                select: { id: true, nombre: true, direccion: true }
            });
            const ids = espaciosRegistrados
                .filter(
                    (espacio) =>
                        espacio.id === evento.espacioId ||
                        espacio.id === datos.espacioId ||
                        [espacio.nombre, espacio.direccion].some((valor) =>
                            lugares.includes(
                                DisponibilidadService.normalizarRecinto(valor)
                            )
                        )
                )
                .map((espacio) => espacio.id)
                .sort((a, b) => a - b);
            for (const id of ids)
                await tx.$queryRaw`SELECT pg_advisory_xact_lock(${id})::text`;
            datos = await UbicacionService.preparar(evento, datos, tx);
            const [espacios, recursos, vehiculos] = await Promise.all([
                tx.reservaEspacio.findMany({
                    where: { eventoId: actual.id, cancelada: false }
                }),
                tx.reservaRecurso.findMany({
                    where: { eventoId: actual.id, cancelada: false }
                }),
                tx.reservaVehiculo.findMany({
                    where: { eventoId: actual.id, cancelada: false }
                })
            ]);
            const completarUbicacion =
                evento.espacioId != null &&
                datos.espacioId === evento.espacioId &&
                !(evento.direccion && evento.comuna) &&
                datos.direccion &&
                !datos.inicio &&
                !datos.fin &&
                !datos.asistentes;
            if (
                datos.estado !== "CANCELADO" &&
                cambiaOperacion &&
                !completarUbicacion &&
                (espacios.length || recursos.length || vehiculos.length)
            ) {
                throw new ConflictException(
                    "El evento tiene reservas vinculadas. Cancélalas y vuelve a reservar antes de cambiar fechas, lugar o asistentes."
                );
            }
            if (
                datos.estado === "CANCELADO" &&
                [...recursos, ...vehiculos].some(
                    (r) =>
                        r.estadoDevolucion === "PENDIENTE" && r.inicio <= ahora
                )
            ) {
                throw new ConflictException(
                    "Registra la devolución de los equipos y vehículos utilizados antes de cancelar el evento."
                );
            }
            if (datos.estado !== "CANCELADO" &&
                (cambiaOperacion || cambiaProductor || ["CONFIRMADO", "EN_CURSO"].includes(datos.estado))) {
                await DisponibilidadService.verificarDisponibilidad(
                    {
                        inicio,
                        fin,
                        lugar: datos.lugar ?? evento.lugar,
                        direccion: datos.direccion ?? evento.direccion,
                        productorId,
                        espacioId: Object.hasOwn(datos, "espacioId")
                            ? datos.espacioId
                            : datos.lugar && datos.lugar !== evento.lugar
                              ? null
                              : evento.espacioId
                    },
                    evento.id,
                    tx
                );
            }
            let planRecursos = null;
            if (datos.estado !== "CANCELADO" &&
                (cambiaHorario || (cambiaOperacion && evento.solicitudId != null && inicio > ahora))) {
                const detalle = await tx.eventoRecurso.findMany({
                    where: { eventoId: evento.id }, select: { recursoId: true, cantidad: true }
                });
                planRecursos = { inicio, fin, recursos: detalle };
                await ContratacionRecursosService.bloquearValidar(tx, planRecursos, evento.id);
            }
            const actualizado = await tx.evento.update({
                where: { id: actual.id },
                data: {
                    ...datos,
                    cambios: { create: cambios },
                    ...(datos.estado === "CANCELADO"
                        ? {
                              reservasEspacio: {
                                  updateMany: {
                                      where: { cancelada: false },
                                      data: { cancelada: true }
                                  }
                              },
                              reservasRecurso: {
                                  updateMany: {
                                      where: {
                                          cancelada: false,
                                          estadoDevolucion: "PENDIENTE"
                                      },
                                      data: { cancelada: true }
                                  }
                              },
                              reservasVehiculo: {
                                  updateMany: {
                                      where: {
                                          cancelada: false,
                                          estadoDevolucion: "PENDIENTE"
                                      },
                                      data: { cancelada: true }
                                  }
                              }
                          }
                        : {})
                }
            });
            // Corregir antecedentes ya terminados no genera devoluciones pendientes ficticias.
            if (planRecursos && fin > ahora) {
                await ContratacionRecursosService.reservar(tx, planRecursos, evento.id);
            }
            if (cambiaHorario && evento.solicitudId != null && actualizado.espacioId != null && fin > ahora) {
                await tx.reservaEspacio.create({ data: {
                    espacioId: actualizado.espacioId, eventoId: evento.id,
                    referencia: `Contrato evento #${evento.id}`, inicio, fin
                } });
            }
            return actualizado;
        });
    }
}

module.exports = new ReservaService();
