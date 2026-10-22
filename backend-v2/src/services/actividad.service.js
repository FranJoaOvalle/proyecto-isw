const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class ActividadService {

    async getAll(filtros = {}) {
        const where = {};

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.eventoId !== undefined && filtros.eventoId !== null) {
            where.eventoId = Number(filtros.eventoId);
        }

        if (filtros.productorId) {
            where.productores = {
                some: {
                    productorId: Number(filtros.productorId)
                }
            };
        }

        if (filtros.inicio || filtros.fin) {
            where.AND = [];

            if (filtros.fin) {
                where.AND.push({
                    inicio: { lt: new Date(filtros.fin) }
                });
            }

            if (filtros.inicio) {
                where.AND.push({
                    fin: { gt: new Date(filtros.inicio) }
                });
            }
        }

        return prisma.actividad.findMany({
            where,
            include: {
                productores: {
                    include: {
                        productor: true
                    }
                },
                evento: {
                    include: {
                        tipoEvento: true
                    }
                }
            },
            orderBy: { inicio: "asc" }
        });
    }

    async getById(id) {
        const actividad = await prisma.actividad.findUnique({
            where: { id: Number(id) },
            include: {
                productores: {
                    include: {
                        productor: {
                            include: {
                                usuario: true
                            }
                        }
                    }
                },
                evento: {
                    include: {
                        tipoEvento: true,
                        cliente: true,
                        productor: true
                    }
                }
            }
        });

        if (!actividad) {
            throw new NotFoundException("Actividad no encontrada.");
        }

        return actividad;
    }

    async validarRelaciones({ eventoId, productores }) {
        if (eventoId !== undefined && eventoId !== null) {
            const evento = await prisma.evento.findUnique({
                where: { id: Number(eventoId) }
            });

            if (!evento) {
                throw new NotFoundException(
                    "El evento asociado no existe."
                );
            }
        }

        if (productores !== undefined) {
            if (!Array.isArray(productores) || productores.length === 0) {
                throw new ConflictException(
                    "Debe asignar al menos un productor."
                );
            }

            const ids = productores.map(p => Number(p.productorId));

            if (new Set(ids).size !== ids.length) {
                throw new ConflictException(
                    "No se puede asignar el mismo productor más de una vez."
                );
            }

            const responsables = productores.filter(
                p => p.esResponsable === true
            );

            if (responsables.length !== 1) {
                throw new ConflictException(
                    "Debe asignar exactamente un productor responsable."
                );
            }

            const productoresExistentes = await prisma.productor.findMany({
                where: {
                    id: { in: ids }
                },
                select: { id: true }
            });

            if (productoresExistentes.length !== ids.length) {
                throw new NotFoundException(
                    "Uno o más productores asignados no existen."
                );
            }
        }
    }

    async validarConflictos(
        { inicio, fin, lugar, productores, eventoId },
        actividadIdExcluir = null
    ) {
        const fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);

        if (
            Number.isNaN(fechaInicio.getTime()) ||
            Number.isNaN(fechaFin.getTime())
        ) {
            throw new ConflictException(
                "Las fechas de la actividad no son válidas."
            );
        }

        if (fechaFin <= fechaInicio) {
            throw new ConflictException(
                "La fecha de término debe ser posterior a la fecha de inicio."
            );
        }

        const productorIds = [
            ...new Set((productores || []).map(
                p => Number(p.productorId)
            ))
        ];

        if (productorIds.length > 0) {
            const actividadConflicto = await prisma.actividad.findFirst({
                where: {
                    estado: { not: "CANCELADA" },
                    inicio: { lt: fechaFin },
                    fin: { gt: fechaInicio },

                    productores: {
                        some: {
                            productorId: { in: productorIds }
                        }
                    },

                    ...(actividadIdExcluir !== null
                        ? { id: { not: Number(actividadIdExcluir) } }
                        : {})
                },
                select: { id: true }
            });

            if (actividadConflicto) {
                throw new ConflictException(
                    "Uno o más productores ya tienen otra actividad asignada en ese horario."
                );
            }

            const eventoConflicto = await prisma.evento.findFirst({
                where: {
                    estado: { not: "CANCELADO" },
                    inicio: { lt: fechaFin },
                    fin: { gt: fechaInicio },
                    productorId: { in: productorIds }
                },
                select: { id: true }
            });

            if (eventoConflicto) {
                throw new ConflictException(
                    "Uno o más productores ya tienen un evento contratado en ese horario."
                );
            }
        }

        const lugarNormalizado =
            typeof lugar === "string" ? lugar.trim() : "";

        if (lugarNormalizado) {
            const actividadEnLugar = await prisma.actividad.findFirst({
                where: {
                    estado: { not: "CANCELADA" },
                    inicio: { lt: fechaFin },
                    fin: { gt: fechaInicio },
                    lugar: {
                        equals: lugarNormalizado,
                        mode: "insensitive"
                    },

                    ...(actividadIdExcluir !== null
                        ? { id: { not: Number(actividadIdExcluir) } }
                        : {})
                },
                select: { id: true }
            });

            if (actividadEnLugar) {
                throw new ConflictException(
                    "Ya existe otra actividad en ese lugar y horario."
                );
            }

            const condicionesEventoLugar = {
                estado: { not: "CANCELADO" },
                inicio: { lt: fechaFin },
                fin: { gt: fechaInicio },
                lugar: {
                    equals: lugarNormalizado,
                    mode: "insensitive"
                }
            };

            if (eventoId !== undefined && eventoId !== null) {
                condicionesEventoLugar.id = {
                    not: Number(eventoId)
                };
            }

            const eventoEnLugar = await prisma.evento.findFirst({
                where: condicionesEventoLugar,
                select: { id: true }
            });

            if (eventoEnLugar) {
                throw new ConflictException(
                    "Ya existe un evento contratado en ese lugar y horario."
                );
            }
        }
    }

    async create(data) {
        const { productores, ...datosActividad } = data;

        await this.validarRelaciones({
            eventoId: datosActividad.eventoId,
            productores
        });

        await this.validarConflictos({
            ...datosActividad,
            productores
        });

        return prisma.actividad.create({
            data: {
                ...datosActividad,
                productores: {
                    create: productores.map(productor => ({
                        productorId: Number(productor.productorId),
                        esResponsable: productor.esResponsable ?? false
                    }))
                }
            },
            include: {
                productores: {
                    include: {
                        productor: true
                    }
                },
                evento: true
            }
        });
    }

    async update(id, data) {
        const actividadActual = await this.getById(id);

        if (actividadActual.estado === "CANCELADA") {
            throw new ConflictException(
                "No se puede modificar una actividad cancelada."
            );
        }

        const {
            productores: productoresNuevos,
            ...datosNuevos
        } = data;

        const productoresActuales = actividadActual.productores.map(p => ({
            productorId: p.productorId,
            esResponsable: p.esResponsable
        }));

        const productoresFinales =
            productoresNuevos !== undefined
                ? productoresNuevos
                : productoresActuales;

        const datosFinales = {
            inicio: datosNuevos.inicio ?? actividadActual.inicio,
            fin: datosNuevos.fin ?? actividadActual.fin,
            lugar: datosNuevos.lugar !== undefined
                ? datosNuevos.lugar
                : actividadActual.lugar,
            eventoId: datosNuevos.eventoId !== undefined
                ? datosNuevos.eventoId
                : actividadActual.eventoId,
            productores: productoresFinales
        };

        await this.validarRelaciones({
            eventoId: datosFinales.eventoId,
            productores: productoresFinales
        });

        await this.validarConflictos(datosFinales, id);

        return prisma.actividad.update({
            where: { id: Number(id) },
            data: {
                ...datosNuevos,

                ...(productoresNuevos !== undefined
                    ? {
                        productores: {
                            deleteMany: {},
                            create: productoresNuevos.map(productor => ({
                                productorId: Number(productor.productorId),
                                esResponsable:
                                    productor.esResponsable ?? false
                            }))
                        }
                    }
                    : {})
            },
            include: {
                productores: {
                    include: {
                        productor: true
                    }
                },
                evento: true
            }
        });
    }

    async changeStatus(id, estado) {
        const actividad = await this.getById(id);

        if (actividad.estado === estado) {
            throw new ConflictException(
                "La actividad ya tiene ese estado."
            );
        }

        if (
            actividad.estado === "CANCELADA" &&
            estado !== "CANCELADA"
        ) {
            const productores = actividad.productores.map(p => ({
                productorId: p.productorId,
                esResponsable: p.esResponsable
            }));

            await this.validarConflictos({
                inicio: actividad.inicio,
                fin: actividad.fin,
                lugar: actividad.lugar,
                eventoId: actividad.eventoId,
                productores
            }, id);
        }

        return prisma.actividad.update({
            where: { id: Number(id) },
            data: { estado },
            include: {
                productores: {
                    include: {
                        productor: true
                    }
                },
                evento: true
            }
        });
    }

    async remove(id) {
        const actividad = await this.getById(id);

        if (actividad.estado === "CANCELADA") {
            throw new ConflictException(
                "La actividad ya se encuentra cancelada."
            );
        }

        return prisma.actividad.update({
            where: { id: Number(id) },
            data: { estado: "CANCELADA" }
        });
    }

    async removePhysical(id) {
        await this.getById(id);

        try {
            return await prisma.actividad.delete({
                where: { id: Number(id) }
            });
        } catch (error) {
            if (error.code === "P2003" || error.code === "P2014") {
                throw new ConflictException(
                    "No se puede eliminar físicamente la actividad porque tiene registros relacionados."
                );
            }

            throw error;
        }
    }

    async getAgenda(filtros = {}) {
        const whereActividad = {};
        const whereEvento = {};

        if (filtros.inicio) {
            const inicio = new Date(filtros.inicio);
            whereActividad.fin = { gt: inicio };
            whereEvento.fin = { gt: inicio };
        }

        if (filtros.fin) {
            const fin = new Date(filtros.fin);
            whereActividad.inicio = { lt: fin };
            whereEvento.inicio = { lt: fin };
        }

        if (filtros.productorId) {
            const productorId = Number(filtros.productorId);

            whereActividad.productores = {
                some: { productorId }
            };

            whereEvento.productorId = productorId;
        }

        if (filtros.estadoEvento) {
            whereEvento.estado = filtros.estadoEvento;
        }

        if (filtros.estadoActividad) {
            whereActividad.estado = filtros.estadoActividad;
        } else {
            whereActividad.estado = { not: "CANCELADA" };
        }

        const [actividades, eventos] = await Promise.all([
            prisma.actividad.findMany({
                where: whereActividad,
                include: {
                    productores: {
                        include: {
                            productor: true
                        }
                    },
                    evento: true
                }
            }),

            prisma.evento.findMany({
                where: whereEvento,
                include: {
                    tipoEvento: true,
                    cliente: true,
                    productor: true
                }
            })
        ]);

        const actividadesAgenda = actividades.map(actividad => ({
            ...actividad,
            tipoRegistro: "ACTIVIDAD"
        }));

        const eventosAgenda = eventos.map(evento => ({
            ...evento,
            tipoRegistro: "EVENTO"
        }));

        return [...actividadesAgenda, ...eventosAgenda].sort(
            (a, b) => new Date(a.inicio) - new Date(b.inicio)
        );
    }
}

module.exports = new ActividadService();