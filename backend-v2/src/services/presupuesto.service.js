const prisma = require('../db/prisma');
const { Prisma } = require('@prisma/client');
const NotFoundException = require('../exceptions/NotFoundException');
const ConflictException = require('../exceptions/ConflictException');
const ValidationException = require('../exceptions/ValidationException');

const include = { cliente: true, tipoEvento: true, recursos: { include: { recurso: true } } };
const dinero = value => new Prisma.Decimal(value).toDecimalPlaces(2);

class PresupuestoService {
    async getAll() { 
        return prisma.presupuesto.findMany({ include, orderBy: { id: 'desc' } }); 
    }
    
    async getById(id, tx = prisma) {
        const p = await tx.presupuesto.findUnique({ where: { id }, include });
        if (!p) throw new NotFoundException('Presupuesto no encontrado.');
        return p;
    }

    async lock(tx, id) {
        await tx.$queryRaw`SELECT id FROM "Presupuesto" WHERE id = ${id} FOR UPDATE`;
        const p = await this.getById(id, tx);
        if (p.estado !== 'PENDIENTE' && p.estado !== 'BORRADOR') {
            throw new ConflictException('Solo se pueden modificar presupuestos pendientes o en borrador.');
        }
        return p;
    }

    async calcular(tx, data, actual) {
        // 1. Radar de Cliente: Validaciones explícitas con mensajes claros a prueba de balas
        const clienteAsociado = await tx.cliente.findUnique({
            where: { id: data.clienteId },
            include: { usuario: true }
        });

        if (!clienteAsociado) {
            throw new ValidationException(`Error de registro: No se encontró ningún cliente con el ID proporcionado (${data.clienteId}).`);
        }
        if (clienteAsociado.usuario && !clienteAsociado.usuario.activo) {
            throw new ValidationException(`Acceso denegado: El cliente asociado (${clienteAsociado.usuario.email}) se encuentra inactivo en el sistema.`);
        }

        // 2. Validar Tipo de Evento y cantidad de personas
        const tipoEvento = await tx.tipoEvento.findUnique({ where: { id: data.tipoEventoId } });
        if (!tipoEvento || !tipoEvento.activo) {
            throw new ValidationException('Seleccione un tipo de evento vigente.');
        }
        if (data.asistentes < tipoEvento.cantidadPersonasBase) {
            throw new ValidationException(`La cantidad mínima de personas para este evento es ${tipoEvento.cantidadPersonasBase}.`);
        }

        const precioBase = dinero(tipoEvento.precioBase);

        // 3. Validar y calcular Recursos extra (catálogo)
        const catalogo = await tx.recurso.findMany({ 
            where: { id: { in: data.recursos.map(r => r.recursoId) } } 
        });
        
        const recursosSnapshot = data.recursos.map(item => {
            const recurso = catalogo.find(r => r.id === item.recursoId);
            if (!recurso || !recurso.activo) throw new ValidationException(`El recurso ID ${item.recursoId} no existe o está inactivo.`);
            
            const precio = dinero(recurso.precioUnitario);
            const subtotalRecurso = precio.mul(item.cantidad);
            
            return { 
                recursoId: item.recursoId, 
                nombreRecurso: recurso.nombre,
                tipoRecurso: recurso.tipo,
                cantidad: item.cantidad,
                precioUnitario: precio, 
                subtotal: subtotalRecurso 
            };
        });
        
        const subtotalRecursos = recursosSnapshot.reduce((s, item) => s.plus(item.subtotal), dinero(0));
        
        // 4. Matemática total
        const subtotal = precioBase.plus(subtotalRecursos);
        const descuento = dinero(data.descuento || 0);
        
        if (subtotal.gt('999999999999.99')) throw new ValidationException('El monto supera el límite permitido.');
        if (descuento.gt(subtotal)) throw new ValidationException('El descuento no puede superar el subtotal.');
        
        const totalEstimado = subtotal.minus(descuento);
        const porcentajeAnticipo = dinero(30); 
        const montoAnticipo = totalEstimado.mul(porcentajeAnticipo.div(100));

        return { 
            clienteId: data.clienteId, 
            tipoEventoId: data.tipoEventoId, 
            inicio: new Date(data.inicio),
            fin: new Date(data.fin),
            lugar: data.lugar,
            asistentes: data.asistentes,
            nombreTipoEvento: tipoEvento.nombre,
            precioBaseTipoEvento: precioBase,
            subtotal: subtotal, 
            total: totalEstimado,
            porcentajeAnticipo: porcentajeAnticipo,
            montoAnticipo: montoAnticipo,
            descuento: descuento,
            observaciones: data.observaciones ?? null, 
            estado: actual?.estado || 'BORRADOR',
            recursos: { create: recursosSnapshot } 
        };
    }

    async create(data) {
        return prisma.$transaction(async tx => {
            return tx.presupuesto.create({ data: await this.calcular(tx, data), include });
        });
    }

    async update(id, data) {
        return prisma.$transaction(async tx => {
            const actual = await this.lock(tx, id);
            const cambios = await this.calcular(tx, data, actual);
            
            // Wipe and Replace para los recursos
            await tx.presupuestoRecurso.deleteMany({ where: { presupuestoId: id } });
            
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