import { useState } from "react";
import { Card } from "react-bootstrap";

export default function EventoImagen({ url, nombre }) {
    const [fallida, setFallida] = useState(null);
    return url && fallida !== url
        ? <Card.Img variant="top" src={url} alt={`Imagen de ${nombre}`} style={{ height: 220, objectFit: "cover" }} onError={() => setFallida(url)} />
        : <div className="d-flex align-items-center justify-content-center bg-body-tertiary" style={{ height: 220 }}><i className="bi bi-calendar-event fs-1 text-secondary" aria-label="Evento sin imagen" /></div>;
}
