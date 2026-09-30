const prisma = require('../db/prisma');
const { Prisma } = require('../../generated/prisma/client.ts');
const NotFoundException = require('../exceptions/NotFoundException');
const ConflictException = require('../exceptions/ConflictException');
const ValidationException = require('../exceptions/ValidationException');
const include = { cliente: true, evento: true, servicios: true };
const dinero = value => new Prisma.Decimal(value).toDecimalPlaces(2);
class PresupuestoService {
    async getAll() { return prisma.presupuesto.findMany({ include, orderBy: { id: 'desc' } }); }
    async getById(id, tx = prisma) {
        const p = await tx.presupuesto.findUnique({ where: { id }, include });
        if (!p) throw new NotFoundException('Presupuesto no encontrado.');
        return p;
    }
    async lock(tx, id) {
        await tx.$queryRaw`SELECT id FROM presupuestos WHERE id = ${id} FOR UPDATE`;
        const p = await this.getById(id, tx);
        if (p.estado !== 'PENDIENTE') throw new ConflictException('Solo se pueden modificar o archivar presupuestos pendientes.');
        return p;
    }
    async calcular(tx, data, actual) {
        const evento = await tx.evento.findUnique({ where: { id: data.eventoId }, include: { cliente: true } });
        if (!evento || !evento.activo || !evento.cliente.activo || ['CANCELADO','FINALIZADO'].includes(evento.estado)) throw new ValidationException('Seleccione un evento vigente con cliente activo.');
        if (evento.clienteId !== data.clienteId) throw new ValidationException('El evento no pertenece al cliente seleccionado.');
        const catalogo = await tx.servicio.findMany({ where: { id_servicio: { in: data.servicios.map(s => s.servicioId) } } });
        const detalles = data.servicios.map(item => {
            const servicio = catalogo.find(s => s.id_servicio === item.servicioId);
            if (!servicio || !servicio.estado) throw new ValidationException('Todos los servicios deben existir y estar activos.');
            const anterior = actual?.servicios.find(s => s.servicioId === item.servicioId);
            const precio = dinero(anterior?.precioUnitario ?? servicio.precio_base);
            if (!precio.isFinite() || precio.isNegative()) throw new ValidationException('Precio de catálogo inválido.');
            const subtotal = precio.mul(item.cantidad);
            return { ...item, nombre: anterior?.nombre ?? servicio.nombre, precioUnitario: precio, subtotal };
        });
        const subtotal = detalles.reduce((s, item) => s.plus(item.subtotal), dinero(0));
        const descuento = dinero(data.descuento);
        if (subtotal.gt('999999999999.99')) throw new ValidationException('El monto supera el límite permitido.');
        if (descuento.gt(subtotal)) throw new ValidationException('El descuento no puede superar el subtotal.');
        return { clienteId: data.clienteId, eventoId: data.eventoId, observaciones: data.observaciones ?? null, descuento, subtotal, totalEstimado: subtotal.minus(descuento), servicios: { create: detalles } };
    }
    async create(data) {
        return prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM eventos WHERE id = ${data.eventoId} FOR UPDATE`;
            if (await tx.presupuesto.findUnique({ where: { eventoId: data.eventoId } })) throw new ConflictException('El evento ya tiene un presupuesto; consulte el existente.');
            return tx.presupuesto.create({ data: await this.calcular(tx, data), include });
        });
    }
    async update(id, data) {
        return prisma.$transaction(async tx => {
            const actual = await this.lock(tx, id);
            if (actual.eventoId !== data.eventoId || actual.clienteId !== data.clienteId) throw new ConflictException('No se puede cambiar el cliente ni el evento de un presupuesto existente.');
            const cambios = await this.calcular(tx, data, actual);
            await tx.presupuestoServicio.deleteMany({ where: { presupuestoId: id } });
            return tx.presupuesto.update({ where: { id }, data: cambios, include });
        });
    }
    async cambiarEstado(id, estado) {
        return prisma.$transaction(async tx => {
            await this.lock(tx, id);
            return tx.presupuesto.update({ where: { id }, data: { estado }, include });
        });
    }
}
module.exports = new PresupuestoService();
