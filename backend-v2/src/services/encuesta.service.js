const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

const include = {
    preguntas: {
        orderBy: { orden: "asc" }
    },
    predeterminadas: true
};

class EncuestaService {
    prepararPreguntas(preguntas) {
        return preguntas.map((pregunta, index) => ({
            ...pregunta,
            orden: index + 1
        }));
    }

    async getAll(tipo) {
        return prisma.encuesta.findMany({
            where: tipo ? { tipo } : {},
            include,
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const encuesta = await prisma.encuesta.findUnique({
            where: { id },
            include
        });

        if (!encuesta) {
            throw new NotFoundException(
                "Encuesta no encontrada."
            );
        }

        return encuesta;
    }

    async create(data) {
        const { preguntas, ...encuesta } = data;

        return prisma.encuesta.create({
            data: {
                ...encuesta,
                preguntas: {
                    create: this.prepararPreguntas(preguntas)
                }
            },
            include
        });
    }

    async update(id, data) {
        const { preguntas, ...encuesta } = data;

        return prisma.$transaction(async tx => {
            const existente = await tx.encuesta.findUnique({
                where: { id }
            });

            if (!existente) {
                throw new NotFoundException(
                    "Encuesta no encontrada."
                );
            }

            await tx.encuesta.update({
                where: { id },
                data: encuesta
            });

            await tx.preguntaEncuesta.deleteMany({
                where: { encuestaId: id }
            });

            await tx.preguntaEncuesta.createMany({
                data: this.prepararPreguntas(preguntas).map(
                    pregunta => ({
                        ...pregunta,
                        encuestaId: id
                    })
                )
            });

            return tx.encuesta.findUnique({
                where: { id },
                include
            });
        });
    }

    async cambiarEstado(id, activo) {
        return prisma.$transaction(async tx => {
            const encuesta = await tx.encuesta.findUnique({
                where: { id },
                include
            });

            if (!encuesta) {
                throw new NotFoundException(
                    "Encuesta no encontrada."
                );
            }

            if (!activo && encuesta.predeterminadas.length > 0) {
                throw new ConflictException(
                    "Debes establecer otra encuesta predeterminada antes de desactivar esta."
                );
            }

            return tx.encuesta.update({
                where: { id },
                data: { activo },
                include
            });
        }, {
            isolationLevel: "Serializable"
        });
    }

    async establecerPredeterminada(id) {
        return prisma.$transaction(async tx => {
            const encuesta = await tx.encuesta.findUnique({
                where: { id }
            });

            if (!encuesta) {
                throw new NotFoundException(
                    "Encuesta no encontrada."
                );
            }

            if (!encuesta.activo) {
                throw new ConflictException(
                    "La encuesta debe estar activa."
                );
            }

            return tx.encuestaPredeterminada.upsert({
                where: {
                    tipo: encuesta.tipo
                },
                create: {
                    tipo: encuesta.tipo,
                    encuestaId: id
                },
                update: {
                    encuestaId: id
                }
            });
        }, {
            isolationLevel: "Serializable"
        });
    }

    async obtenerRespuestaEvento(id) {
        const evento = await prisma.evento.findUnique({
            where: { id },
            select: {
                id: true,
                inicio: true,
                fin: true,
                lugar: true,
                estado: true,

                tipoEvento: {
                    select: {
                        nombre: true
                    }
                },

                calificacion: {
                    select: {
                        puntuacion: true,
                        comentario: true
                    }
                }
            }
        });

        if (!evento) {
            throw new NotFoundException("Evento no encontrado.");
        }

        const invitacion = await prisma.invitacionEncuesta.findUnique({
            where: { eventoId: id },
            select: {
                estado: true,
                formulario: true,
                respuestas: true,
                enviadoAt: true,
                respondidoAt: true
            }
        });

        return {
            evento,
            invitacion
        };
    }
}

module.exports = new EncuestaService();