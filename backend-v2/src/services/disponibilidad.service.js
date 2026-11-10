const prisma = require("../config/prisma");
const ConflictException = require("../exceptions/ConflictException");

class DisponibilidadService {

    normalizarRecinto(texto) {
        return texto
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");
    }

    async verificarDisponibilidad(datos, excluirId = null, cliente = prisma) {
        const { inicio, fin, lugar, productorId, espacioId } = datos;
        if (
            !(inicio instanceof Date) ||
            !(fin instanceof Date) ||
            fin <= inicio ||
            !lugar?.trim()
        ) {
            throw new ConflictException(
                "Fechas o recinto definitivos inválidos."
            );
        }
        const coincidentes = await cliente.evento.findMany({
            where: {
                ...(excluirId ? { id: { not: Number(excluirId) } } : {}),
                estado: { not: "CANCELADO" },
                inicio: { lt: fin },
                fin: { gt: inicio }
            },
            select: { id: true, lugar: true, productorId: true }
        });
        if (
            coincidentes.some(
                (v) =>
                    this.normalizarRecinto(v.lugar) ===
                    this.normalizarRecinto(lugar)
            )
        ) {
            throw new ConflictException(
                "Ya existe un evento en ese recinto y horario."
            );
        }
        if (
            productorId != null &&
            coincidentes.some((v) => v.productorId === productorId)
        ) {
            throw new ConflictException(
                "El productor ya tiene un evento en ese horario."
            );
        }
        const espacios = await cliente.espacio.findMany({
            select: { id: true, nombre: true, direccion: true }
        });
        const ids = espacios
            .filter(
                (espacio) =>
                    espacio.id === espacioId ||
                    [espacio.nombre, espacio.direccion].some(
                        (valor) =>
                            this.normalizarRecinto(valor) ===
                            this.normalizarRecinto(lugar)
                    )
            )
            .map((espacio) => espacio.id);
        if (
            ids.length &&
            (await cliente.reservaEspacio.findFirst({
                where: {
                    espacioId: { in: ids },
                    cancelada: false,
                    inicio: { lt: fin },
                    fin: { gt: inicio },
                    ...(excluirId
                        ? {
                              OR: [
                                  { eventoId: null },
                                  { eventoId: { not: Number(excluirId) } }
                              ]
                          }
                        : {})
                }
            }))
        ) {
            throw new ConflictException(
                "El espacio tiene una reserva en ese horario."
            );
        }
        // Se conserva la validación operativa de Agenda; no representa reserva física.
        const actividad = await cliente.actividad.findFirst({
            where: {
                estado: { not: "CANCELADA" },
                inicio: { lt: fin },
                fin: { gt: inicio },
                ...(excluirId
                    ? {
                          AND: [
                              {
                                  OR: [
                                      { eventoId: null },
                                      { eventoId: { not: Number(excluirId) } }
                                  ]
                              }
                          ]
                      }
                    : {}),
                OR: [
                    ...(productorId != null
                        ? [{ productores: { some: { productorId } } }]
                        : []),
                    { lugar: { equals: lugar.trim(), mode: "insensitive" } }
                ]
            }
        });
        if (actividad) {
            throw new ConflictException(
                "Existe una actividad de Agenda incompatible con el productor o lugar en ese horario. Requiere revisión administrativa."
            );
        }
    }
}

module.exports = new DisponibilidadService();
