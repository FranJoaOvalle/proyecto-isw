import { useEffect, useState } from "react";

import {
    Alert,
    Badge,
    Button,
    Modal,
    Spinner
} from "react-bootstrap";

import EncuestaRespuestasDetalle from "./EncuestaRespuestasDetalle";

import {
    getRespuestaEncuestaEvento
} from "../../services/encuesta.service";

export default function RespuestaClienteModal({
                                                  eventoId,
                                                  onClose
                                              }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;

        getRespuestaEncuestaEvento(eventoId)
            .then(resultado => {
                if (activo) setData(resultado);
            })
            .catch(error => {
                if (activo) {
                    setError(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar la encuesta."
                    );
                }
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => {
            activo = false;
        };
    }, [eventoId]);

    const evento = data?.evento;
    const invitacion = data?.invitacion;
    const calificacion = evento?.calificacion;

    return (
        <Modal
            show
            centered
            scrollable
            size="lg"
            onHide={onClose}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    Satisfacción del cliente
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                    </div>
                )}

                {error && (
                    <Alert variant="danger">
                        {error}
                    </Alert>
                )}

                {evento && (
                    <>
                        <div className="bg-body-tertiary rounded p-3 mb-4">
                            <h5 className="fw-semibold mb-1">
                                {evento.tipoEvento.nombre}
                            </h5>

                            <div>Evento #{evento.id}</div>

                            <small className="text-secondary">
                                {evento.lugar}
                            </small>
                        </div>

                        {calificacion ? (
                            <>
                                <h5 className="fw-semibold">
                                    Evaluación general
                                </h5>

                                <Badge
                                    bg="primary"
                                    className="fs-5 mb-3"
                                >
                                    {calificacion.puntuacion} / 5
                                </Badge>

                                {invitacion?.respondidoAt && (
                                    <div className="text-secondary small mb-3">
                                        Respondida el{" "}
                                        {new Date(
                                            invitacion.respondidoAt
                                        ).toLocaleString("es-CL", {
                                            timeZone: "America/Santiago"
                                        })}
                                    </div>
                                )}

                                <hr />

                                {invitacion?.respondidoAt &&
                                invitacion?.formulario ? (
                                    <>
                                        <h5 className="fw-semibold">
                                            {invitacion.formulario.nombre}
                                        </h5>

                                        {invitacion.formulario.descripcion && (
                                            <p className="text-secondary">
                                                {invitacion.formulario.descripcion}
                                            </p>
                                        )}

                                        <EncuestaRespuestasDetalle
                                            preguntas={
                                                invitacion.formulario.preguntas
                                            }
                                            respuestas={
                                                invitacion.respuestas
                                            }
                                        />
                                    </>
                                ) : (
                                    <Alert variant="secondary">
                                        Esta calificación no tiene
                                        respuestas dinámicas asociadas.
                                    </Alert>
                                )}

                                <hr />

                                <h6 className="fw-semibold">
                                    Comentarios adicionales
                                </h6>

                                <p style={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere"
                                }}>
                                    {calificacion.comentario ||
                                        "Sin comentarios."}
                                </p>
                            </>
                        ) : (
                            <>
                                {!invitacion && (
                                    <Alert variant="secondary">
                                        No se ha generado una encuesta
                                        para este evento.
                                    </Alert>
                                )}

                                {invitacion?.estado === "PENDIENTE" && (
                                    <Alert variant="warning">
                                        La invitación está pendiente
                                        de envío.
                                    </Alert>
                                )}

                                {invitacion?.estado === "FALLIDA" && (
                                    <Alert variant="danger">
                                        No se pudo enviar la invitación.
                                    </Alert>
                                )}

                                {invitacion?.estado === "ENVIADA" && (
                                    <Alert variant="info">
                                        La invitación fue enviada,
                                        pero el cliente todavía
                                        no ha respondido.
                                    </Alert>
                                )}
                            </>
                        )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onClose}
                >
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}