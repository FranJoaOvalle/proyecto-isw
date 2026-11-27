import { Form, ToggleButton, ToggleButtonGroup } from "react-bootstrap";

export default function PreguntaRespuesta({
                                              pregunta,
                                              value,
                                              onChange,
                                              id
                                          }) {
    const renderInput = () => {
        switch (pregunta.tipo) {
            case "ESCALA":
                return (
                    <ToggleButtonGroup
                        type="radio"
                        name={`escala-${id}`}
                        value={value ?? undefined}
                        onChange={onChange}
                        className="w-100"
                    >
                        {[1, 2, 3, 4, 5].map(numero => (
                            <ToggleButton
                                key={numero}
                                id={`${id}-escala-${numero}`}
                                value={numero}
                                variant="outline-primary"
                            >
                                {numero}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                );

            case "TEXTO":
                return (
                    <Form.Control
                        as="textarea"
                        rows={3}
                        maxLength={2000}
                        value={value ?? ""}
                        placeholder="Escribe tu respuesta..."
                        onChange={e => onChange(e.target.value)}
                    />
                );

            case "SI_NO":
                return (
                    <ToggleButtonGroup
                        type="radio"
                        name={`boolean-${id}`}
                        value={value ?? undefined}
                        onChange={onChange}
                    >
                        <ToggleButton
                            id={`${id}-si`}
                            value={true}
                            variant="outline-primary"
                        >
                            Sí
                        </ToggleButton>

                        <ToggleButton
                            id={`${id}-no`}
                            value={false}
                            variant="outline-primary"
                        >
                            No
                        </ToggleButton>
                    </ToggleButtonGroup>
                );

            case "SELECCION_UNICA":
                return pregunta.opciones.map((opcion, index) => (
                    <Form.Check
                        key={index}
                        id={`${id}-radio-${index}`}
                        type="radio"
                        name={`radio-${id}`}
                        label={opcion}
                        checked={value === opcion}
                        onChange={() => onChange(opcion)}
                        className="mb-2"
                    />
                ));

            case "SELECCION_MULTIPLE":
                return pregunta.opciones.map((opcion, index) => {
                    const seleccionadas = Array.isArray(value)
                        ? value
                        : [];

                    return (
                        <Form.Check
                            key={index}
                            id={`${id}-check-${index}`}
                            type="checkbox"
                            label={opcion}
                            checked={seleccionadas.includes(opcion)}
                            onChange={e => onChange(
                                e.target.checked
                                    ? [...seleccionadas, opcion]
                                    : seleccionadas.filter(o => o !== opcion)
                            )}
                            className="mb-2"
                        />
                    );
                });

            default:
                return null;
        }
    };

    return (
        <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
                {pregunta.enunciado}

                {pregunta.obligatoria && (
                    <span className="text-danger ms-1">*</span>
                )}
            </Form.Label>

            <div>{renderInput()}</div>

            {pregunta.tipo === "ESCALA" && (
                <div className="d-flex justify-content-between mt-2">
                    <small className="text-secondary">
                        Muy deficiente
                    </small>

                    <small className="text-secondary">
                        Excelente
                    </small>
                </div>
            )}
        </Form.Group>
    );
}