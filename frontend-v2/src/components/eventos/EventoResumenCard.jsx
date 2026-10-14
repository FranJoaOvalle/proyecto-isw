import { Badge, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function EventoResumenCard({evento, detalleUrl}) {
    return (
        <Card className="h-100 shadow-sm">
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

                <div className="mt-auto">
                    <Button
                        as={Link}
                        to={detalleUrl}
                        variant="outline-primary"
                        className="w-100"
                    >
                        Ver detalle
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}