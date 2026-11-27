import { useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";

import EncuestaRespuestaForm from "./EncuestaRespuestaForm";

export default function EncuestaPreviewModal({
                                                 encuesta,
                                                 onClose
                                             }) {
    const [respuestas, setRespuestas] = useState({});

    return (
        <Modal
            show
            size="lg"
            centered
            scrollable
            onHide={onClose}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    Vista previa
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert variant="info">
                    Esta es una previsualización. Las respuestas
                    ingresadas no serán almacenadas.
                </Alert>

                <h4 className="fw-semibold">
                    {encuesta.nombre}
                </h4>

                {encuesta.descripcion && (
                    <p className="text-secondary">
                        {encuesta.descripcion}
                    </p>
                )}

                <hr />

                <EncuestaRespuestaForm
                    preguntas={encuesta.preguntas}
                    respuestas={respuestas}
                    onChange={setRespuestas}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    onClick={() => setRespuestas({})}
                >
                    Limpiar respuestas
                </Button>

                <Button onClick={onClose}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}