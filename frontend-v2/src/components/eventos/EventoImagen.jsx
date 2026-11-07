import { useState } from "react";
import { Card } from "react-bootstrap";

export default function EventoImagen({ url, heredada, nombre }) {
    const [fallidas, setFallidas] = useState([]);
    const imagen = [url, heredada].find(valor => valor && !fallidas.includes(valor));
    return imagen
        ? <Card.Img variant="top" src={imagen} alt={`Imagen de ${nombre}`} style={{ height: 220, objectFit: "cover" }} onError={() => setFallidas(actual => [...actual, imagen])} />
        : <div className="d-flex align-items-center justify-content-center bg-body-tertiary" style={{ height: 220 }}><i className="bi bi-calendar-event fs-1 text-secondary" aria-label="Evento sin imagen" /></div>;
}
