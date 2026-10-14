import {
    Col,
    Container,
    Row
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import EventoResumenCard from "../../components/eventos/EventoResumenCard";

// Temporal: reemplazar por eventos del cliente desde el backend.
const eventos = [
    {
        id: 1,
        nombre: "Mi matrimonio",
        fecha: "24 de octubre de 2026",
        lugar: "Concepción",
        estado: "Confirmado",
        estadoVariant: "success"
    }
];

export default function MisEventosPage() {
    return (
        <Container className="py-5">
            <PageHeader
                title="Mis eventos"
                description="Consulta los eventos que has contratado."
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
                            detalleUrl={`/cliente/eventos/${evento.id}`}
                        />
                    </Col>
                ))}
            </Row>
        </Container>
    );
}