const crypto = require("node:crypto");
const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const validarRespuestasEncuesta = require("../utils/validarRespuestasEncuesta");
const { destinoEncuesta } = require("./envio-encuesta.service");

const productorSelect = {
    id: true,
    nombres: true,
    apellidos: true
};

const eventoSelect = {
    id: true,
    estado: true,
    productorId: true,
    inicio: true,
    fin: true,
    lugar: true,

    tipoEvento: {
        select: {
            id: true,
            nombre: true
        }
    },

    productor: {
        select: productorSelect
    },

    calificacion: {
        select: {
            puntuacion: true,
            comentario: true
        }
    },

    evaluacionProductor: {
        select: {
            id: true,
            puntuacion: true,
            createdAt: true
        }
    }
};

const evaluacionInclude = {
    productor: {
        select: productorSelect
    },

    evaluador: {
        select: {
            id: true,
            email: true
        }
    },

    evento: {
        select: {
            id: true,
            inicio: true,
            fin: true,
            lugar: true,

            tipoEvento: {
                select: {
                    nombre: true
                }
            }
        }
    }
};

class EvaluacionProductorService {

    async listarEventos() {
        const eventos = await prisma.evento.findMany({
            where: {
                estado: "COMPLETADO",
                productorId: {
                    not: null
                }
            },
            select: {
                ...eventoSelect,
                cliente: { select: { usuario: { select: { email: true } } } },
                invitacionEncuesta: {
                    select: { destinatario: true, respondidoAt: true, enviadoAt: true, estado: true, intentos: true }
                }
            },
            orderBy: {
                fin: "desc"
            }
        });
        return eventos.map(({ cliente, invitacionEncuesta, ...evento }) => ({
            ...evento,
            envioEncuesta: evento.calificacion || invitacionEncuesta?.respondidoAt ? null : {
                ...destinoEncuesta(invitacionEncuesta?.destinatario ?? cliente.usuario.email),
                enviadaAntes: Boolean(invitacionEncuesta?.enviadoAt) || invitacionEncuesta?.estado === "ENVIADA",
                estado: invitacionEncuesta?.estado ?? "PENDIENTE",
                intentos: invitacionEncuesta?.intentos ?? 0
            }
        }));
    }

    async obtenerEvento(db, id) {
        const evento = await db.evento.findUnique({
            where: { id },
            select: eventoSelect
        });

        if (!evento) {
            throw new NotFoundException("Evento no encontrado.");
        }

        if (evento.estado !== "COMPLETADO") {
            throw new ConflictException("Solo se pueden evaluar eventos completados.");
        }

        if (!evento.productorId) {
            throw new ConflictException("El evento no tiene un productor asignado.");
        }

        return evento;
    }

    async obtenerFormulario(db) {
        const configuracion =
            await db.encuestaPredeterminada.findUnique({
                where: {
                    tipo: "ADMIN_PRODUCTOR"
                },
                include: {
                    encuesta: {
                        include: {
                            preguntas: {
                                orderBy: {
                                    orden: "asc"
                                }
                            }
                        }
                    }
                }
            });

        const encuesta = configuracion?.encuesta;

        if (!encuesta?.activo) {
            throw new ConflictException("No existe una encuesta de desempeño predeterminada activa.");
        }

        const formulario = {
            nombre: encuesta.nombre,
            descripcion: encuesta.descripcion,
            tipo: encuesta.tipo,

            preguntas: encuesta.preguntas.map(p => ({
                id: p.id,
                enunciado: p.enunciado,
                tipo: p.tipo,
                obligatoria: p.obligatoria,
                orden: p.orden,
                opciones: p.opciones
            }))
        };

        const revision = crypto
            .createHash("sha256")
            .update(JSON.stringify({
                encuestaId: encuesta.id,
                formulario
            }))
            .digest("hex");

        return {
            encuestaId: encuesta.id,
            formulario,
            revision
        };
    }

    async consultarEvento(id) {
        const evento = await this.obtenerEvento(
            prisma,
            id
        );

        if (evento.evaluacionProductor) {
            const evaluacion =
                await prisma.evaluacionProductor.findUnique({
                    where: {
                        eventoId: id
                    },
                    include: evaluacionInclude
                });

            return {
                evento,
                evaluacion,
                formulario: null,
                revision: null
            };
        }

        const { formulario, revision } =
            await this.obtenerFormulario(prisma);

        return {
            evento,
            evaluacion: null,
            formulario,
            revision
        };
    }

    async crear(eventoId, evaluadorId, data) {
        try {
            return await prisma.$transaction(async tx => {
                const evento = await this.obtenerEvento(tx, eventoId);

                if (evento.evaluacionProductor) {
                    throw new ConflictException("Este evento ya tiene una evaluación de productor.");
                }

                const {
                    encuestaId,
                    formulario,
                    revision
                } = await this.obtenerFormulario(tx);

                if (data.revision !== revision) {
                    throw new ConflictException("El formulario fue modificado. Vuelve a cargar la evaluación.");
                }

                const respuestasValidadas =
                    validarRespuestasEncuesta(
                        formulario.preguntas,
                        data.respuestas
                    );

                return tx.evaluacionProductor.create({
                    data: {
                        eventoId,
                        productorId: evento.productorId,
                        evaluadorId,
                        encuestaId,
                        formulario,

                        puntuacion: data.puntuacion,
                        comentario: data.comentario || null,
                        respuestas: respuestasValidadas
                    },
                    include: evaluacionInclude
                });
            }, {
                isolationLevel: "Serializable"
            });
        } catch (error) {
            if (error.code === "P2002") {
                throw new ConflictException("El productor ya fue evaluado para este evento.");
            }

            if (error.code === "P2034") {
                throw new ConflictException("Se produjo un conflicto de concurrencia. Intenta nuevamente.");
            }

            throw error;
        }
    }

    async historialProductor(id) {
        const productor = await prisma.productor.findUnique({
            where: { id },
            select: productorSelect
        });

        if (!productor) {
            throw new NotFoundException("Productor no encontrado.");
        }

        const evaluaciones =
            await prisma.evaluacionProductor.findMany({
                where: {
                    productorId: id
                },
                include: evaluacionInclude,
                orderBy: {
                    createdAt: "desc"
                }
            });

        return {
            productor,
            evaluaciones
        };
    }
}

module.exports = new EvaluacionProductorService();
