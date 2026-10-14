import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function EventoDetallePage() {
    const { id } = useParams();

    return (
        <Container className="py-5">
            <PageHeader
                title="Detalle del evento"
                description={`Evento #${id}`}
            />

            <EmptyState
                icon="bi-calendar-event"
                title="Detalle del evento"
                description="La información del evento se mostrará aquí."
            />
        </Container>
    );
}