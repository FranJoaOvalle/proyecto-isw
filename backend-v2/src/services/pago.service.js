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
const fechaMasDias = (valor, dias) => {
    const fecha = new Date(valor);
    fecha.setDate(fecha.getDate() + dias);
    return Number.isFinite(fecha.getTime()) ? fecha : null;
};
const fechaVencimientoAnticipo = (presupuesto) => {
    if (!presupuesto?.aceptadoAt) return null;
    return fechaMasDias(presupuesto.aceptadoAt, DIAS_PLAZO_ANTICIPO);
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
const evaluarElegibilidad = (pago, presupuesto, ahora = new Date()) => {
    const resultado = {
        estadoEfectivo: pago.estado,
        puedeConfirmar: false,
        puedeRegistrar: false,
        motivoElegibilidad: null,
        motivoCancelacion: null
    };
    if (pago.estado !== "PENDIENTE") return resultado;
    if (!presupuesto || !["ACEPTADO", "PENDIENTE_PAGO"].includes(presupuesto.estado) || !presupuesto.aceptadoAt) {
        resultado.motivoElegibilidad = "El presupuesto ya no admite confirmaciones de pago.";
        return resultado;
    }

    const pagos = presupuesto.pagos ?? [];
    const anticipoPagado = anticipoCumplido(presupuesto, pagos);
    const vencimiento = fechaVencimientoAnticipo(presupuesto);
    const vencido = vencimiento && ahora.getTime() >= vencimiento.getTime();
    const saldoOtrosPagos = pagosNetos(pagos.filter((item) => item.id !== pago.id));
    const total = new Prisma.Decimal(presupuesto.total ?? 0);

    if (pago.tipo === "ANTICIPO") {
        if (anticipoPagado) {
            resultado.motivoElegibilidad = "El anticipo ya está cubierto.";
            return resultado;
        }
        if (!vencimiento) {
            resultado.motivoElegibilidad = "No es posible determinar una fecha válida de vencimiento del anticipo.";
            return resultado;
        }
        if (vencido) {
            resultado.estadoEfectivo = "CANCELADO";
            resultado.motivoCancelacion = "Cancelado por falta de abono (plazo de 14 días vencido)";
            resultado.motivoElegibilidad = resultado.motivoCancelacion;
            return resultado;
        }
        const anticipoRestante = new Prisma.Decimal(presupuesto.montoAnticipo ?? 0)
            .minus(pagosNetos(pagos.filter((item) => item.tipo === "ANTICIPO" && item.id !== pago.id)))
            .toDecimalPlaces(2);
        if (anticipoRestante.lte(0) || !new Prisma.Decimal(pago.monto ?? anticipoRestante).equals(anticipoRestante)) {
            resultado.motivoElegibilidad = "El importe pendiente ya no coincide con el anticipo pactado.";
            return resultado;
        }
        resultado.puedeConfirmar = true;
        resultado.puedeRegistrar = pago.esObligacion === true;
        return resultado;
    }

    if (pago.tipo === "SALDO") {
        if (!anticipoPagado) {
            if (!vencimiento) {
                resultado.motivoElegibilidad = "No es posible determinar si venció el plazo del anticipo.";
                return resultado;
            }
            if (vencido) {
                resultado.estadoEfectivo = "CANCELADO";
                resultado.motivoCancelacion = "Cancelado por falta de abono en anticipo";
                resultado.motivoElegibilidad = resultado.motivoCancelacion;
                return resultado;
            }
            resultado.motivoElegibilidad = "Pendiente de pago de anticipo";
            return resultado;
        }
        const finEvento = fechaFinAplicable(presupuesto);
        if (!finEvento) {
            resultado.motivoElegibilidad = "No se puede determinar la fecha de término del evento ni del presupuesto.";
            return resultado;
        }
        if (ahora.getTime() < finEvento.getTime()) {
            resultado.motivoElegibilidad = "Se habilita al finalizar el evento";
            return resultado;
        }
        const saldoEsperado = total.minus(saldoOtrosPagos).toDecimalPlaces(2);
        if (saldoEsperado.lte(0) || !new Prisma.Decimal(pago.monto ?? saldoEsperado).equals(saldoEsperado)) {
            resultado.motivoElegibilidad = "El importe pendiente ya no coincide con el saldo exacto del presupuesto.";
            return resultado;
        }
        resultado.puedeConfirmar = true;
        resultado.puedeRegistrar = pago.esObligacion === true;
    }
    return resultado;
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
        const ahora = new Date();
        const derivados = [];
        for (const presupuesto of presupuestos) {
            const recibidos = pagosNetos(presupuesto.pagos);
            const anticipoEsperado = new Prisma.Decimal(presupuesto.montoAnticipo ?? 0);
            const anticipoPagado = anticipoCumplido(presupuesto);
            const saldoPendiente = presupuesto.pagos.some((p) => p.tipo === "SALDO" && p.estado === "PENDIENTE");
            const anticipoPendiente = presupuesto.pagos.some((p) => p.tipo === "ANTICIPO" && p.estado === "PENDIENTE");
            if (!anticipoPagado && !anticipoPendiente) {
                derivados.push({ id: `obligacion-A-${presupuesto.id}`, esObligacion: true, tipo: "ANTICIPO", monto: anticipoEsperado.minus(pagosNetos(presupuesto.pagos.filter((p) => p.tipo === "ANTICIPO"))).toDecimalPlaces(2), estado: "PENDIENTE", fechaPago: null, fechaVencimiento: vencimiento, presupuestoId: presupuesto.id, presupuesto, reglasAlertas: { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO } });
            }
            const saldo = new Prisma.Decimal(presupuesto.total).minus(recibidos).toDecimalPlaces(2);
            if (anticipoPagado && saldo.gt(0) && !saldoPendiente) {
                derivados.push({ id: `obligacion-S-${presupuesto.id}`, esObligacion: true, tipo: "SALDO", monto: saldo, estado: "PENDIENTE", fechaPago: null, fechaVencimiento: null, presupuestoId: presupuesto.id, presupuesto, reglasAlertas: { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO } });
            }
        }
        const reglasAlertas = { diasCompromiso: env.PAGO_DIAS_ALERTA_COMPROMISO, diasEvento: env.PAGO_DIAS_ALERTA_EVENTO };
        const prepararRegistro = (pago) => {
            const fechaVencimiento = pago.tipo === "ANTICIPO"
                ? (pago.fechaVencimiento ?? fechaVencimientoAnticipo(pago.presupuesto))
                : fechaVencimientoAnticipo(pago.presupuesto);
            const elegibilidad = evaluarElegibilidad(pago, pago.presupuesto, ahora);
            return {
                ...pago,
                ...elegibilidad,
                fechaVencimiento,
                anticipoPagado: anticipoCumplido(pago.presupuesto),
                fechaFinEvento: fechaFinAplicable(pago.presupuesto),
                reglasAlertas
            };
        };
        const resultado = [...pagos.map(prepararRegistro), ...derivados.map(prepararRegistro)]
            .filter((pago) => !filtros.estado || (pago.estadoEfectivo ?? pago.estado) === filtros.estado)
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
            const cuotaPendiente = mismoTipo.find((p) => p.estado === "PENDIENTE");
            if (cuotaPendiente) {
                const elegibilidad = evaluarElegibilidad(cuotaPendiente, presupuesto, new Date());
                if (elegibilidad.estadoEfectivo === "CANCELADO") {
                    throw new ValidationException(elegibilidad.motivoCancelacion);
                }
                return cuotaPendiente;
            }
            const pagado = pagosNetos(presupuesto.pagos);
            if (tipo === "ANTICIPO") {
                const evaluacion = evaluarElegibilidad({ tipo, estado: "PENDIENTE", monto: null, esObligacion: true }, presupuesto, new Date());
                if (!evaluacion.puedeRegistrar) {
                    throw new ValidationException(evaluacion.motivoElegibilidad ?? "El anticipo ya no se puede registrar.");
                }
            }
            if (tipo === "SALDO" && !anticipoCumplido(presupuesto)) {
                throw new ConflictException("El saldo solo se puede registrar después de cubrir el anticipo requerido.");
            }
            if (tipo === "SALDO") {
                const evaluacion = evaluarElegibilidad({ tipo, estado: "PENDIENTE", monto: null, esObligacion: true }, presupuesto, new Date());
                if (!evaluacion.puedeRegistrar) {
                    throw new ValidationException(evaluacion.motivoElegibilidad ?? "El saldo todavía no se puede registrar.");
                }
            }
            const total = new Prisma.Decimal(presupuesto.total);
            const monto = tipo === "ANTICIPO"
                ? new Prisma.Decimal(presupuesto.montoAnticipo ?? total.mul(PORCENTAJE_ANTICIPO_NUEVO).div(100))
                    .minus(pagosNetos(presupuesto.pagos.filter((p) => p.tipo === "ANTICIPO")))
                    .toDecimalPlaces(2)
                : total.minus(pagado).toDecimalPlaces(2);
            if (monto.lte(0) || monto.gt(LIMITE_MONTO)) throw new ValidationException(tipo === "ANTICIPO" ? "El anticipo ya está cubierto o el importe pendiente no es válido." : "El monto de la cuota calculada no es válido.");
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
            const elegibilidad = evaluarElegibilidad(pago, presupuesto, new Date());
            if (!elegibilidad.puedeConfirmar) {
                throw new ValidationException(elegibilidad.motivoElegibilidad ?? "El pago ya no cumple las condiciones para confirmarse.");
            }
            const otrosPagos = presupuesto.pagos.filter((item) => item.id !== pago.id);
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
