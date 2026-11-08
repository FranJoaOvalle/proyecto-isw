const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ForbiddenException = require("../exceptions/ForbiddenException");

// Nunca incluir Usuario completo: contiene credenciales y tokens de recuperación.
const autor = {
    select: {
        id: true,
        email: true,
        rol: true,
        productor: { select: { nombres: true, apellidos: true } }
    }
};
const eventoInclude = {
    tipoEvento: true,
    productor: { select: { id: true, nombres: true, apellidos: true } },
    cliente: { select: { persona: true, empresa: true } }
};

class SeguimientoService {

    alcance(usuario) {
        if (!usuario || !["ADMIN", "PRODUCTOR"].includes(usuario.rol)) {
            throw new ForbiddenException(
                "No tienes permisos para acceder al seguimiento."
            );
        }
        return usuario.rol === "ADMIN"
            ? {}
            : { productor: { usuarioId: usuario.id } };
    }

    async evento(id, usuario, db = prisma) {
        const evento = await db.evento.findFirst({
            where: { id: Number(id), ...this.alcance(usuario) },
            include: eventoInclude
        });
        if (!evento) {
            throw new NotFoundException("Evento no encontrado.");
        }
        return evento;
    }

    async eventos(filtros, usuario) {
        return prisma.evento.findMany({
            where: {
                ...this.alcance(usuario),
                ...(filtros.estado ? { estado: filtros.estado } : {}),
                ...(filtros.buscar
                    ? {
                          OR: [
                              {
                                  lugar: {
                                      contains: filtros.buscar,
                                      mode: "insensitive"
                                  }
                              },
                              {
                                  tipoEvento: {
                                      nombre: {
                                          contains: filtros.buscar,
                                          mode: "insensitive"
                                      }
                                  }
                              }
                          ]
                      }
                    : {})
            },
            include: eventoInclude,
            orderBy: [{ inicio: "desc" }, { id: "desc" }]
        });
    }

    async historial(eventoId, filtros, usuario) {
        await this.evento(eventoId, usuario);
        return prisma.seguimientoEvento.findMany({
            where: {
                eventoId: Number(eventoId),
                evento: this.alcance(usuario),
                ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
                ...(filtros.importancia
                    ? { importancia: filtros.importancia }
                    : {}),
                ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
                ...(filtros.buscar
                    ? {
                          descripcion: {
                              contains: filtros.buscar,
                              mode: "insensitive"
                          }
                      }
                    : {}),
                ...(filtros.desde || filtros.hasta
                    ? {
                          createdAt: {
                              ...(filtros.desde
                                  ? { gte: new Date(filtros.desde) }
                                  : {}),
                              ...(filtros.hasta
                                  ? { lt: new Date(filtros.hasta) }
                                  : {})
                          }
                      }
                    : {})
            },
            include: {
                usuario: autor,
                _count: { select: { comentarios: true } }
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }]
        });
    }

    async autores(eventoId, usuario) {
        await this.evento(eventoId, usuario);
        return prisma.usuario.findMany({
            where: {
                seguimientosEvento: {
                    some: {
                        eventoId: Number(eventoId),
                        evento: this.alcance(usuario)
                    }
                }
            },
            ...autor,
            orderBy: { email: "asc" }
        });
    }

    async registro(eventoId, seguimientoId, usuario, db = prisma) {
        await this.evento(eventoId, usuario, db);
        const registro = await db.seguimientoEvento.findFirst({
            where: {
                id: Number(seguimientoId),
                eventoId: Number(eventoId),
                evento: this.alcance(usuario)
            },
            include: { usuario: autor }
        });
        if (!registro) {
            throw new NotFoundException(
                "Registro de seguimiento no encontrado."
            );
        }
        return registro;
    }

    async crear(eventoId, data, usuario) {
        return prisma.$transaction(
            async (db) => {
                await this.evento(eventoId, usuario, db);
                return db.seguimientoEvento.create({
                    data: {
                        eventoId: Number(eventoId),
                        usuarioId: usuario.id,
                        descripcion: data.descripcion,
                        tipo: data.tipo,
                        importancia: data.importancia
                    },
                    include: { usuario: autor }
                });
            },
            { isolationLevel: "Serializable" }
        );
    }

    async comentarios(eventoId, seguimientoId, usuario) {
        await this.registro(eventoId, seguimientoId, usuario);
        return prisma.comentarioSeguimiento.findMany({
            where: {
                seguimientoId: Number(seguimientoId),
                seguimiento: {
                    eventoId: Number(eventoId),
                    evento: this.alcance(usuario)
                }
            },
            include: { usuario: autor },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }]
        });
    }

    async comentar(eventoId, seguimientoId, data, usuario) {
        return prisma.$transaction(
            async (db) => {
                await this.registro(eventoId, seguimientoId, usuario, db);
                return db.comentarioSeguimiento.create({
                    data: {
                        seguimientoId: Number(seguimientoId),
                        usuarioId: usuario.id,
                        comentario: data.comentario
                    },
                    include: { usuario: autor }
                });
            },
            { isolationLevel: "Serializable" }
        );
    }
}

module.exports = new SeguimientoService();
