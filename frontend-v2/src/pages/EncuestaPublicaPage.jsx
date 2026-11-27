import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
    Alert,
    Button,
    Card,
    Container,
    Form,
    Spinner
} from "react-bootstrap";

import EncuestaRespuestaForm
    from "../components/encuestas/EncuestaRespuestaForm";

import PreguntaRespuesta
    from "../components/encuestas/PreguntaRespuesta";

import {
    validarRespuestasObligatorias
} from "../components/encuestas/encuesta.utils";

import {
    consultarEncuestaPublica,
    responderEncuestaPublica
} from "../services/encuesta-publica.service";

export default function EncuestaPublicaPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [encuesta, setEncuesta] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [puntuacion, setPuntuacion] = useState(null);
    const [comentario, setComentario] = useState("");

    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [completada, setCompletada] = useState(false);

    const [errorCarga, setErrorCarga] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setEncuesta(null);
        setErrorCarga("");
        setError("");
        setCompletada(false);
        setRespuestas({});
        setPuntuacion(null);
        setComentario("");

        if (!token) {
            setErrorCarga(
                "El enlace de la encuesta no es válido."
            );

            setLoading(false);
            return;
        }

        consultarEncuestaPublica(token, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) {
                    setEncuesta(data);
                }
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setErrorCarga(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar la encuesta."
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (enviando || !encuesta) return;

        setError("");

        if (
            !Number.isInteger(puntuacion) ||
            puntuacion < 1 ||
            puntuacion > 5
        ) {
            setError(
                "Debes seleccionar una calificación general."
            );
            return;
        }

        const faltantes = validarRespuestasObligatorias(
            encuesta.formulario.preguntas,
            respuestas
        );

        if (faltantes.length > 0) {
            setError(
                `Debes responder: ${faltantes[0].enunciado}`
            );
            return;
        }

        setEnviando(true);

        try {
            await responderEncuestaPublica({
                token,
                puntuacion,
                comentario: comentario.trim() || null,
                respuestas
            });

            setCompletada(true);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible enviar las respuestas."
            );
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-vh-100 bg-body-tertiary">
            <Container
                className="py-5"
                style={{ maxWidth: 760 }}
            >
                <div className="text-center mb-4">
                    <span className="fs-4 fw-bold text-primary">
                        NES Eventos
                    </span>
                </div>

                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4 p-md-5">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" />

                                <p className="text-secondary mt-3 mb-0">
                                    Cargando encuesta...
                                </p>
                            </div>
                        ) : errorCarga ? (
                            <div className="text-center py-4">
                                <i className="bi bi-exclamation-circle display-4 text-warning" />

                                <h3 className="fw-bold mt-3">
                                    Encuesta no disponible
                                </h3>

                                <p className="text-secondary">
                                    {errorCarga}
                                </p>

                                <Button as={Link} to="/">
                                    Volver al inicio
                                </Button>
                            </div>
                        ) : completada ? (
                            <div className="text-center py-4">
                                <i className="bi bi-check-circle-fill display-3 text-success" />

                                <h2 className="fw-bold mt-4">
                                    ¡Gracias por tu opinión!
                                </h2>

                                <p className="text-secondary">
                                    Hemos recibido tus respuestas
                                    correctamente. Tu experiencia
                                    nos ayuda a mejorar nuestros
                                    servicios.
                                </p>

                                <Button as={Link} to="/">
                                    Volver al inicio
                                </Button>
                            </div>
                        ) : encuesta && (
                            <>
                                <h2 className="fw-bold mb-2">
                                    {encuesta.formulario.nombre}
                                </h2>

                                {encuesta.formulario.descripcion && (
                                    <p className="text-secondary">
                                        {encuesta.formulario.descripcion}
                                    </p>
                                )}

                                <div className="bg-body-tertiary rounded p-3 my-4">
                                    <div className="fw-semibold">
                                        {encuesta.evento.tipoEvento}
                                    </div>

                                    <div className="text-secondary small mt-1">
                                        <i className="bi bi-geo-alt me-2" />
                                        {encuesta.evento.lugar}
                                    </div>

                                    <div className="text-secondary small mt-1">
                                        <i className="bi bi-calendar-event me-2" />

                                        {new Date(
                                            encuesta.evento.inicio
                                        ).toLocaleDateString("es-CL", {
                                            timeZone: "America/Santiago"
                                        })}
                                    </div>
                                </div>

                                <Form onSubmit={handleSubmit}>
                                    <fieldset disabled={enviando}>
                                        <h5 className="fw-semibold mb-3">
                                            Evaluación general
                                        </h5>

                                        <PreguntaRespuesta
                                            id="puntuacion-general"
                                            pregunta={{
                                                enunciado:
                                                    "¿Cómo calificarías tu experiencia general?",
                                                tipo: "ESCALA",
                                                obligatoria: true
                                            }}
                                            value={puntuacion}
                                            onChange={setPuntuacion}
                                        />

                                        <hr className="my-4" />

                                        <h5 className="fw-semibold mb-4">
                                            Sobre tu experiencia
                                        </h5>

                                        <EncuestaRespuestaForm
                                            preguntas={
                                                encuesta.formulario.preguntas
                                            }
                                            respuestas={respuestas}
                                            onChange={setRespuestas}
                                        />

                                        <hr className="my-4" />

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold">
                                                Comentarios adicionales
                                            </Form.Label>

                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                maxLength={2000}
                                                value={comentario}
                                                placeholder="¿Hay algo más que quieras compartir?"
                                                onChange={e =>
                                                    setComentario(e.target.value)
                                                }
                                            />

                                            <Form.Text>
                                                Opcional
                                            </Form.Text>
                                        </Form.Group>

                                        {error && (
                                            <Alert variant="danger">
                                                {error}
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-100"
                                            disabled={enviando}
                                        >
                                            {enviando ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-2"
                                                    />

                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-2" />
                                                    Enviar evaluación
                                                </>
                                            )}
                                        </Button>
                                    </fieldset>
                                </Form>
                            </>
                        )}
                    </Card.Body>
                </Card>

                <p className="text-center text-secondary small mt-4">
                    NES Eventos · Encuesta de satisfacción
                </p>
            </Container>
        </div>
    );
}