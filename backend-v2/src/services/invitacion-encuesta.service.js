class InvitacionEncuestaService {

    async generar(tx, eventoId) {
        console.log("[Encuestas] Generando invitación:", eventoId);
        const existente = await tx.invitacionEncuesta.findUnique({
            where: { eventoId }
        });

        if (existente) return existente;

        const evento = await tx.evento.findUnique({
            where: { id: eventoId },
            include: {
                cliente: {
                    include: {
                        usuario: true
                    }
                },
                calificacion: true
            }
        });

        if (!evento || evento.estado !== "COMPLETADO" || evento.calificacion) {
            return null;
        }

        const configuracion =
            await tx.encuestaPredeterminada.findUnique({
                where: {
                    tipo: "CLIENTE_EVENTO"
                },
                include: {
                    encuesta: {
                        include: {
                            preguntas: {
                                orderBy: { orden: "asc" }
                            }
                        }
                    }
                }
            });

        const encuesta = configuracion?.encuesta;

        if (!encuesta?.activo) {
            console.warn("[Encuestas] No existe una encuesta predeterminada activa.");
            return null;
        }

        const formulario = {
            nombre: encuesta.nombre,
            descripcion: encuesta.descripcion,
            tipo: encuesta.tipo,
            preguntas: encuesta.preguntas.map(pregunta => ({
                id: pregunta.id,
                enunciado: pregunta.enunciado,
                tipo: pregunta.tipo,
                obligatoria: pregunta.obligatoria,
                orden: pregunta.orden,
                opciones: pregunta.opciones
            }))
        };

        return tx.invitacionEncuesta.create({
            data: {
                encuestaId: encuesta.id,
                eventoId: evento.id,
                destinatario: evento.cliente.usuario.email,
                formulario,
                estado: "PENDIENTE"
            }
        });
    }
}

module.exports = new InvitacionEncuestaService();