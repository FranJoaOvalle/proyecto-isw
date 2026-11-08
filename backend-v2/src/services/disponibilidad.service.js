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

    async verificarDisponibilidad(datos, excluirId = null) {
        const { inicio, fin, lugar, productorId } = datos;
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
        const coincidentes = await prisma.evento.findMany({
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
        // Se conserva la validación operativa de Agenda; no representa reserva física.
        const actividad = await prisma.actividad.findFirst({
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
