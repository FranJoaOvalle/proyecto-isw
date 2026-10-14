import {
    Col,
    Container,
    Row
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import EventoResumenCard from "../../components/eventos/EventoResumenCard";

// Temporal: reemplazar por datos del backend.
const eventos = [
    {
        id: 1,
        nombre: "Matrimonio Pérez",
        fecha: "24 de octubre de 2026",
        lugar: "Concepción",
        estado: "Confirmado",
        estadoVariant: "success"
    },
    {
        id: 2,
        nombre: "Aniversario Empresa",
        fecha: "8 de noviembre de 2026",
        lugar: "San Pedro de la Paz",
        estado: "Pendiente",
        estadoVariant: "warning"
    }
];

export default function EventosPage() {
    return (
        <Container className="py-5">
            <PageHeader
                title="Eventos"
                description="Consulta y administra los eventos registrados."
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
                            detalleUrl={`/admin/eventos/${evento.id}`}
                        />
                    </Col>
                ))}
            </Row>
        </Container>
    );
}