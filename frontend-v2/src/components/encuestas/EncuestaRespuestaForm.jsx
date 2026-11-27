import { useId } from "react";
import PreguntaRespuesta from "./PreguntaRespuesta";

export default function EncuestaRespuestaForm({
                                                  preguntas,
                                                  respuestas,
                                                  onChange
                                              }) {
    const formId = useId();

    return (
        <div>
            {preguntas.map((pregunta, index) => {
                const id = pregunta.id ?? index;

                return (
                    <PreguntaRespuesta
                        key={id}
                        id={`${formId}-${id}`}
                        pregunta={pregunta}
                        value={respuestas[id]}
                        onChange={value => onChange({
                            ...respuestas,
                            [id]: value
                        })}
                    />
                );
            })}
        </div>
    );
}