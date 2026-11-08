const Conflict = require("../exceptions/ConflictException");
const normalizarRecinto = texto => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");

async function bloquearRecursos(tx, lugares, productores = []) {
    const claves = [...new Set([
        ...lugares.filter(Boolean).map(v => `recinto:${normalizarRecinto(v)}`),
        ...productores.filter(v => v != null).map(v => `productor:${v}`)
    ])].sort();
    for (const clave of claves) await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clave}, 0))::text`;
}

async function verificarDisponibilidad(tx, datos, excluirId = null) {
    const { inicio, fin, lugar, productorId } = datos;
    if (!(inicio instanceof Date) || !(fin instanceof Date) || fin <= inicio || !lugar?.trim()) throw new Conflict("Fechas o recinto definitivos inválidos.");
    const coincidentes = await tx.evento.findMany({ where: {
        ...(excluirId ? { id: { not: Number(excluirId) } } : {}),
        estado: { not: "CANCELADO" }, inicio: { lt: fin }, fin: { gt: inicio }
    }, select: { id: true, lugar: true, productorId: true } });
    if (coincidentes.some(v => normalizarRecinto(v.lugar) === normalizarRecinto(lugar))) throw new Conflict("Ya existe un evento en ese recinto y horario.");
    if (productorId != null && coincidentes.some(v => v.productorId === productorId)) throw new Conflict("El productor ya tiene un evento en ese horario.");
    // Se conserva la validación operativa de Agenda; no representa reserva física.
    const actividad = await tx.actividad.findFirst({ where: {
        estado: { not: "CANCELADA" }, inicio: { lt: fin }, fin: { gt: inicio },
        ...(excluirId ? { AND: [{ OR: [{ eventoId: null }, { eventoId: { not: Number(excluirId) } }] }] } : {}),
        OR: [ ...(productorId != null ? [{ productores: { some: { productorId } } }] : []),
            { lugar: { equals: lugar.trim(), mode: "insensitive" } } ]
    } });
    if (actividad) throw new Conflict("Existe una actividad de Agenda incompatible con el productor o lugar en ese horario. Requiere revisión administrativa.");
}
module.exports = { normalizarRecinto, bloquearRecursos, verificarDisponibilidad };
