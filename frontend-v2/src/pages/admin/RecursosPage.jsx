import { Link, useSearchParams } from "react-router-dom";
import { getEventoSeguimiento } from "../../services/seguimiento.service";
import { useEffect, useState } from "react";
import { Alert, Button, Container, Nav, Spinner } from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import RecursosPanel from "../../components/recursos/RecursosPanel";
import EspaciosPanel from "../../components/recursos/EspaciosPanel";
import VehiculosPanel from "../../components/recursos/VehiculosPanel";

export default function RecursosPage() {
    const [params] = useSearchParams();
    const eventoId = params.get("eventoId");
    return <ContenidoRecursos key={eventoId || "manual"} eventoId={eventoId} />;
}

function ContenidoRecursos({ eventoId }) {
    const [seccion, setSeccion] = useState("equipos");
    const [evento, setEvento] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(eventoId));
    useEffect(() => {
        let activo = true;
        if (eventoId) getEventoSeguimiento(eventoId).then(datos => {
            if (activo) setEvento(datos);
        }).catch(err => {
            if (activo) setError(err.response?.data?.error?.message ?? "No fue posible cargar el evento.");
        }).finally(() => { if (activo) setLoading(false); });
        return () => { activo = false; };
    }, [eventoId]);
    if (loading) return <Container className="py-5"><Spinner size="sm" /> Cargando evento...</Container>;
    if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="py-5">
            <PageHeader
                title="Recursos y espacios"
                description="Administra equipos, vehículos, recintos y sus reservas."
            />

            {evento && <Alert variant="info">Reservas para el evento #{evento.id} · {evento.tipoEvento.nombre}. <Button as={Link} to={`/admin/eventos/${evento.id}`} variant="link">Volver al evento</Button></Alert>}
            <Nav
                variant="tabs"
                activeKey={seccion}
                onSelect={key => key && setSeccion(key)}
                className="mb-4"
                aria-label="Secciones de recursos"
            >
                <Nav.Item>
                        <Nav.Link eventKey="equipos">
                        <i className="bi bi-box-seam me-2" />Recursos
                    </Nav.Link>
                </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="vehiculos">
                            <i className="bi bi-truck me-2" />Vehículos
                        </Nav.Link>
                    </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="espacios">
                        <i className="bi bi-building me-2" />Espacios
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {seccion === "equipos" ? <RecursosPanel eventoInicial={evento} /> : seccion === "vehiculos" ? <VehiculosPanel eventoInicial={evento} /> : <EspaciosPanel eventoInicial={evento} />}
        </Container>
    );
}
