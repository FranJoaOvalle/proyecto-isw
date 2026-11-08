import AsignarProductor from "./AsignarProductor";
import EventoImagen from "./EventoImagen";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import EventoAcciones from "./EventoAcciones";
import SeguimientoPanel from "./SeguimientoPanel";
import { getEventoSeguimiento } from "../../services/seguimiento.service";
import { estadosEvento, varianteEstado, fechaSeguimiento, mensajeError } from "./seguimiento.utils";

export default function EventoSeguimientoDetalle() {
    const { id } = useParams();
    return <Detalle key={id} id={id} />;
}

function Detalle({ id }) {
    const { usuario } = useAuth();
    const [evento, setEvento] = useState(null);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const [revision, setRevision] = useState(0);
    const base = usuario?.rol === "ADMIN" ? "/admin" : "/productor";
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true); setError("");
            try {
                const datos = await getEventoSeguimiento(id);
                if (activo) setEvento(datos);
            } catch (err) { if (activo) setError(mensajeError(err, "No fue posible cargar el evento.")); }
            finally { if (activo) setCargando(false); }
        }
        cargar();
        return () => { activo = false; };
    }, [id, revision]);
    return <Container className="py-5">
        <PageHeader title="Detalle del evento" description={`Evento #${id}`}>
            <Button as={Link} to={`${base}/eventos`} variant="outline-secondary">Volver a eventos</Button>
        </PageHeader>
        {cargando ? <div role="status"><Spinner size="sm" /> Cargando evento...</div>
            : error ? <Alert variant="danger">{error} <Button variant="link" onClick={() => setRevision(v => v + 1)}>Reintentar</Button></Alert>
            : evento && <>
                <Card className="shadow-sm mb-4"><EventoImagen url={evento.imagen_url} heredada={evento.tipoEvento?.imagen_url} nombre={evento.tipoEvento.nombre} /><Card.Body className="p-4">
                    <div className="d-flex justify-content-between gap-3 mb-3"><h2 className="h4">{evento.tipoEvento.nombre}</h2>
                        <Badge bg={varianteEstado[evento.estado]} className="align-self-start">{estadosEvento[evento.estado]}</Badge></div>
                    <Row className="g-3">
                        <Col md={6}><strong>Inicio:</strong> {fechaSeguimiento(evento.inicio)}</Col>
                        <Col md={6}><strong>Término:</strong> {fechaSeguimiento(evento.fin)}</Col>
                        <Col md={6}><strong>Lugar:</strong> {evento.lugar}</Col>
                        <Col md={6}><strong>Asistentes:</strong> {evento.asistentes}</Col>
                        <Col md={6}><strong>Productor:</strong> {evento.productor ? `${evento.productor.nombres} ${evento.productor.apellidos}` : "Sin productor asignado"}</Col>
                        <Col md={6}><strong>Cliente:</strong> {evento.cliente.empresa?.razonSocial || `${evento.cliente.persona?.nombres || ""} ${evento.cliente.persona?.apellidos || ""}`}</Col>
                    </Row>
                    {evento.observaciones && <p className="mt-3 mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{evento.observaciones}</p>}
                    {usuario?.rol === "ADMIN" && <AsignarProductor evento={evento} onCambio={() => getEventoSeguimiento(id).then(setEvento).catch(err => setError(mensajeError(err, "No fue posible actualizar el evento.")))} />}
                    {usuario?.rol === "ADMIN" && <EventoAcciones evento={evento} onCambio={() => getEventoSeguimiento(id).then(setEvento).catch(err => setError(mensajeError(err, "No fue posible actualizar el evento.")))} />}
                </Card.Body></Card>
                <SeguimientoPanel eventoId={id} />
            </>}
    </Container>;
}
