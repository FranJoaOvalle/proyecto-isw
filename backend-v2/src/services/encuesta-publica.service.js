const crypto = require("node:crypto");
const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const BadRequestException = require("../exceptions/BadRequestException");
const ConflictException = require("../exceptions/ConflictException");
const validarRespuestasEncuesta = require("../utils/validarRespuestasEncuesta");

class EncuestaPublicaService {
    async obtenerInvitacion(db, token) {
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const invitacion =
            await db.invitacionEncuesta.findUnique({
                where: { tokenHash },
                include: {
                    evento: {
                        include: {
                            calificacion: true,
                            tipoEvento: true
                        }
                    }
                }
            });

        if (!invitacion) {
            throw new NotFoundException("El enlace de la encuesta no es válido.");
        }

        if (invitacion.respondidoAt || invitacion.evento.calificacion) {
            throw new ConflictException("Esta encuesta ya fue respondida.");
        }

        if (!invitacion.expiraAt || invitacion.expiraAt <= new Date()) {
            throw new BadRequestException("El enlace de la encuesta ha expirado.");
        }

        if (invitacion.evento.estado !== "COMPLETADO") {
            throw new ConflictException("El evento no se encuentra completado.");
        }

        return invitacion;
    }

    async consultar(token) {
        const invitacion =
            await this.obtenerInvitacion(prisma, token);

        return {
            formulario: invitacion.formulario,
            expiraAt: invitacion.expiraAt,

            evento: {
                id: invitacion.evento.id,
                inicio: invitacion.evento.inicio,
                fin: invitacion.evento.fin,
                lugar: invitacion.evento.lugar,
                tipoEvento: invitacion.evento.tipoEvento.nombre
            }
        };
    }

    async responder(data) {
        const {
            token,
            puntuacion,
            comentario,
            respuestas
        } = data;

        return prisma.$transaction(async tx => {
            const invitacion =
                await this.obtenerInvitacion(tx, token);

            const respuestasValidadas =
                validarRespuestasEncuesta(
                    invitacion.formulario.preguntas,
                    respuestas
                );

            const resultado =
                await tx.invitacionEncuesta.updateMany({
                    where: {
                        id: invitacion.id,
                        respondidoAt: null,
                        expiraAt: {
                            gt: new Date()
                        },
                        evento: {
                            estado: "COMPLETADO"
                        }
                    },
                    data: {
                        respuestas: respuestasValidadas,
                        respondidoAt: new Date()
                    }
                });

            if (resultado.count !== 1) {
                throw new ConflictException("La encuesta ya no está disponible.");
            }

            await tx.calificacion.create({
                data: {
                    eventoId: invitacion.eventoId,
                    puntuacion,
                    comentario: comentario || null
                }
            });

            return {
                message: "Gracias por responder nuestra encuesta."
            };
        });
    }
}

module.exports = new EncuestaPublicaService();