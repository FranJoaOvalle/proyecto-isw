import {
    Col,
    Container,
    Row
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import EventoResumenCard from "../../components/eventos/EventoResumenCard";

// Temporal: reemplazar por eventos asignados desde el backend.
const eventos = [
    {
        id: 1,
        nombre: "Matrimonio Pérez",
        fecha: "24 de octubre de 2026",
        lugar: "Concepción",
        estado: "Asignado",
        estadoVariant: "primary"
    }
];

export default function EventosProductorPage() {
    return (
        <Container className="py-5">
            <PageHeader
                title="Eventos asignados"
                description="Consulta los eventos que tienes asignados."
            />

            <Row className="g-4">
                {eventos.map((evento) => (
                    <Col
                        key={evento.id}
                        md={6}
                        xl={4}
                    >
                        <EventoResumenCard
                            evento={evento}
                            detalleUrl={`/productor/eventos/${evento.id}`}
                        />
                    </Col>
                ))}
            </Row>
        </Container>
    );
}