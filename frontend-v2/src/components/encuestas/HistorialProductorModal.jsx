import { useEffect, useState } from "react";

import {
    Accordion,
    Alert,
    Badge,
    Button,
    Col,
    Modal,
    Row,
    Spinner
} from "react-bootstrap";

import EncuestaRespuestasDetalle from "./EncuestaRespuestasDetalle";

import {
    getHistorialProductor
} from "../../services/evaluacion-productor.service";

export default function HistorialProductorModal({
                                                    productorId,
                                                    onClose
                                                }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;

        getHistorialProductor(productorId)
            .then(resultado => {
                if (activo) setData(resultado);
            })
            .catch(error => {
                if (activo) {
                    setError(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar el historial."
                    );
                }
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => {
            activo = false;
        };
    }, [productorId]);

    const evaluaciones = data?.evaluaciones ?? [];

    const promedio = evaluaciones.length
        ? evaluaciones.reduce(
        (total, e) => total + e.puntuacion,
        0
    ) / evaluaciones.length
        : null;

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
                    Historial de desempeño
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

                {data && (
                    <>
                        <h4 className="fw-semibold mb-4">
                            {data.productor.nombres}{" "}
                            {data.productor.apellidos}
                        </h4>

                        <Row className="g-3 mb-4">
                            <Col xs={6}>
                                <div className="border rounded p-3">
                                    <small className="text-secondary">
                                        Evaluaciones realizadas
                                    </small>

                                    <div className="fs-2 fw-bold">
                                        {evaluaciones.length}
                                    </div>
                                </div>
                            </Col>

                            <Col xs={6}>
                                <div className="border rounded p-3">
                                    <small className="text-secondary">
                                        Promedio de gerencia
                                    </small>

                                    <div className="fs-2 fw-bold">
                                        {promedio !== null
                                            ? promedio.toFixed(2)
                                            : "—"}

                                        {promedio !== null && (
                                            <small className="fs-6 text-secondary">
                                                {" / 5"}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {evaluaciones.length === 0 ? (
                            <Alert variant="secondary">
                                Este productor aún no tiene evaluaciones.
                            </Alert>
                        ) : (
                            <Accordion>
                                {evaluaciones.map(evaluacion => (
                                    <Accordion.Item
                                        key={evaluacion.id}
                                        eventKey={String(evaluacion.id)}
                                    >
                                        <Accordion.Header>
                                            <div className="d-flex align-items-center gap-3 w-100 me-3">
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold">
                                                        {evaluacion.evento.tipoEvento.nombre}
                                                    </div>

                                                    <small className="text-secondary">
                                                        Evento #{evaluacion.evento.id}
                                                        {" · "}
                                                        {new Date(
                                                            evaluacion.createdAt
                                                        ).toLocaleDateString("es-CL")}
                                                    </small>
                                                </div>

                                                <Badge bg="primary">
                                                    {evaluacion.puntuacion} / 5
                                                </Badge>
                                            </div>
                                        </Accordion.Header>

                                        <Accordion.Body>
                                            <p className="text-secondary small">
                                                Evaluado por {evaluacion.evaluador.email}
                                            </p>

                                            <h6 className="fw-semibold mb-3">
                                                {evaluacion.formulario.nombre}
                                            </h6>

                                            <EncuestaRespuestasDetalle
                                                preguntas={
                                                    evaluacion.formulario.preguntas
                                                }
                                                respuestas={
                                                    evaluacion.respuestas
                                                }
                                            />

                                            <hr />

                                            <h6>Comentarios adicionales</h6>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                    overflowWrap: "anywhere"
                                                }}
                                            >
                                                {evaluacion.comentario ||
                                                    "Sin comentarios."}
                                            </p>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
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