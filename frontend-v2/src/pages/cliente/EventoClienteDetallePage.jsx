import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function EventoClienteDetallePage() {
    const { id } = useParams();

    return (
        <Container className="py-5">
            <PageHeader
                title="Mi evento"
                description={`Evento #${id}`}
            />

            <EmptyState
                icon="bi-calendar-heart"
                title="Información de tu evento"
                description="Aquí podrás consultar el estado y los detalles de tu evento."
            />
        </Container>
    );
}