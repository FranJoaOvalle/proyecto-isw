const prisma = require("../config/prisma");
const ForbiddenException = require("../exceptions/ForbiddenException");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const comercial = require("./integracionPresupuestos.service");

const relaciones = {
    tipoEvento: {
        select: { id: true, nombre: true, imagen_url: true, activo: true }
    },
    cliente: {
        select: {
            id: true,
            persona: { select: { nombres: true, apellidos: true } },
            empresa: { select: { razonSocial: true } }
        }
    },
    evento: {
        select: {
            id: true,
            estado: true,
            inicio: true,
            fin: true,
            lugar: true,
            tipoEvento: { select: { nombre: true } }
        }
    },
    presupuestos: { select: { id: true, estado: true, venceAt: true } }
};
const serializar = (v) => JSON.parse(JSON.stringify(v));

class SolicitudService {
    alcance(usuario) {
        if (!usuario || !["ADMIN", "CLIENTE"].includes(usuario.rol))
            throw new ForbiddenException(
                "No tienes acceso a solicitudes comerciales."
            );
        return usuario.rol === "ADMIN"
            ? {}
            : { cliente: { usuarioId: usuario.id } };
    }
    async detalle(id, usuario, tx = prisma) {
        const solicitud = await tx.solicitudEvento.findFirst({
            where: { id: Number(id), ...this.alcance(usuario) },
            include: relaciones
        });
        if (!solicitud) throw new NotFoundException("Solicitud no encontrada.");
        return solicitud;
    }
    async validarEmision({ tx, solicitudId, actorId }) {
        const actor = await tx.usuario.findUnique({ where: { id: actorId } });
        if (!actor?.activo || actor.rol !== "ADMIN")
            throw new ForbiddenException(
                "Solo ADMIN puede prevalidar o emitir propuestas."
            );
        const solicitud = await this.bloquear(tx, solicitudId, actor);
        if (solicitud.estado !== "EN_REVISION" || solicitud.evento)
            throw new ConflictException(
                "Solo se pueden emitir propuestas de solicitudes en revisión."
            );
        return solicitud;
    }
    async bloquear(tx, id, usuario) {
        await this.detalle(id, usuario, tx);
        await tx.$queryRaw`SELECT "id" FROM "SolicitudEvento" WHERE "id" = ${Number(id)} FOR UPDATE`;
        return this.detalle(id, usuario, tx);
    }
    async auditar(
        tx,
        solicitudId,
        actorId,
        accion,
        anterior,
        nuevo,
        motivo = null
    ) {
        await tx.solicitudEventoCambio.create({
            data: {
                solicitudId,
                actorId,
                accion,
                motivo,
                ...(anterior ? { anterior: serializar(anterior) } : {}),
                ...(nuevo ? { nuevo: serializar(nuevo) } : {})
            }
        });
    }
    async validarDatos(tx, datos, anterior) {
        const inicio = datos.inicio ?? anterior?.inicio;
        const fin = datos.fin ?? anterior?.fin;
        if (!inicio || !fin || fin <= inicio || inicio <= new Date())
            throw new ConflictException(
                "El inicio debe ser futuro y el término posterior al inicio."
            );
        const tipoEventoId = datos.tipoEventoId ?? anterior.tipoEventoId;
        await tx.$queryRaw`SELECT "id" FROM "TipoEvento" WHERE "id" = ${tipoEventoId} FOR SHARE`;
        const tipo = await tx.tipoEvento.findUnique({
            where: { id: tipoEventoId }
        });
        if (!tipo?.activo)
            throw new ConflictException(
                "El tipo de evento no está disponible para nuevas solicitudes o cambios."
            );
    }
    async crear(datos, usuario) {
        this.alcance(usuario);
        if (usuario.rol === "CLIENTE" && datos.clienteId !== undefined)
            throw new ForbiddenException("El cliente se obtiene de tu sesión.");
        return prisma.$transaction(async (tx) => {
            const cliente = await tx.cliente.findFirst({
                where: {
                    ...(usuario.rol === "ADMIN"
                        ? { id: datos.clienteId ?? -1 }
                        : { usuarioId: usuario.id }),
                    usuario: { activo: true }
                }
            });
            if (!cliente)
                throw new NotFoundException("Cliente activo no encontrado.");
            await this.validarDatos(tx, datos);
            const campos = { ...datos };
            delete campos.clienteId;
            const solicitud = await tx.solicitudEvento.create({
                data: { ...campos, clienteId: cliente.id, autorId: usuario.id }
            });
            await this.auditar(
                tx,
                solicitud.id,
                usuario.id,
                "CREACION",
                null,
                campos
            );
            return this.detalle(solicitud.id, usuario, tx);
        });
    }
    async listar(filtros, usuario) {
        const where = {
            ...this.alcance(usuario),
            ...(filtros.estado ? { estado: filtros.estado } : {}),
            ...(filtros.buscar
                ? {
                      OR: [
                          {
                              tipoEvento: {
                                  nombre: {
                                      contains: filtros.buscar,
                                      mode: "insensitive"
                                  }
                              }
                          },
                          {
                              lugar: {
                                  contains: filtros.buscar,
                                  mode: "insensitive"
                              }
                          }
                      ]
                  }
                : {})
        };
        const pagina = filtros.pagina ?? 1,
            limite = filtros.limite ?? 20;
        const [items, total] = await prisma.$transaction([
            prisma.solicitudEvento.findMany({
                where,
                include: relaciones,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                skip: (pagina - 1) * limite,
                take: limite
            }),
            prisma.solicitudEvento.count({ where })
        ]);
        return { items, total, pagina, limite };
    }
    async editar(id, datos, usuario) {
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id, usuario);
            if (
                !["PENDIENTE", "EN_REVISION"].includes(actual.estado) ||
                (usuario.rol === "CLIENTE" && actual.estado !== "PENDIENTE")
            )
                throw new ConflictException(
                    "La solicitud ya no admite estos cambios."
                );
            // No existe todavía detector comercial fiable de emisión/versionado.
            if (actual.presupuestos.length)
                await comercial.verificarEdicionSolicitud({
                    tx,
                    solicitudId: actual.id,
                    actorId: usuario.id,
                    cambios: datos
                });
            if (
                usuario.rol === "CLIENTE" &&
                Object.hasOwn(datos, "tipoEventoId")
            )
                throw new ForbiddenException(
                    "No puedes cambiar el tipo de evento de una solicitud existente."
                );
            await this.validarDatos(tx, datos, actual);
            const anterior = Object.fromEntries(
                Object.keys(datos).map((campo) => [campo, actual[campo]])
            );
            await tx.solicitudEvento.update({
                where: { id: Number(id) },
                data: datos
            });
            await this.auditar(
                tx,
                Number(id),
                usuario.id,
                "EDICION",
                anterior,
                datos
            );
            return this.detalle(id, usuario, tx);
        });
    }
    async revisar(id, usuario) {
        if (usuario?.rol !== "ADMIN") throw new ForbiddenException();
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id, usuario);
            if (actual.estado === "EN_REVISION") return actual;
            if (actual.estado !== "PENDIENTE")
                throw new ConflictException(
                    "Solo puedes revisar una solicitud pendiente."
                );
            await tx.solicitudEvento.update({
                where: { id: Number(id) },
                data: { estado: "EN_REVISION" }
            });
            await this.auditar(
                tx,
                Number(id),
                usuario.id,
                "INICIO_REVISION",
                { estado: actual.estado },
                { estado: "EN_REVISION" }
            );
            return this.detalle(id, usuario, tx);
        });
    }
    async cerrar(id, motivo, usuario, retiro = false) {
        if (
            typeof motivo !== "string" ||
            motivo.trim().length < 3 ||
            motivo.length > 2000
        )
            throw new ConflictException(
                "Debes indicar un motivo válido de cierre."
            );
        if (!retiro && usuario?.rol !== "ADMIN") throw new ForbiddenException();
        if (retiro && usuario?.rol !== "CLIENTE")
            throw new ForbiddenException();
        return prisma.$transaction(async (tx) => {
            const actual = await this.bloquear(tx, id, usuario);
            if (
                actual.evento ||
                !["PENDIENTE", "EN_REVISION"].includes(actual.estado) ||
                (retiro && actual.estado !== "PENDIENTE")
            )
                throw new ConflictException(
                    "La solicitud no permite este cierre."
                );
            if (actual.presupuestos.length) {
                if (retiro)
                    throw new ConflictException(
                        "No puedes retirar una solicitud que tiene propuestas vinculadas."
                    );
                await comercial.verificarCierreSolicitud({
                    tx,
                    solicitudId: actual.id,
                    actorId: usuario.id
                });
            }
            const tipoCierre = retiro ? "RETIRO_CLIENTE" : "RECHAZO_ADMIN";
            await tx.solicitudEvento.update({
                where: { id: Number(id) },
                data: { estado: "RECHAZADA", motivoCierre: motivo, tipoCierre }
            });
            await this.auditar(
                tx,
                Number(id),
                usuario.id,
                tipoCierre,
                { estado: actual.estado },
                { estado: "RECHAZADA" },
                motivo
            );
            return this.detalle(id, usuario, tx);
        });
    }
    async historial(id, usuario) {
        await this.detalle(id, usuario);
        return prisma.solicitudEventoCambio.findMany({
            where: {
                solicitudId: Number(id),
                solicitud: this.alcance(usuario)
            },
            select: {
                id: true,
                accion: true,
                motivo: true,
                anterior: true,
                nuevo: true,
                createdAt: true
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }]
        });
    }
}
module.exports = new SolicitudService();
