import { useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import EmptyState from "../EmptyState";
import EventoResumenCard from "./EventoResumenCard";
import { getEventosSeguimiento } from "../../services/seguimiento.service";
import { estadosEvento, varianteEstado, fechaSeguimiento, mensajeError } from "./seguimiento.utils";

export default function EventosSeguimientoLista() {
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "ADMIN";
    const [eventos, setEventos] = useState([]);
    const [filtros, setFiltros] = useState({ buscar: "", estado: "" });
    const [consulta, setConsulta] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true); setError("");
            try {
                const datos = await getEventosSeguimiento(consulta);
                if (activo) setEventos(datos);
            } catch (err) { if (activo) setError(mensajeError(err, "No fue posible cargar los eventos.")); }
            finally { if (activo) setCargando(false); }
        }
        cargar();
        return () => { activo = false; };
    }, [consulta]);
    return <Container className="py-5">
        <PageHeader title={esAdmin ? "Eventos" : "Eventos asignados"} description={esAdmin ? "Consulta los eventos registrados y su seguimiento." : "Consulta el seguimiento de los eventos que tienes asignados."} />
        <Form className="mb-4" onSubmit={e => { e.preventDefault(); setConsulta(Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))); }}>
            <Row className="g-3 align-items-end">
                <Col md={6}><Form.Group controlId="eventos-buscar"><Form.Label>Buscar por tipo de evento o lugar</Form.Label>
                    <Form.Control maxLength={200} value={filtros.buscar} onChange={e => setFiltros({ ...filtros, buscar: e.target.value })} />
                </Form.Group></Col>
                <Col md={3}><Form.Group controlId="eventos-estado"><Form.Label>Estado</Form.Label>
                    <Form.Select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}><option value="">Todos</option>
                        {Object.entries(estadosEvento).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </Form.Select></Form.Group></Col>
                <Col md={3} className="d-flex gap-2"><Button type="submit">Buscar</Button><Button variant="outline-secondary" onClick={() => { setFiltros({ buscar: "", estado: "" }); setConsulta({}); }}>Limpiar</Button></Col>
            </Row>
        </Form>
        {error ? <Alert variant="danger">{error} <Button variant="link" onClick={() => setConsulta({ ...consulta })}>Reintentar</Button></Alert>
            : cargando ? <div role="status"><Spinner size="sm" /> Cargando eventos...</div>
            : eventos.length === 0 ? <EmptyState icon="bi-calendar-event" title="Sin eventos" description="No hay eventos que coincidan con los filtros actuales." />
            : <Row className="g-4">{eventos.map(evento => <Col key={evento.id} md={6} xl={4}>
                <EventoResumenCard evento={{ ...evento, nombre: evento.tipoEvento.nombre, fecha: fechaSeguimiento(evento.inicio), estado: estadosEvento[evento.estado], estadoVariant: varianteEstado[evento.estado] }}
                    detalleUrl={`/${esAdmin ? "admin" : "productor"}/eventos/${evento.id}`} />
            </Col>)}</Row>}
    </Container>;
}
