import { useEffect, useState } from "react";
import { Alert, Form } from "react-bootstrap";
import { getEventosSeguimiento } from "../../services/seguimiento.service";

export default function ReservaEventoSelector({
    value,
    onChange,
    disabled,
    eventoInicial
}) {
    const [eventos, setEventos] = useState(
        eventoInicial ? [eventoInicial] : []
    );
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;
        getEventosSeguimiento()
            .then((datos) => {
                if (activo)
                    setEventos(
                        datos.filter(
                            (evento) =>
                                !["CANCELADO", "COMPLETADO"].includes(
                                    evento.estado
                                )
                        )
                    );
            })
            .catch(() => {
                if (activo)
                    setError(
                        "No fue posible cargar los eventos. Reabre el formulario para reintentar."
                    );
            });
        return () => {
            activo = false;
        };
    }, []);

    return (
        <Form.Group className="mb-3" controlId="reserva-evento">
            <Form.Label>Evento vinculado</Form.Label>
            {error && <Alert variant="warning">{error}</Alert>}
            <Form.Select
                value={value || ""}
                onChange={(event) =>
                    onChange(
                        eventos.find(
                            (item) => item.id === Number(event.target.value)
                        ) ?? null
                    )
                }
                disabled={disabled}
            >
                <option value="">Reserva manual sin evento</option>
                {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                        #{evento.id} · {evento.tipoEvento.nombre} ·{" "}
                        {new Date(evento.inicio).toLocaleDateString("es-CL")}
                    </option>
                ))}
            </Form.Select>
        </Form.Group>
    );
}
