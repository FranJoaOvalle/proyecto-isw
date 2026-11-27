import { Badge } from "react-bootstrap";

import {
    respuestaVacia
} from "./encuesta.utils";

function RespuestaValor({ pregunta, valor }) {
    if (respuestaVacia(valor)) {
        return (
            <span className="text-secondary fst-italic">
                Sin respuesta
            </span>
        );
    }

    switch (pregunta.tipo) {
        case "ESCALA":
            return (
                <Badge bg="primary">
                    {valor} / 5
                </Badge>
            );

        case "SI_NO":
            return (
                <Badge bg={valor ? "success" : "secondary"}>
                    {valor ? "Sí" : "No"}
                </Badge>
            );

        case "SELECCION_MULTIPLE":
            return (
                <div className="d-flex flex-wrap gap-2">
                    {valor.map((opcion, index) => (
                        <Badge key={index} bg="secondary">
                            {opcion}
                        </Badge>
                    ))}
                </div>
            );

        default:
            return (
                <div style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere"
                }}>
                    {valor}
                </div>
            );
    }
}

export default function EncuestaRespuestasDetalle({preguntas, respuestas}) {
    return (
        <div>
            {preguntas.map(pregunta => (
                <div
                    key={pregunta.id}
                    className="border rounded p-3 mb-3"
                >
                    <div className="fw-semibold mb-2">
                        {pregunta.enunciado}
                    </div>

                    <RespuestaValor
                        pregunta={pregunta}
                        valor={respuestas?.[pregunta.id]}
                    />
                </div>
            ))}
        </div>
    );
}