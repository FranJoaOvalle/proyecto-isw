import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function EventoProductorDetallePage() {
    const { id } = useParams();

    return (
        <Container className="py-5">
            <PageHeader
                title="Evento asignado"
                description={`Evento #${id}`}
            />

            <EmptyState
                icon="bi-calendar-check"
                title="Información del evento"
                description="Aquí se mostrará la información del evento asignado."
            />
        </Container>
    );
}