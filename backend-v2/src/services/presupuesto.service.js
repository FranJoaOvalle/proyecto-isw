const prisma = require("../config/prisma");
const { Prisma } = require("../../generated/prisma/client");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ValidationException = require("../exceptions/ValidationException");
const ForbiddenException = require("../exceptions/ForbiddenException");
const SolicitudService = require("./solicitud.service");
const FormalizacionService = require("./formalizacion.service");
const UbicacionService = require("./ubicacion.service");
const DisponibilidadService = require("./disponibilidad.service");

const include = {
    cliente: {
        select: {
            id: true,
            persona: { select: { nombres: true, apellidos: true } },
            empresa: { select: { razonSocial: true } }
        }
    },
    tipoEvento: true,
    solicitud: true,
    evento: { select: { id: true } },
    recursos: { include: { recurso: true } }
};
const dinero = (value) => new Prisma.Decimal(value).toDecimalPlaces(2);
const LIMITE_MONTO = new Prisma.Decimal("9999999999.99");
const selectCliente = {
    id: true, solicitudId: true, nombreTipoEvento: true, estado: true, espacioId: true,
    inicio: true, fin: true, lugar: true, direccion: true, comuna: true,
    referenciaDireccion: true, asistentes: true, venceAt: true, version: true,
    enviadoAt: true, aceptadoAt: true, versionAceptada: true,
    precioBaseTipoEvento: true, precioBaseCatalogo: true, precioBaseAcordado: true,
    costoArriendoEspacio: true, unidadArriendoEspacio: true, subtotalArriendoEspacio: true, arriendoIncluido: true,
    subtotal: true, descuento: true,
    recargoCliente: true, total: true,
    recursos: { select: {
        recursoId: true, nombreRecurso: true, tipoRecurso: true,
        cantidad: true, precioUnitario: true, subtotal: true
    } },
    solicitud: { select: { estado: true, evento: { select: { id: true, estado: true } } } },
    evento: { select: {
        id: true, estado: true, inicio: true, fin: true, lugar: true,
        direccion: true, comuna: true, referenciaDireccion: true, asistentes: true
    } }
};

class PresupuestoService {

    alcance(usuario) {
        if (!usuario || !["ADMIN", "CLIENTE"].includes(usuario.rol)) throw new ForbiddenException();
        return usuario.rol === "ADMIN" ? {} : {
            cliente: { usuarioId: usuario.id },
            OR: [{ enviadoAt: { not: null } }, { estado: { in: ["ACEPTADO", "PENDIENTE_PAGO"] } }]
        };
    }

    async getAll(usuario) {
        return prisma.presupuesto.findMany({
            where: this.alcance(usuario),
            ...(usuario.rol === "CLIENTE" ? { select: selectCliente } : { include }),
            orderBy: { id: "desc" }
        });
    }

    async consultar(id, usuario, tx = prisma) {
        const presupuesto = await tx.presupuesto.findFirst({
            where: { id: Number(id), ...this.alcance(usuario) },
            ...(usuario.rol === "CLIENTE" ? { select: selectCliente } : { include })
        });
        if (!presupuesto) throw new NotFoundException("Presupuesto no encontrado.");
        return presupuesto;
    }

    async getById(id, tx = prisma) {
        const presupuesto = await tx.presupuesto.findUnique({
            where: { id: Number(id) },
            include
        });
        if (!presupuesto) throw new NotFoundException("Presupuesto no encontrado.");
        return presupuesto;
    }

    async bloquear(tx, id, estados = ["BORRADOR"]) {
        const origen = await tx.presupuesto.findUnique({
            where: { id: Number(id) }, select: { solicitudId: true }
        });
        if (!origen) throw new NotFoundException("Presupuesto no encontrado.");
        // Todas las operaciones comerciales respetan Solicitud -> Presupuesto.
        if (origen.solicitudId != null) {
            await tx.$queryRaw`SELECT "id" FROM "SolicitudEvento" WHERE "id" = ${origen.solicitudId} FOR UPDATE`;
        }
        await tx.$queryRaw`SELECT "id" FROM "Presupuesto" WHERE "id" = ${Number(id)} FOR UPDATE`;
        const presupuesto = await this.getById(id, tx);
        if (estados.length && !estados.includes(presupuesto.estado)) {
            throw new ConflictException(
                "Solo se puede modificar un presupuesto que todavía está en borrador."
            );
        }
        return presupuesto;
    }

    async calcular(tx, datos, solicitud, actual = null) {
        const cliente = await tx.cliente.findUnique({
            where: { id: solicitud.clienteId },
            include: { usuario: true }
        });
        if (!cliente) {
            throw new NotFoundException("El cliente asociado a la solicitud no existe.");
        }
        if (!cliente.usuario?.activo) {
            throw new ValidationException("El cliente asociado está inactivo y no puede recibir propuestas.");
        }

        const inicio = new Date(datos.inicio);
        const fin = new Date(datos.fin);
        if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime()) || fin <= inicio) {
            throw new ValidationException("El término debe ser posterior al inicio del evento.");
        }
        if (inicio <= new Date()) {
            throw new ValidationException("La fecha de inicio debe ser futura.");
        }

        await tx.$queryRaw`SELECT "id" FROM "TipoEvento" WHERE "id" = ${solicitud.tipoEventoId} FOR SHARE`;
        const tipoEvento = await tx.tipoEvento.findUnique({
            where: { id: solicitud.tipoEventoId }
        });
        if (!tipoEvento || (!actual && !tipoEvento.activo)) {
            throw new ConflictException("El tipo de evento de la solicitud no está vigente.");
        }
        const cantidadMinimaSnapshot = actual
            ? actual.cantidadPersonasBaseTipoEvento ?? actual.asistentes
            : tipoEvento.cantidadPersonasBase;
        if (cantidadMinimaSnapshot != null && datos.asistentes < cantidadMinimaSnapshot) {
            throw new ValidationException(
                `La cantidad mínima de asistentes para esta cotización es ${cantidadMinimaSnapshot}.`
            );
        }
        const espacioId = datos.espacioId ?? actual?.espacioId;
        if (!espacioId) throw new ConflictException("Selecciona un espacio creado en Recursos → Espacios.");
        await DisponibilidadService.bloquearUbicaciones(tx);
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(${espacioId})::text`;
        const ubicacion = await UbicacionService.preparar({}, { espacioId, asistentes: datos.asistentes }, tx);
        await DisponibilidadService.verificarDisponibilidad({ ...ubicacion, inicio, fin }, null, tx);

        let modalidadPrecioTipoEvento;
        let tarifaHoraTipoEvento = null;
        let precioBase;
        if (actual) {
            modalidadPrecioTipoEvento = actual.modalidadPrecioTipoEvento;
            tarifaHoraTipoEvento = actual.tarifaHoraTipoEvento;
            const cambioDuracion = inicio.getTime() !== new Date(actual.inicio).getTime() ||
                fin.getTime() !== new Date(actual.fin).getTime();
            if (modalidadPrecioTipoEvento === "POR_HORA") {
                if (tarifaHoraTipoEvento == null) {
                    if (cambioDuracion) {
                        throw new ConflictException(
                            "Esta cotización no conserva la tarifa horaria original. No se puede cambiar su duración con seguridad; crea una nueva propuesta."
                        );
                    }
                    precioBase = dinero(actual.precioBaseCatalogo ?? actual.precioBaseTipoEvento);
                } else {
                    const horas = new Prisma.Decimal(fin.getTime() - inicio.getTime()).div(3600000);
                    precioBase = dinero(new Prisma.Decimal(tarifaHoraTipoEvento).mul(horas));
                }
            } else if (modalidadPrecioTipoEvento === "FIJO" || !cambioDuracion) {
                precioBase = dinero(actual.precioBaseCatalogo ?? actual.precioBaseTipoEvento);
            } else {
                throw new ConflictException(
                    "Esta cotización no conserva la modalidad de precio original. No se puede cambiar su duración con seguridad."
                );
            }
        } else {
            modalidadPrecioTipoEvento = tipoEvento.modalidadPrecio;
            if (modalidadPrecioTipoEvento === "FIJO") {
                if (tipoEvento.precioBase == null) {
                    throw new ConflictException("El tipo de evento no tiene un precio base configurado.");
                }
                precioBase = dinero(tipoEvento.precioBase);
            } else if (modalidadPrecioTipoEvento === "POR_HORA") {
                if (tipoEvento.tarifaHora == null) {
                    throw new ConflictException("El tipo de evento no tiene una tarifa por hora configurada.");
                }
                tarifaHoraTipoEvento = dinero(tipoEvento.tarifaHora);
                const horas = new Prisma.Decimal(fin.getTime() - inicio.getTime()).div(3600000);
                precioBase = dinero(tarifaHoraTipoEvento.mul(horas));
            } else {
                throw new ConflictException("El tipo de evento tiene una modalidad de precio no válida.");
            }
        }
        const precioBaseCatalogo = precioBase;
        const precioBaseAcordado = Object.hasOwn(datos, "precioBaseAcordado")
            ? datos.precioBaseAcordado
            : actual?.precioBaseAcordado ?? null;
        if (precioBaseAcordado != null) precioBase = dinero(precioBaseAcordado);
        if (precioBase.lt(0) || precioBase.gt(LIMITE_MONTO)) {
            throw new ValidationException("El precio base calculado está fuera del límite permitido.");
        }

        const recursosSolicitados = datos.recursos ?? [];
        const idsRecursos = recursosSolicitados.map(({ recursoId }) => recursoId);
        if (new Set(idsRecursos).size !== idsRecursos.length) {
            throw new ValidationException("No se permiten recursos duplicados en el presupuesto.");
        }
        const existentes = new Map((actual?.recursos ?? []).map(({ recursoId, ...item }) => [recursoId, item]));
        const idsNuevos = idsRecursos.filter((recursoId) => !existentes.has(recursoId));
        const catalogo = await tx.recurso.findMany({ where: { id: { in: idsNuevos } } });
        const recursosSnapshot = recursosSolicitados.map((item) => {
            const existente = existentes.get(item.recursoId);
            const recurso = existente ? null : catalogo.find(({ id }) => id === item.recursoId);
            if (!existente && !recurso?.activo) {
                throw new ValidationException(`El recurso ${item.recursoId} no existe o está inactivo.`);
            }
            const precioUnitario = dinero(existente?.precioUnitario ?? recurso.precioUnitario);
            return {
                recursoId: item.recursoId,
                nombreRecurso: existente?.nombreRecurso ?? recurso.nombre,
                tipoRecurso: existente?.tipoRecurso ?? recurso.tipo,
                cantidad: item.cantidad,
                precioUnitario,
                subtotal: dinero(precioUnitario.mul(item.cantidad))
            };
        });

        const subtotalRecursos = recursosSnapshot.reduce(
            (acumulado, item) => acumulado.plus(item.subtotal),
            dinero(0)
        );
        const subtotal = dinero(precioBase.plus(subtotalRecursos));
        const descuento = dinero(datos.descuento ?? actual?.descuento ?? 0);
        if (descuento.gt(subtotal)) {
            throw new ValidationException("El descuento no puede superar el subtotal.");
        }
        const recargoCliente = dinero(actual?.recargoCliente ?? 0);
        const total = dinero(subtotal.minus(descuento).plus(recargoCliente));
        if (subtotal.gt(LIMITE_MONTO) || total.gt(LIMITE_MONTO)) {
            throw new ValidationException("El monto supera el máximo permitido.");
        }
        const porcentajeAnticipo = dinero(30);

        return {
            clienteId: solicitud.clienteId,
            tipoEventoId: solicitud.tipoEventoId,
            inicio,
            fin,
            ...ubicacion,
            asistentes: datos.asistentes,
            nombreTipoEvento: actual?.nombreTipoEvento ?? tipoEvento.nombre,
            precioBaseTipoEvento: precioBase,
            precioBaseCatalogo,
            precioBaseAcordado,
            modalidadPrecioTipoEvento,
            tarifaHoraTipoEvento,
            cantidadPersonasBaseTipoEvento: cantidadMinimaSnapshot,
            subtotal,
            descuento,
            recargoCliente,
            total,
            porcentajeAnticipo,
            montoAnticipo: dinero(total.mul(porcentajeAnticipo).div(100)),
            estado: actual?.estado ?? "BORRADOR",
            recursos: { create: recursosSnapshot }
        };
    }

    async create(datos, actorId) {
        if (!Number.isInteger(actorId)) {
            throw new ValidationException("Se requiere el identificador del administrador autenticado.");
        }
        return prisma.$transaction(async (tx) => {
            // Valida ADMIN activo, solicitud EN_REVISION y bloquea la fila hasta commit.
            const solicitud = await SolicitudService.validarEmision({
                tx,
                solicitudId: datos.solicitudId,
                actorId
            });
            const valores = await this.calcular(tx, datos, solicitud);
            return tx.presupuesto.create({
                data: { ...valores, solicitudId: solicitud.id },
                include
            });
        });
    }

    async update(id, datos) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id);
            if (datos.version !== actual.version) {
                throw new ConflictException("La cotización cambió. Vuelve a abrirla antes de guardar.");
            }
            if (actual.enviadoAt || (actual.solicitud && actual.solicitud.estado !== "EN_REVISION")) {
                throw new ConflictException("La propuesta ya fue enviada o su solicitud está cerrada. Crea una nueva cotización para cambiar sus condiciones.");
            }
            const solicitud = actual.solicitud ?? {
                clienteId: actual.clienteId,
                tipoEventoId: actual.tipoEventoId
            };
            const cambios = {
                espacioId: datos.espacioId ?? actual.espacioId,
                inicio: datos.inicio ?? actual.inicio,
                fin: datos.fin ?? actual.fin,
                lugar: datos.lugar ?? actual.lugar,
                asistentes: datos.asistentes ?? actual.asistentes,
                descuento: Object.hasOwn(datos, "descuento") ? datos.descuento : actual.descuento,
                ...(Object.hasOwn(datos, "precioBaseAcordado") ? { precioBaseAcordado: datos.precioBaseAcordado } : {}),
                recursos: Object.hasOwn(datos, "recursos")
                    ? datos.recursos
                    : actual.recursos.map(({ recursoId, cantidad }) => ({ recursoId, cantidad }))
            };
            const valores = await this.calcular(
                tx,
                cambios,
                solicitud,
                actual
            );
            await tx.presupuestoRecurso.deleteMany({
                where: { presupuestoId: Number(id) }
            });
            return tx.presupuesto.update({
                where: { id: Number(id) },
                data: { ...valores, version: { increment: 1 } },
                include
            });
        });
    }

    async cancelar(id, actorId) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id, ["BORRADOR", "ENVIADO"]);
            const compromiso = await tx.pago.findFirst({ where: {
                presupuestoId: actual.id, estado: { in: ["PENDIENTE", "PAGADO"] }
            } });
            const evento = await tx.evento.findUnique({ where: { presupuestoId: actual.id } });
            if (compromiso || evento) throw new ConflictException("Resuelve los pagos o el evento antes de cancelar esta propuesta.");
            const cancelado = await tx.presupuesto.update({
                where: { id: actual.id },
                data: { estado: "CANCELADO" },
                include
            });
            if (actual.solicitudId) {
                await tx.solicitudEventoCambio.create({ data: {
                    solicitudId: actual.solicitudId,
                    ...SolicitudService.datosCambio(actorId, "CANCELACION_PROPUESTA",
                        { presupuestoId: actual.id, estado: actual.estado },
                        { presupuestoId: actual.id, estado: "CANCELADO" })
                } });
            }
            return cancelado;
        });
    }

    async prepararEnvio(tx, actual, datos, actorId) {
        if (!actual.solicitudId) throw new ConflictException("Los presupuestos históricos sin solicitud no pueden enviarse mediante este flujo.");
        await SolicitudService.validarEmision({ tx, solicitudId: actual.solicitudId, actorId });
        if (actual.version !== datos.version || actual.enviadoAt) {
            throw new ConflictException("La cotización cambió. Actualiza la página antes de enviarla.");
        }
        if (datos.confirmarFactibilidad !== true || datos.venceAt <= new Date() || datos.venceAt > actual.inicio) {
            throw new ConflictException("Confirma la factibilidad e indica una vigencia futura que no supere el inicio del evento.");
        }
        if (actual.espacioId && actual.espacioId !== datos.espacioId) {
            throw new ConflictException("El espacio debe coincidir con el seleccionado en el presupuesto. Edita el borrador para cambiarlo.");
        }
        await DisponibilidadService.bloquearUbicaciones(tx);
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(${datos.espacioId})::text`;
        const datosEspacio = await UbicacionService.preparar({}, {
            espacioId: datos.espacioId, asistentes: actual.asistentes,
            referenciaDireccion: datos.referenciaDireccion
        }, tx);
        const ubicacion = await FormalizacionService.validarPropuesta(tx, { ...actual, ...datosEspacio });
        const espacio = ubicacion.espacioId == null ? null : await tx.espacio.findUnique({ where: { id: ubicacion.espacioId } });
        let subtotalArriendoEspacio = dinero(0);
        if (espacio && !datos.arriendoIncluido) {
            if (espacio.costoArriendo == null || !espacio.unidadArriendo) {
                throw new ConflictException("Completa la tarifa del recinto o confirma que su arriendo está incluido en el precio base acordado.");
            }
            const horas = new Prisma.Decimal(actual.fin.getTime() - actual.inicio.getTime()).div(3600000);
            const unidades = espacio.unidadArriendo === "HORA" ? horas :
                espacio.unidadArriendo === "DIA" ? horas.div(24).ceil() : new Prisma.Decimal(1);
            subtotalArriendoEspacio = dinero(new Prisma.Decimal(espacio.costoArriendo).mul(unidades));
        }
        const subtotal = dinero(new Prisma.Decimal(actual.precioBaseTipoEvento).plus(
            actual.recursos.reduce((suma, item) => suma.plus(item.subtotal), dinero(0))
        ).plus(subtotalArriendoEspacio));
        const total = dinero(subtotal.minus(actual.descuento).plus(actual.recargoCliente));
        if (subtotal.gt(LIMITE_MONTO) || total.gt(LIMITE_MONTO)) throw new ValidationException("El importe final supera el límite permitido.");
        const importes = {
            costoArriendoEspacio: espacio?.costoArriendo ?? null,
            unidadArriendoEspacio: espacio?.unidadArriendo ?? null,
            arriendoIncluido: datos.arriendoIncluido,
            subtotalArriendoEspacio, subtotal, total,
            montoAnticipo: dinero(total.mul(actual.porcentajeAnticipo).div(100))
        };
        return { ubicacion, importes };
    }

    async previsualizarEnvio(id, datos, actorId) {
        return prisma.$transaction(async tx => {
            const actual = await this.bloquear(tx, id);
            const { ubicacion, importes } = await this.prepararEnvio(tx, actual, datos, actorId);
            return { ...actual, ...ubicacion, ...importes, venceAt: datos.venceAt };
        }, { timeout: 15000 });
    }

    async enviar(id, datos, actorId) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id);
            const { ubicacion, importes } = await this.prepararEnvio(tx, actual, datos, actorId);
            if (datos.totalConfirmado == null || !dinero(datos.totalConfirmado).equals(importes.total)) {
                throw new ConflictException("El importe final cambió o no fue revisado. Revisa el resumen antes de enviar.");
            }
            const enviado = await tx.presupuesto.update({
                where: { id: actual.id },
                data: {
                    ...ubicacion, ...importes, estado: "ENVIADO", venceAt: datos.venceAt,
                    enviadoAt: new Date(), enviadoPorId: actorId,
                    version: { increment: 1 }
                },
                include
            });
            await tx.solicitudEventoCambio.create({ data: {
                solicitudId: actual.solicitudId,
                ...SolicitudService.datosCambio(actorId, "ENVIO_PROPUESTA", null,
                    { presupuestoId: actual.id, version: enviado.version, venceAt: enviado.venceAt })
            } });
            return enviado;
        }, { timeout: 15000 });
    }

    async aceptar(id, datos, usuario) {
        if (usuario?.rol !== "CLIENTE") throw new ForbiddenException();
        if (datos.aceptar !== true) throw new ValidationException("Debes aceptar expresamente la propuesta.");
        // También se comprueba el propietario antes de bloquear o clasificar un reintento.
        await this.consultar(id, usuario);
        for (let intento = 0; intento < 3; intento++) {
            try {
                return await prisma.$transaction(async (tx) => {
                    const actual = await this.bloquear(tx, id, []);
                    if (!actual.solicitudId) throw new ConflictException("Esta propuesta histórica no dispone de una solicitud para formalizar.");
                    if (actual.version !== datos.version) throw new ConflictException("La versión cambió. Vuelve a consultar la propuesta antes de aceptarla.");
                    if (actual.estado !== "ACEPTADO") {
                        if (actual.estado !== "ENVIADO" || !actual.enviadoAt || !actual.enviadoPorId) {
                            throw new ConflictException("Solo puedes aceptar una propuesta enviada y prevalidada por ADMIN.");
                        }
                        if (!actual.venceAt || actual.venceAt <= new Date()) {
                            throw new ConflictException("La propuesta está vencida. Solicita una nueva cotización.");
                        }
                        await tx.presupuesto.update({
                            where: { id: actual.id },
                            data: {
                                estado: "ACEPTADO", aceptadoAt: new Date(),
                                aceptadoPorId: usuario.id, versionAceptada: datos.version
                            }
                        });
                    }
                    const evento = await FormalizacionService.formalizarContratacion({
                        tx, solicitudId: actual.solicitudId, presupuestoId: actual.id,
                        actorId: usuario.id, version: datos.version
                    });
                    return { evento, presupuesto: await this.consultar(id, usuario, tx) };
                }, { maxWait: 5000, timeout: 15000 });
            } catch (error) {
                if (error.code === "P2002") {
                    // La transacción ya se revirtió: nunca consultar dentro del tx abortado.
                    const actual = await this.consultar(id, usuario);
                    const evidencia = await this.getById(id);
                    if (actual.evento && actual.estado === "ACEPTADO" && actual.versionAceptada === datos.version &&
                        evidencia.aceptadoPorId === usuario.id && evidencia.version === datos.version) {
                        return { presupuesto: actual, evento: actual.evento };
                    }
                    throw new ConflictException("La solicitud o el presupuesto ya fueron contratados. Actualiza la página.");
                }
                const conflicto = error.code === "P2034" || ["40001", "40P01"].includes(error.meta?.code);
                if (!conflicto) throw error;
                if (intento === 2) throw new ConflictException("Otra operación está modificando la contratación. Vuelve a intentarlo.");
            }
        }
    }
}

module.exports = new PresupuestoService();
