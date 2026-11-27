import ActionButton from "../ActionButton";
import EventoImagen from "./EventoImagen";
import { Badge, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function EventoResumenCard({ evento, detalleUrl }) {
    return (
        <Card className="h-100 shadow-sm">
            <EventoImagen
                url={evento.imagen_url}
                heredada={evento.tipoEvento?.imagen_url}
                nombre={evento.nombre}
            />
            <Card.Body className="d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <Card.Title className="fw-bold mb-1">
                            {evento.nombre}
                        </Card.Title>

                        <small className="text-secondary">
                            Evento #{evento.id}
                        </small>
                    </div>

                    <Badge bg={evento.estadoVariant ?? "secondary"}>
                        {evento.estado}
                    </Badge>
                </div>

                <div className="text-secondary small mb-4">
                    {evento.fecha && (
                        <div className="mb-2">
                            <i className="bi bi-calendar3 me-2" />
                            {evento.fecha}
                        </div>
                    )}

                    {evento.lugar && (
                        <div>
                            <i className="bi bi-geo-alt me-2" />
                            {evento.lugar}
                        </div>
                    )}
                </div>

                <div className="table-actions mt-auto">
                    <ActionButton
                        icon="bi-eye"
                        label={`Ver detalles de ${evento.nombre}`}
                        as={Link}
                        to={detalleUrl}
                        variant="outline-primary"
                    />
                </div>
            </Card.Body>
        </Card>
    );
}
