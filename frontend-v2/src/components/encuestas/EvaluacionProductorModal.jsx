import { useEffect, useState } from "react";

import {
    Alert,
    Badge,
    Button,
    Form,
    Modal,
    Spinner
} from "react-bootstrap";

import EncuestaRespuestaForm from "./EncuestaRespuestaForm";
import EncuestaRespuestasDetalle from "./EncuestaRespuestasDetalle";
import PreguntaRespuesta from "./PreguntaRespuesta";

import {
    validarRespuestasObligatorias
} from "./encuesta.utils";

import {
    getEvaluacionEvento,
    crearEvaluacionProductor
} from "../../services/evaluacion-productor.service";

export default function EvaluacionProductorModal({
                                                     eventoId,
                                                     onClose,
                                                     onSaved
                                                 }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const [puntuacion, setPuntuacion] = useState(null);
    const [comentario, setComentario] = useState("");
    const [respuestas, setRespuestas] = useState({});

    useEffect(() => {
        let activo = true;

        getEvaluacionEvento(eventoId)
            .then(resultado => {
                if (activo) setData(resultado);
            })
            .catch(error => {
                if (activo) {
                    setError(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar la evaluación."
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (guardando || !data?.formulario || data.evaluacion) {
            return;
        }

        setError("");

        if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
            setError("Debes seleccionar una puntuación general.");
            return;
        }

        const faltantes = validarRespuestasObligatorias(
            data.formulario.preguntas,
            respuestas
        );

        if (faltantes.length > 0) {
            setError(`Debes responder: ${faltantes[0].enunciado}`);
            return;
        }

        setGuardando(true);

        try {
            await crearEvaluacionProductor(eventoId, {
                revision: data.revision,
                puntuacion,
                comentario: comentario.trim() || null,
                respuestas
            });

            await onSaved();
            onClose();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible guardar la evaluación."
            );
        } finally {
            setGuardando(false);
        }
    };

    const evaluacion = data?.evaluacion;
    const productor = data?.evento?.productor;

    return (
        <Modal
            show
            centered
            scrollable
            size="lg"
            onHide={() => {
                if (!guardando) onClose();
            }}
        >
            <Form
                onSubmit={handleSubmit}
                className="d-flex flex-column overflow-hidden"
                style={{ minHeight: 0 }}
            >
                <Modal.Header closeButton={!guardando}>
                    <Modal.Title>
                        {evaluacion
                            ? "Detalle de evaluación"
                            : "Evaluar productor"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="overflow-auto">
                    {error && (
                        <Alert variant="danger">
                            {error}
                        </Alert>
                    )}

                    {loading && (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    )}

                    {data && (
                        <>
                            <div className="bg-body-tertiary rounded p-3 mb-4">
                                <small className="text-secondary">
                                    Productor responsable
                                </small>

                                <h5 className="fw-semibold mb-2">
                                    {productor?.nombres}{" "}
                                    {productor?.apellidos}
                                </h5>

                                <div>
                                    {data.evento.tipoEvento.nombre}
                                    {" · "}
                                    Evento #{data.evento.id}
                                </div>

                                <small className="text-secondary">
                                    {data.evento.lugar}
                                </small>
                            </div>

                            {evaluacion ? (
                                <>
                                    <h5 className="fw-semibold">
                                        Evaluación general
                                    </h5>

                                    <Badge bg="primary" className="fs-5 mb-3">
                                        {evaluacion.puntuacion} / 5
                                    </Badge>

                                    <div className="text-secondary small mb-3">
                                        Evaluado por {evaluacion.evaluador.email}
                                        <br />
                                        {new Date(
                                            evaluacion.createdAt
                                        ).toLocaleString("es-CL")}
                                    </div>

                                    <hr />

                                    <h5 className="mb-3">
                                        {evaluacion.formulario.nombre}
                                    </h5>

                                    <EncuestaRespuestasDetalle
                                        preguntas={
                                            evaluacion.formulario.preguntas
                                        }
                                        respuestas={evaluacion.respuestas}
                                    />

                                    <hr />

                                    <h6>Comentarios adicionales</h6>

                                    <p style={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere"
                                    }}>
                                        {evaluacion.comentario ||
                                            "Sin comentarios."}
                                    </p>
                                </>
                            ) : data.formulario && (
                                <fieldset disabled={guardando}>
                                    <PreguntaRespuesta
                                        id="desempeno-general"
                                        pregunta={{
                                            enunciado:
                                                "¿Cómo calificarías el desempeño general del productor?",
                                            tipo: "ESCALA",
                                            obligatoria: true
                                        }}
                                        value={puntuacion}
                                        onChange={setPuntuacion}
                                    />

                                    <hr />

                                    <h5 className="fw-semibold">
                                        {data.formulario.nombre}
                                    </h5>

                                    {data.formulario.descripcion && (
                                        <p className="text-secondary">
                                            {data.formulario.descripcion}
                                        </p>
                                    )}

                                    <EncuestaRespuestaForm
                                        preguntas={data.formulario.preguntas}
                                        respuestas={respuestas}
                                        onChange={setRespuestas}
                                    />

                                    <hr />

                                    <Form.Group>
                                        <Form.Label className="fw-semibold">
                                            Comentarios adicionales
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            maxLength={2000}
                                            value={comentario}
                                            onChange={e =>
                                                setComentario(e.target.value)
                                            }
                                        />
                                    </Form.Group>
                                </fieldset>
                            )}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        disabled={guardando}
                        onClick={onClose}
                    >
                        {evaluacion ? "Cerrar" : "Cancelar"}
                    </Button>

                    {data?.formulario && !evaluacion && (
                        <Button
                            type="submit"
                            disabled={guardando}
                        >
                            {guardando && (
                                <Spinner
                                    size="sm"
                                    className="me-2"
                                />
                            )}

                            Guardar evaluación
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
}