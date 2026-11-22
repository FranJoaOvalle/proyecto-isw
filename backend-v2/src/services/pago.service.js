const prisma = require("../config/prisma");
const env = require("../config/env");
const { Prisma } = require("../../generated/prisma/client");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");
const ForbiddenException = require("../exceptions/ForbiddenException");
const emailService = require("./email.service");

const DIAS_PLAZO_ANTICIPO = 14;
const PORCENTAJE_ANTICIPO_NUEVO = 50;
const LIMITE_MONTO = new Prisma.Decimal("9999999999.99");
const incluirPago = {
    presupuesto: {
        select: {
            id: true, solicitudId: true, nombreTipoEvento: true, estado: true,
            inicio: true, fin: true, aceptadoAt: true, total: true, descuento: true,
            recargoCliente: true, porcentajeAnticipo: true, montoAnticipo: true,
            pagos: { select: { id: true, tipo: true, estado: true, monto: true } },
            cliente: { select: {
                id: true,
                usuario: { select: { email: true } },
                persona: { select: { nombres: true, apellidos: true } },
                empresa: { select: { razonSocial: true } }
            } },
            evento: { select: { id: true, inicio: true, fin: true, estado: true } }
        }
    },
    confirmadoPor: {
        select: {
            id: true,
            email: true,
            rol: true
        }
    },
    encuesta: true
};
const fechaDia = (valor) => valor ? new Date(valor) : null;
const fechaMasDias = (valor, dias) => {
    const fecha = new Date(valor);
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
};
const pagosNetos = (pagos) => pagos.reduce((suma, pago) => {
    if (pago.estado === "PAGADO") return suma.plus(pago.monto);
    if (pago.estado === "REEMBOLSADO") return suma.minus(pago.monto);
    return suma;
}, new Prisma.Decimal(0));
const fechaFinAplicable = (presupuesto) => {
    const finEvento = presupuesto?.evento?.fin;
    const finPresupuesto = presupuesto?.fin;
    const fecha = finEvento ?? finPresupuesto;
    return fecha && Number.isFinite(new Date(fecha).getTime()) ? new Date(fecha) : null;
};
const anticipoCumplido = (presupuesto, pagos = presupuesto?.pagos ?? []) => {
    const exigible = new Prisma.Decimal(presupuesto?.montoAnticipo ?? 0);
    const recibido = pagosNetos(pagos.filter((pago) => pago.tipo === "ANTICIPO"));
    return exigible.gt(0) && recibido.gte(exigible);
};

class PagoService {
    async validarAdministrador(tx, usuarioId) {
        if (!Number.isInteger(Number(usuarioId))) {
            throw new ForbiddenException("Solo un administrador activo puede gestionar pagos.");
        }
        const usuario = await tx.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { activo: true, rol: true }
        });
        if (!usuario?.activo || usuario.rol !== "ADMIN") {
            throw new ForbiddenException("Solo un administrador activo puede gestionar pagos.");
        }
    }
    async listar(filtros = {}) {
        const pagos = await prisma.pago.findMany({ include: incluirPago, orderBy: { createdAt: "desc" } });
        const presupuestos = await prisma.presupuesto.findMany({
            where: { estado: { in: ["ACEPTADO", "PENDIENTE_PAGO"] }, aceptadoAt: { not: null } },
            include: { pagos: true, cliente: { select: {
                id: true,
                usuario: { select: { email: true } },
                persona: { select: { nombres: true, apellidos: true } },
                empresa: { select: { razonSocial: true } }
            } }, evento: { select: { id: true, inicio: true, fin: true, estado: true } } },
            orderBy: { aceptadoAt: "desc" }
        });
        const derivados = [];
        for (const presupuesto of presupuestos) {
            const recibidos = pagosNetos(presupuesto.pagos);
            const anticipoEsperado = new Prisma.Decimal(presupuesto.montoAnticipo ?? 0);
            const anticipoPagado = anticipoCumplido(presupuesto);
            const saldoPendiente = presupuesto.pagos.some((p) => p.tipo === "SALDO" && ["PENDIENTE", "PAGADO"].includes(p.estado));
            const fechaAceptacion = fechaDia(presupuesto.aceptadoAt);
            if (!anticipoPagado && !presupuesto.pagos.some((p) => p.tipo === "ANTICIPO" && p.estado === "PENDIENTE")) {
                derivados.push({ id: `obligacion-A-${presupuesto.id}`, esObligacion: true, tipo: "ANTICIPO", monto: anticipoEsperado, estado: "PENDIENTE", fechaPago: null, fechaVencimiento: fechaMasDias(fechaAceptacion, DIAS_PLAZO_ANTICIPO), presupuestoId: presupuesto.id, presupuesto, reglasAlertas: { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO } });
            }
            const saldo = new Prisma.Decimal(presupuesto.total).minus(recibidos).toDecimalPlaces(2);
            if (anticipoPagado && saldo.gt(0) && !saldoPendiente) {
                derivados.push({ id: `obligacion-S-${presupuesto.id}`, esObligacion: true, tipo: "SALDO", monto: saldo, estado: "PENDIENTE", fechaPago: null, fechaVencimiento: null, presupuestoId: presupuesto.id, presupuesto, reglasAlertas: { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO } });
            }
        }
        const reglasAlertas = { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO };
        const prepararRegistro = (pago) => ({
            ...pago,
            fechaVencimiento: pago.tipo === "ANTICIPO" && pago.presupuesto?.aceptadoAt
                ? fechaMasDias(pago.presupuesto.aceptadoAt, DIAS_PLAZO_ANTICIPO)
                : null,
            anticipoPagado: anticipoCumplido(pago.presupuesto),
            fechaFinEvento: fechaFinAplicable(pago.presupuesto),
            reglasAlertas
        });
        const resultado = [...pagos.map(prepararRegistro), ...derivados.map(prepararRegistro)]
            .filter((pago) => !filtros.estado || pago.estado === filtros.estado)
            .filter((pago) => !filtros.tipo || pago.tipo === filtros.tipo)
            .filter((pago) => filtros.presupuestoId == null || pago.presupuestoId === filtros.presupuestoId)
            .sort((a, b) => new Date(b.fechaPago ?? b.fechaVencimiento ?? b.createdAt ?? 0) - new Date(a.fechaPago ?? a.fechaVencimiento ?? a.createdAt ?? 0));
        return resultado;
    }

    async conBloqueoPresupuesto(tx, presupuestoId) {
        const previo = await tx.presupuesto.findUnique({ where: { id: Number(presupuestoId) }, select: { solicitudId: true } });
        if (!previo) throw new NotFoundException("Presupuesto no encontrado.");
        if (previo.solicitudId) await tx.$queryRaw`SELECT "id" FROM "SolicitudEvento" WHERE "id" = ${previo.solicitudId} FOR UPDATE`;
        await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${Number(presupuestoId)} FOR UPDATE`;
        return tx.presupuesto.findUnique({
            where: { id: Number(presupuestoId) },
            include: { pagos: true, evento: { select: { fin: true } } }
        });
    }

    async registrar({ presupuestoId, tipo, usuarioId }) {
        return prisma.$transaction(async (tx) => {
            await this.validarAdministrador(tx, usuarioId);
            const presupuesto = await this.conBloqueoPresupuesto(tx, presupuestoId);
            if (!["ACEPTADO", "PENDIENTE_PAGO"].includes(presupuesto.estado) || !presupuesto.aceptadoAt) throw new ConflictException("Solo se registran obligaciones de presupuestos aceptados.");
            const mismoTipo = presupuesto.pagos.filter((p) => p.tipo === tipo);
            if (mismoTipo.some((p) => p.estado === "PENDIENTE")) return mismoTipo.find((p) => p.estado === "PENDIENTE");
            if (mismoTipo.some((p) => p.estado === "PAGADO")) throw new ConflictException("Esta cuota ya está pagada.");
            const pagado = pagosNetos(presupuesto.pagos);
            if (tipo === "SALDO" && !anticipoCumplido(presupuesto)) {
                throw new ConflictException("El saldo solo se puede registrar después de cubrir el anticipo requerido.");
            }
            const total = new Prisma.Decimal(presupuesto.total);
            const monto = tipo === "ANTICIPO"
                ? new Prisma.Decimal(presupuesto.montoAnticipo ?? total.mul(PORCENTAJE_ANTICIPO_NUEVO).div(100)).toDecimalPlaces(2)
                : total.minus(pagado).toDecimalPlaces(2);
            if (monto.lte(0) || monto.gt(LIMITE_MONTO)) throw new ValidationException("El monto de la cuota calculada no es válido.");
            return tx.pago.create({ data: { presupuestoId: presupuesto.id, tipo, monto, estado: "PENDIENTE" }, include: incluirPago });
        });
    }

    async confirmar({ id, referencia, usuarioId }) {
        return prisma.$transaction(async (tx) => {
            await this.validarAdministrador(tx, usuarioId);
            const pagoInicial = await tx.pago.findUnique({ where: { id: Number(id) }, select: { presupuestoId: true } });
            if (!pagoInicial) throw new NotFoundException("Pago no encontrado.");
            const presupuesto = await this.conBloqueoPresupuesto(tx, pagoInicial.presupuestoId);
            await tx.$queryRaw`SELECT "id" FROM "Pago" WHERE "id" = ${Number(id)} FOR UPDATE`;
            const pago = await tx.pago.findUnique({ where: { id: Number(id) } });
            if (pago.estado === "PAGADO") return tx.pago.findUnique({ where: { id: pago.id }, include: incluirPago });
            if (pago.estado !== "PENDIENTE") throw new ConflictException("Solo se pueden confirmar pagos pendientes.");
            const otrosPagos = presupuesto.pagos.filter((item) => item.id !== pago.id);
            if (pago.tipo === "ANTICIPO") {
                const anticipoRestante = new Prisma.Decimal(presupuesto.montoAnticipo ?? 0)
                    .minus(pagosNetos(otrosPagos.filter((item) => item.tipo === "ANTICIPO")))
                    .toDecimalPlaces(2);
                if (anticipoRestante.lte(0) || !new Prisma.Decimal(pago.monto).equals(anticipoRestante)) {
                    throw new ValidationException("El monto del anticipo debe coincidir con el importe exacto que falta para cubrir el porcentaje pactado.");
                }
            }
            if (pago.tipo === "SALDO") {
                if (!anticipoCumplido(presupuesto)) {
                    throw new ValidationException("No se puede confirmar el saldo: primero debe estar cubierto el anticipo requerido.");
                }
                const finEvento = fechaFinAplicable(presupuesto);
                if (!finEvento) {
                    throw new ValidationException("No se puede confirmar el saldo porque no hay una fecha de término válida para el evento ni para el presupuesto.");
                }
                if (new Date() < finEvento) {
                    throw new ValidationException("El saldo solo se puede confirmar cuando haya finalizado el evento.");
                }
                const otrosNetos = pagosNetos(otrosPagos);
                const saldoEsperado = new Prisma.Decimal(presupuesto.total).minus(otrosNetos).toDecimalPlaces(2);
                if (saldoEsperado.lte(0) || !new Prisma.Decimal(pago.monto).equals(saldoEsperado)) {
                    throw new ValidationException("El monto pendiente ya no coincide con el saldo exacto del presupuesto. Actualiza las cuotas antes de confirmar.");
                }
            }
            const otrosNetos = pagosNetos(otrosPagos);
            if (otrosNetos.plus(pago.monto).gt(presupuesto.total)) throw new ConflictException("La confirmación superaría el total del presupuesto.");
            return tx.pago.update({ where: { id: pago.id }, data: { estado: "PAGADO", fechaPago: new Date(), referencia: referencia ?? pago.referencia, confirmadoPorId: Number(usuarioId), confirmadoAt: new Date() }, include: incluirPago });
        });
    }

    async enviarEncuesta(id, usuarioId) {
        await this.validarAdministrador(prisma, usuarioId);
        const pago = await prisma.pago.findUnique({ where: { id: Number(id) }, include: { presupuesto: { include: { cliente: { include: { usuario: true } } } }, encuesta: true } });
        if (!pago) throw new NotFoundException("Pago no encontrado.");
        if (pago.tipo !== "SALDO" || pago.estado !== "PAGADO") throw new ConflictException("La encuesta solo se ofrece después de confirmar el pago del saldo.");
        const pagosPresupuesto = await prisma.pago.findMany({ where: { presupuestoId: pago.presupuestoId }, select: { estado: true, monto: true } });
        if (pagosNetos(pagosPresupuesto).lt(new Prisma.Decimal(pago.presupuesto.total))) {
            throw new ConflictException("La encuesta estará disponible cuando el total neto del presupuesto esté pagado.");
        }
        const evento = await prisma.evento.findFirst({ where: { presupuestoId: pago.presupuestoId }, select: { estado: true } });
        if (evento?.estado !== "COMPLETADO") throw new ConflictException("La encuesta estará disponible cuando el evento esté completado.");
        const previo = pago.encuesta;
        if (previo?.estado === "ENVIADO") return previo;
        if (previo?.estado === "SIMULADO") return previo;
        if (previo?.estado === "ENVIANDO" && Date.now() - new Date(previo.ultimoIntentoAt).getTime() < env.PAGO_ENCUESTA_REINTENTO_MINUTOS * 60000) throw new ConflictException("Ya hay un intento de envío de encuesta en curso.");
        const encuestaUrl = env.SURVEY_URL;
        const reserva = await prisma.$transaction(async (tx) => {
            if (pago.presupuesto.solicitudId) await tx.$queryRaw`SELECT "id" FROM "SolicitudEvento" WHERE "id" = ${pago.presupuesto.solicitudId} FOR UPDATE`;
            await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${pago.presupuestoId} FOR UPDATE`;
            await tx.$queryRaw`SELECT "id" FROM "Pago" WHERE "id" = ${pago.id} FOR UPDATE`;
            const pagosActuales = await tx.pago.findMany({ where: { presupuestoId: pago.presupuestoId }, select: { estado: true, monto: true } });
            if (pagosNetos(pagosActuales).lt(new Prisma.Decimal(pago.presupuesto.total))) {
                throw new ConflictException("La encuesta estará disponible cuando el total neto del presupuesto esté pagado.");
            }
            const eventoActual = await tx.evento.findFirst({ where: { presupuestoId: pago.presupuestoId }, select: { estado: true } });
            if (eventoActual?.estado !== "COMPLETADO") {
                throw new ConflictException("La encuesta estará disponible cuando el evento esté completado.");
            }
            const actual = await tx.encuestaPago.findUnique({ where: { pagoId: pago.id } });
            if (actual?.estado === "ENVIADO") return actual;
            if (actual?.estado === "ENVIANDO" && Date.now() - new Date(actual.ultimoIntentoAt).getTime() < env.PAGO_ENCUESTA_REINTENTO_MINUTOS * 60000) {
                throw new ConflictException("Ya hay un intento de envío de encuesta en curso.");
            }
            return actual
                ? tx.encuestaPago.update({ where: { pagoId: pago.id }, data: { estado: "ENVIANDO", encuestaUrl, motivo: null, intentos: { increment: 1 }, ultimoIntentoAt: new Date() } })
                : tx.encuestaPago.create({ data: { pagoId: pago.id, estado: "ENVIANDO", encuestaUrl, intentos: 1, ultimoIntentoAt: new Date() } });
        });
        if (reserva.estado !== "ENVIANDO") return reserva;
        const email = pago.presupuesto.cliente?.usuario?.email;
        const resultado = email
            ? await emailService.sendEncuestaSatisfaccion(email, encuestaUrl)
                .catch((error) => ({ estado: "FALLIDO", motivo: error.message.slice(0, 300) }))
            : { estado: "NO_ENVIADO_CORREO", motivo: "El cliente no tiene correo registrado." };
        return prisma.encuestaPago.update({ where: { pagoId: pago.id }, data: { estado: resultado.estado, motivo: resultado.motivo, enviadoAt: resultado.estado === "ENVIADO" ? new Date() : null } });
    }
}

module.exports = new PagoService();
