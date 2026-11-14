import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";
import EventoImagen from "../../components/eventos/EventoImagen";
import {
    estadosEvento,
    varianteEstado,
    fechaSeguimiento,
    direccionConComuna,
    mensajeError
} from "../../components/eventos/seguimiento.utils";
import { obtenerEventoCliente } from "../../services/eventoCliente.service";

export default function EventoClienteDetallePage() {
    const { id } = useParams();
    const { usuario } = useAuth();
    return <DetalleEvento key={`${usuario?.id}-${id}`} id={id} />;
}

function DetalleEvento({ id }) {
    const [evento, setEvento] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let activo = true;
        obtenerEventoCliente(id)
            .then((datos) => { if (activo) setEvento(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible consultar tu evento.")); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [id, revision]);

    function recargar() {
        setCargando(true);
        setError("");
        setRevision((actual) => actual + 1);
    }

    return (
        <Container className="py-5">
            <PageHeader title={evento?.tipoEvento?.nombre ?? "Mi evento"} description={`Evento #${id}`}>
                <Button as={Link} to="/cliente/eventos" variant="outline-secondary">Volver a mis eventos</Button>
            </PageHeader>
            {error ? (
                <Alert variant="danger">{error} <Button variant="link" onClick={recargar}>Reintentar</Button></Alert>
            ) : cargando ? (
                <div role="status"><Spinner size="sm" /> Cargando evento...</div>
            ) : evento && (
                <Row className="g-4">
                    <Col lg={8}>
                        <Card className="shadow-sm">
                            <EventoImagen url={evento.imagen_url} heredada={evento.tipoEvento?.imagen_url}
                                nombre={evento.tipoEvento?.nombre ?? "Evento"} />
                            <Card.Body className="p-4">
                                <Badge bg={varianteEstado[evento.estado] ?? "secondary"} className="mb-3">
                                    {estadosEvento[evento.estado] ?? evento.estado}
                                </Badge>
                                <Row className="g-3">
                                    <Col sm={6}>
                                        <small className="d-block text-body-secondary">Inicio</small>
                                        <span>{fechaSeguimiento(evento.inicio)}</span>
                                    </Col>
                                    <Col sm={6}>
                                        <small className="d-block text-body-secondary">Término</small>
                                        <span>{fechaSeguimiento(evento.fin)}</span>
                                    </Col>
                                    <Col sm={6}>
                                        <small className="d-block text-body-secondary">Lugar</small>
                                        <span>{evento.lugar}</span>
                                    </Col>
                                    <Col sm={6}>
                                        <small className="d-block text-body-secondary">Asistentes</small>
                                        <span>{evento.asistentes} personas</span>
                                    </Col>
                                </Row>
                                <div className="border-top mt-4 pt-3">
                                    <small className="d-block text-body-secondary">Dirección</small>
                                    <p className="mb-0">{evento.direccion
                                        ? direccionConComuna(evento.direccion, evento.comuna)
                                        : "Ubicación por confirmar"}</p>
                                    {evento.referenciaDireccion && <>
                                        <small className="d-block text-body-secondary mt-3">Referencias de acceso</small>
                                        <p className="mb-0 text-break">{evento.referenciaDireccion}</p>
                                    </>}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="shadow-sm">
                            <Card.Body className="p-4">
                                <h2 className="h5 mb-3">Organización de tu evento</h2>
                                <small className="d-block text-body-secondary">Productor asignado</small>
                                <p className="mb-4">{evento.productor
                                    ? [evento.productor.nombres, evento.productor.apellidos].filter(Boolean).join(" ")
                                    : "Sin productor asignado"}</p>
                                <div className="d-grid gap-2 border-top pt-3">
                                    {evento.solicitudId && (
                                        <Button as={Link} to={`/cliente/solicitudes/${evento.solicitudId}`} variant="outline-primary">Ver solicitud original</Button>
                                    )}
                                    <Button as={Link} to={evento.solicitudId ? `/cliente/compra?solicitudId=${evento.solicitudId}` : "/cliente/compra"}
                                        variant="outline-primary">Ver antecedentes comerciales</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}
