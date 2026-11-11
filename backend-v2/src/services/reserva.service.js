const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const UbicacionService = require("./ubicacion.service");
const DisponibilidadService = require("./disponibilidad.service");

class ReservaService {

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
        await tx.$queryRaw`SELECT "id" FROM "Evento" WHERE "id" = ${Number(eventoId)} FOR UPDATE`;
        const evento = await tx.evento.findUnique({
            where: { id: Number(eventoId) }
        });
        if (!evento) throw new NotFoundException("Evento no encontrado.");
        if (["CANCELADO", "COMPLETADO"].includes(evento.estado)) {
            throw new ConflictException(
                "No se pueden reservar recursos para un evento cancelado o completado."
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
            datos = await UbicacionService.preparar(evento, datos, tx);
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
                !completarUbicacion &&
                (espacios.length || recursos.length || vehiculos.length)
            ) {
                throw new ConflictException(
                    "El evento tiene reservas vinculadas. Cancélalas y vuelve a reservar antes de cambiar fechas, lugar o asistentes."
                );
            }
            const ahora = new Date();
            if (
                [...recursos, ...vehiculos].some(
                    (r) =>
                        r.estadoDevolucion === "PENDIENTE" && r.inicio <= ahora
                )
            ) {
                throw new ConflictException(
                    "Registra la devolución de los equipos y vehículos utilizados antes de cancelar el evento."
                );
            }
            if (datos.estado !== "CANCELADO") {
                await DisponibilidadService.verificarDisponibilidad(
                    {
                        inicio: datos.inicio ?? evento.inicio,
                        fin: datos.fin ?? evento.fin,
                        lugar: datos.lugar ?? evento.lugar,
                        direccion: datos.direccion ?? evento.direccion,
                        productorId: evento.productorId,
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
            return tx.evento.update({
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
        });
    }
}

module.exports = new ReservaService();
