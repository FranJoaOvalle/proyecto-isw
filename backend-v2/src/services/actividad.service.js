const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const ForbiddenException = require("../exceptions/ForbiddenException");

class ActividadService {

    async validarUsuarioAgenda(usuario) {
        if (!usuario) {
            throw new ForbiddenException(
                "No se pudo identificar al usuario autenticado."
            );
        }

        if (!["ADMIN", "PRODUCTOR"].includes(usuario.rol)) {
            throw new ForbiddenException(
                "No tienes permisos para acceder a la agenda."
            );
        }
    }

    async obtenerProductorAutenticado(usuario) {
        await this.validarUsuarioAgenda(usuario);

        if (usuario.rol === "ADMIN") {
            return null;
        }

        const productor = await prisma.productor.findUnique({
            where: {
                usuarioId: usuario.id
            },
            select: {
                id: true
            }
        });

        if (!productor) {
            throw new NotFoundException(
                "No existe un perfil de productor asociado al usuario."
            );
        }

        return productor.id;
    }

    async verificarAccesoActividad(id, usuario) {
        const productorId =
            await this.obtenerProductorAutenticado(usuario);

        if (productorId === null) {
            return;
        }

        const actividad = await prisma.actividad.findFirst({
            where: {
                id: Number(id),
                estado: { not: "CANCELADA" },
                productores: {
                    some: { productorId }
                }
            },
            select: {
                id: true
            }
        });

        if (!actividad) {
            throw new NotFoundException(
                "Actividad no encontrada."
            );
        }
    }

    async validarEventoProductor(eventoId, productorId) {
        if (eventoId === undefined || eventoId === null) {
            return;
        }

        const evento = await prisma.evento.findUnique({
            where: {
                id: Number(eventoId)
            },
            select: {
                id: true,
                productorId: true
            }
        });

        if (!evento || evento.productorId !== productorId) {
            throw new NotFoundException(
                "Evento no encontrado."
            );
        }
    }

    async getAll(filtros = {}, usuario) {
        await this.validarUsuarioAgenda(usuario);

        const where = {};

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        const estadoActividad =
            filtros.estadoActividad ?? filtros.estado;

        if (estadoActividad) {
            where.estado = estadoActividad;
        }

        if (filtros.eventoId !== undefined && filtros.eventoId !== null) {
            where.eventoId = Number(filtros.eventoId);
        }

        if (usuario.rol === "PRODUCTOR") {
            const productorId =
                await this.obtenerProductorAutenticado(usuario);

            where.productores = {
                some: {
                    productorId
                }
            };

            where.AND = [
                ...(where.AND || []),
                { estado: { not: "CANCELADA" } }
            ];
        } else if (filtros.productorId) {
            where.productores = {
                some: {
                    productorId: Number(filtros.productorId)
                }
            };
        }

        if (filtros.inicio || filtros.fin) {
            where.AND = [...(where.AND || [])];

            if (filtros.fin) {
                where.AND.push({
                    inicio: {
                        lt: new Date(filtros.fin)
                    }
                });
            }

            if (filtros.inicio) {
                where.AND.push({
                    fin: {
                        gt: new Date(filtros.inicio)
                    }
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
            orderBy: {
                inicio: "asc"
            }
        });
    }

    async getById(id, usuario) {
        if (usuario) {
            await this.validarUsuarioAgenda(usuario);
            await this.verificarAccesoActividad(id, usuario);
        }

        const actividad = await prisma.actividad.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                productores: {
                    include: {
                        productor: true
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
            throw new NotFoundException(
                "Actividad no encontrada."
            );
        }

        return actividad;
    }

    async validarRelaciones({ eventoId, productores }) {
        if (eventoId !== undefined && eventoId !== null) {
            const evento = await prisma.evento.findUnique({
                where: {
                    id: Number(eventoId)
                },
                select: {
                    id: true
                }
            });

            if (!evento) {
                throw new NotFoundException(
                    "El evento asociado no existe."
                );
            }
        }

        if (productores === undefined) {
            return;
        }

        if (!Array.isArray(productores) || productores.length === 0) {
            throw new ConflictException(
                "Debe asignar al menos un productor."
            );
        }

        const ids = productores.map(
            productor => Number(productor.productorId)
        );

        if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
            throw new ConflictException(
                "Los identificadores de productores no son válidos."
            );
        }

        if (new Set(ids).size !== ids.length) {
            throw new ConflictException(
                "No se puede asignar el mismo productor más de una vez."
            );
        }

        const responsables = productores.filter(
            productor => productor.esResponsable === true
        );

        if (responsables.length !== 1) {
            throw new ConflictException(
                "Debe asignar exactamente un productor responsable."
            );
        }

        const productoresExistentes = await prisma.productor.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            select: {
                id: true
            }
        });

        if (productoresExistentes.length !== ids.length) {
            throw new NotFoundException(
                "Uno o más productores asignados no existen."
            );
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
            ...new Set(
                (productores || []).map(
                    productor => Number(productor.productorId)
                )
            )
        ];

        if (productorIds.length > 0) {
            const actividadConflicto = await prisma.actividad.findFirst({
                where: {
                    estado: {
                        not: "CANCELADA"
                    },
                    inicio: {
                        lt: fechaFin
                    },
                    fin: {
                        gt: fechaInicio
                    },
                    productores: {
                        some: {
                            productorId: {
                                in: productorIds
                            }
                        }
                    },
                    ...(actividadIdExcluir !== null
                        ? {
                            id: {
                                not: Number(actividadIdExcluir)
                            }
                        }
                        : {})
                },
                select: {
                    id: true
                }
            });

            if (actividadConflicto) {
                throw new ConflictException(
                    "Uno o más productores ya tienen otra actividad asignada en ese horario."
                );
            }

            const condicionesEvento = {
                estado: {
                    not: "CANCELADO"
                },
                inicio: {
                    lt: fechaFin
                },
                fin: {
                    gt: fechaInicio
                },
                productorId: {
                    in: productorIds
                }
            };

            if (eventoId !== undefined && eventoId !== null) {
                condicionesEvento.id = {
                    not: Number(eventoId)
                };
            }

            const eventoConflicto = await prisma.evento.findFirst({
                where: condicionesEvento,
                select: {
                    id: true
                }
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
                    estado: {
                        not: "CANCELADA"
                    },
                    inicio: {
                        lt: fechaFin
                    },
                    fin: {
                        gt: fechaInicio
                    },
                    lugar: {
                        equals: lugarNormalizado,
                        mode: "insensitive"
                    },
                    ...(actividadIdExcluir !== null
                        ? {
                            id: {
                                not: Number(actividadIdExcluir)
                            }
                        }
                        : {})
                },
                select: {
                    id: true
                }
            });

            if (actividadEnLugar) {
                throw new ConflictException(
                    "Ya existe otra actividad en ese lugar y horario."
                );
            }

            const condicionesEventoLugar = {
                estado: {
                    not: "CANCELADO"
                },
                inicio: {
                    lt: fechaFin
                },
                fin: {
                    gt: fechaInicio
                },
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
                select: {
                    id: true
                }
            });

            if (eventoEnLugar) {
                throw new ConflictException(
                    "Ya existe un evento contratado en ese lugar y horario."
                );
            }
        }
    }

    async create(data, usuario) {
        await this.validarUsuarioAgenda(usuario);

        const {
            productores: productoresSolicitados,
            ...datosActividad
        } = data;

        const productorAutenticado =
            await this.obtenerProductorAutenticado(usuario);

        let productores;

        if (usuario.rol === "PRODUCTOR") {
            productores = [{
                productorId: productorAutenticado,
                esResponsable: true
            }];

            await this.validarEventoProductor(
                datosActividad.eventoId,
                productorAutenticado
            );
        } else {
            if (
                !Array.isArray(productoresSolicitados) ||
                productoresSolicitados.length === 0
            ) {
                throw new ConflictException(
                    "Debe asignar al menos un productor."
                );
            }

            productores = productoresSolicitados;

            await this.validarRelaciones({
                eventoId: datosActividad.eventoId,
                productores
            });
        }

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

    async update(id, data, usuario) {
        await this.validarUsuarioAgenda(usuario);

        const actividadActual = await this.getById(id, usuario);

        if (
            actividadActual.estado === "CANCELADA" &&
            usuario.rol !== "ADMIN"
        ) {
            throw new ConflictException(
                "Solo un administrador puede modificar una actividad cancelada."
            );
        }

        const {
            productores: productoresNuevos,
            ...datosNuevos
        } = data;

        const esProductor = usuario.rol === "PRODUCTOR";

        if (esProductor && productoresNuevos !== undefined) {
            throw new ForbiddenException(
                "No puedes modificar las asignaciones de productores."
            );
        }

        if (
            esProductor &&
            datosNuevos.estado !== undefined &&
            !["PENDIENTE", "COMPLETADA"].includes(datosNuevos.estado)
        ) {
            throw new ForbiddenException(
                "Solo puedes cambiar el estado de tus actividades entre pendiente y completada."
            );
        }

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

        if (esProductor) {
            const eventoActualId = actividadActual.eventoId ?? null;
            const eventoNuevoId = datosFinales.eventoId ?? null;

            if (eventoNuevoId !== eventoActualId) {
                const productorId =
                    await this.obtenerProductorAutenticado(usuario);

                await this.validarEventoProductor(
                    eventoNuevoId,
                    productorId
                );
            }
        } else {
            await this.validarRelaciones({
                eventoId: datosFinales.eventoId,
                productores: productoresFinales
            });
        }

        await this.validarConflictos(datosFinales, id);

        return prisma.actividad.update({
            where: {
                id: Number(id)
            },
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

    async changeStatus(id, estado, usuario) {
        await this.validarUsuarioAgenda(usuario);

        if (
            usuario.rol === "PRODUCTOR" &&
            !["PENDIENTE", "COMPLETADA"].includes(estado)
        ) {
            throw new ForbiddenException(
                "Solo puedes actualizar tus actividades entre pendiente y completada."
            );
        }

        const actividad = await this.getById(id, usuario);

        if (actividad.estado === estado) {
            throw new ConflictException(
                "La actividad ya tiene ese estado."
            );
        }

        if (
            actividad.estado === "CANCELADA" &&
            estado !== "CANCELADA"
        ) {
            if (usuario.rol !== "ADMIN") {
                throw new ForbiddenException(
                    "Solo un administrador puede reactivar una actividad cancelada."
                );
            }

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
            where: {
                id: Number(id)
            },
            data: {
                estado
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

    async remove(id, usuario) {
        await this.validarUsuarioAgenda(usuario);

        const actividad = await this.getById(id, usuario);

        if (actividad.estado === "CANCELADA") {
            throw new ConflictException(
                "La actividad ya se encuentra cancelada."
            );
        }

        return prisma.actividad.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: "CANCELADA"
            }
        });
    }

    async removePhysical(id, usuario) {
        if (!usuario || usuario.rol !== "ADMIN") {
            throw new ForbiddenException(
                "Solo un administrador puede eliminar físicamente una actividad."
            );
        }

        await this.getById(id);

        try {
            return await prisma.actividad.delete({
                where: {
                    id: Number(id)
                }
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

    async getAgenda(filtros = {}, usuario) {
        await this.validarUsuarioAgenda(usuario);

        const whereActividad = {};
        const whereEvento = {};

        if (filtros.inicio) {
            const inicio = new Date(filtros.inicio);

            whereActividad.fin = {
                gt: inicio
            };

            whereEvento.fin = {
                gt: inicio
            };
        }

        if (filtros.fin) {
            const fin = new Date(filtros.fin);

            whereActividad.inicio = {
                lt: fin
            };

            whereEvento.inicio = {
                lt: fin
            };
        }

        if (filtros.tipo) {
            whereActividad.tipo = filtros.tipo;
        }

        if (filtros.estadoActividad ?? filtros.estado) {
            whereActividad.estado =
                filtros.estadoActividad ?? filtros.estado;
        }

        if (filtros.eventoId !== undefined && filtros.eventoId !== null) {
            const eventoId = Number(filtros.eventoId);

            whereActividad.eventoId = eventoId;
            whereEvento.id = eventoId;
        }

        if (usuario.rol === "PRODUCTOR") {
            const productorId =
                await this.obtenerProductorAutenticado(usuario);

            whereActividad.productores = {
                some: {
                    productorId
                }
            };

            whereEvento.productorId = productorId;

            whereActividad.AND = [
                ...(whereActividad.AND || []),
                { estado: { not: "CANCELADA" } }
            ];
        } else if (filtros.productorId) {
            const productorId = Number(filtros.productorId);

            whereActividad.productores = {
                some: {
                    productorId
                }
            };

            whereEvento.productorId = productorId;
        }

        if (filtros.estadoEvento) {
            whereEvento.estado = filtros.estadoEvento;
        }

        const actividades = await prisma.actividad.findMany({
            where: whereActividad,
            include: {
                productores: {
                    include: { productor: true }
                },
                evento: {
                    include: {
                        tipoEvento: true,
                        cliente: {
                            include: {
                                persona: true,
                                empresa: true
                            }
                        }
                    }
                }
            }
        });

        const actividadesAgenda = actividades.map(actividad => ({
            ...actividad,
            tipoRegistro: "ACTIVIDAD"
        }));

        if (filtros.tipo) {
            return actividadesAgenda.sort(
                (a, b) => new Date(a.inicio) - new Date(b.inicio)
            );
        }

        const eventos = await prisma.evento.findMany({
            where: whereEvento,
            include: {
                tipoEvento: true,
                cliente: {
                    include: {
                        persona: true,
                        empresa: true
                    }
                },
                productor: true
            }
        });

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
