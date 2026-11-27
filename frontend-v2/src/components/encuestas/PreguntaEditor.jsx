import ActionButton from "../ActionButton";
import { Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";

import {
    TIPOS_PREGUNTA,
    requiereOpciones
} from "./encuesta.utils";

export default function PreguntaEditor({
                                           pregunta,
                                           index,
                                           total,
                                           onChange,
                                           onRemove,
                                           onMove
                                       }) {
    const cambiarTipo = (tipo) => {
        onChange({
            ...pregunta,
            tipo,
            opciones: requiereOpciones(tipo)
                ? pregunta.opciones.length >= 2
                    ? pregunta.opciones
                    : ["", ""]
                : []
        });
    };

    const cambiarOpcion = (posicion, valor) => {
        onChange({
            ...pregunta,
            opciones: pregunta.opciones.map((opcion, i) =>
                i === posicion ? valor : opcion
            )
        });
    };

    const agregarOpcion = () => {
        onChange({
            ...pregunta,
            opciones: [...pregunta.opciones, ""]
        });
    };

    const eliminarOpcion = (posicion) => {
        onChange({
            ...pregunta,
            opciones: pregunta.opciones.filter(
                (_, i) => i !== posicion
            )
        });
    };

    return (
        <Card className="mb-3">
            <Card.Header className="d-flex align-items-center justify-content-between">
                <span className="fw-semibold">
                    Pregunta {index + 1}
                </span>

                <div className="table-actions">
                    <ActionButton
                        icon="bi-arrow-up"
                        label="Subir pregunta"
                        variant="outline-secondary"
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                    />

                    <ActionButton
                        icon="bi-arrow-down"
                        label="Bajar pregunta"
                        variant="outline-secondary"
                        disabled={index === total - 1}
                        onClick={() => onMove(1)}
                    />

                    <ActionButton
                        icon="bi-trash"
                        label="Eliminar pregunta"
                        variant="outline-danger"
                        disabled={total === 1}
                        onClick={onRemove}
                    />
                </div>
            </Card.Header>

            <Card.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Enunciado *</Form.Label>
                    <Form.Control
                        required
                        minLength={3}
                        maxLength={500}
                        value={pregunta.enunciado}
                        placeholder="Escribe una pregunta..."
                        onChange={(e) => onChange({
                            ...pregunta,
                            enunciado: e.target.value
                        })}
                    />
                </Form.Group>

                <Row className="align-items-center g-3">
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Tipo de respuesta</Form.Label>
                            <Form.Select
                                value={pregunta.tipo}
                                onChange={(e) =>
                                    cambiarTipo(e.target.value)
                                }
                            >
                                {Object.entries(TIPOS_PREGUNTA).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Check
                            type="switch"
                            label="Obligatoria"
                            checked={pregunta.obligatoria}
                            onChange={(e) => onChange({
                                ...pregunta,
                                obligatoria: e.target.checked
                            })}
                        />
                    </Col>
                </Row>

                {requiereOpciones(pregunta.tipo) && (
                    <div className="mt-3">
                        <Form.Label>Alternativas *</Form.Label>

                        {pregunta.opciones.map((opcion, i) => (
                            <InputGroup key={i} className="mb-2">
                                <InputGroup.Text>
                                    {i + 1}
                                </InputGroup.Text>

                                <Form.Control
                                    required
                                    maxLength={150}
                                    value={opcion}
                                    placeholder={`Alternativa ${i + 1}`}
                                    onChange={(e) =>
                                        cambiarOpcion(i, e.target.value)
                                    }
                                />

                                <ActionButton
                                    icon="bi-trash"
                                    label="Eliminar alternativa"
                                    variant="outline-danger"
                                    disabled={pregunta.opciones.length <= 2}
                                    onClick={() => eliminarOpcion(i)}
                                />
                            </InputGroup>
                        ))}

                        <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={pregunta.opciones.length >= 20}
                            onClick={agregarOpcion}
                        >
                            <i className="bi bi-plus-lg me-2" />
                            Agregar alternativa
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}