import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import EmptyState from "../EmptyState";
import ConfirmModal from "../ConfirmModal";
import TableToolbar from "../admin/TableToolbar";
import SolicitudFormulario from "./SolicitudFormulario";
import { listarSolicitudes, obtenerSolicitud, historialSolicitud, revisarSolicitud, cerrarSolicitud } from "../../services/solicitud.service";
import { estadosEvento, fechaSeguimiento, mensajeError } from "../eventos/seguimiento.utils";

const estados = { PENDIENTE: "Pendiente", EN_REVISION: "En revisión", CONTRATADA: "Contratada", RECHAZADA: "Rechazada" };
const etapa = s => s.evento ? estadosEvento[s.evento.estado] : s.tipoCierre === "RETIRO_CLIENTE" ? "Retirada" : estados[s.estado];
export default function SolicitudesPanel() {
    const { id } = useParams();
    return <Panel key={id ?? "lista"} id={id} />;
}
function Panel({ id }) {
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "ADMIN";
    const base = esAdmin ? "/admin/solicitudes" : "/cliente/solicitudes";
    const navigate = useNavigate();
    const [lista, setLista] = useState({ items: [], total: 0 });
    const [solicitud, setSolicitud] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [filtros, setFiltros] = useState({ buscar: "", estado: "" });
    const [consulta, setConsulta] = useState({ pagina: 1 });
    const [revision, setRevision] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [formulario, setFormulario] = useState(false);
    const [confirmacion, setConfirmacion] = useState("");
    const [motivo, setMotivo] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true); setError("");
            try {
                if (id) {
                    const [s, h] = await Promise.all([obtenerSolicitud(id), historialSolicitud(id)]);
                    if (activo) { setSolicitud(s); setHistorial(h); }
                } else {
                    const datos = await listarSolicitudes(Object.fromEntries(Object.entries(consulta).filter(([, v]) => v !== "")));
                    if (activo) setLista(datos);
                }
            } catch (err) { if (activo) setError(mensajeError(err, "No fue posible cargar las solicitudes.")); }
            finally { if (activo) setCargando(false); }
        }
        cargar(); return () => { activo = false; };
    }, [id, consulta, revision]);
    async function confirmar() {
        if (saving) return;
        if (confirmacion === "cierre" && motivo.trim().length < 3) return;
        setSaving(true); setError("");
        try {
            if (confirmacion === "revision") await revisarSolicitud(id);
            else await cerrarSolicitud(id, motivo.trim(), !esAdmin);
            setConfirmacion(""); setMensaje("Solicitud actualizada correctamente."); setRevision(v => v + 1);
        } catch (err) { setError(mensajeError(err, "No fue posible actualizar la solicitud.")); setConfirmacion(""); }
        finally { setSaving(false); }
    }
    const editable = solicitud && !solicitud.presupuestos.length && (esAdmin ? ["PENDIENTE", "EN_REVISION"].includes(solicitud.estado) : solicitud.estado === "PENDIENTE");
    return <Container className="py-5">
        <PageHeader title={id ? `Solicitud #${id}` : esAdmin ? "Solicitudes de eventos" : "Mis solicitudes"} description="Consulta y gestiona solicitudes previas a la contratación.">
            {id ? <Button as={Link} to={base} variant="outline-secondary">Volver a solicitudes</Button> : <Button onClick={() => setFormulario(true)}>Nueva solicitud</Button>}
        </PageHeader>
        {mensaje && <Alert variant="success" dismissible onClose={() => setMensaje("")}>{mensaje}</Alert>}
        {error && <Alert variant="danger">{error} <Button variant="link" onClick={() => setRevision(v => v + 1)}>Reintentar</Button></Alert>}
        {!id && <Form onSubmit={e => { e.preventDefault(); setConsulta({ ...filtros, pagina: 1 }); }}>
            <TableToolbar search={filtros.buscar} onSearchChange={buscar => setFiltros(v => ({ ...v, buscar }))} searchPlaceholder="Buscar por tipo o lugar..."
                estado={filtros.estado} onEstadoChange={estado => setFiltros(v => ({ ...v, estado }))} opcionesEstado={{ "": "Todos", ...estados }}>
                <div className="d-flex gap-2"><Button type="submit">Buscar</Button><Button variant="outline-secondary" onClick={() => { setFiltros({ buscar: "", estado: "" }); setConsulta({ pagina: 1 }); }}>Limpiar</Button></div>
            </TableToolbar>
        </Form>}
        {cargando ? <div role="status"><Spinner size="sm" /> Cargando solicitudes...</div> : !error && (id ? solicitud && <>
            <Card className="shadow-sm mb-4"><Card.Body className="p-4">
                <div className="d-flex justify-content-between gap-3"><h2 className="h4">{solicitud.tipoEvento.nombre}</h2><Badge bg={solicitud.evento ? "success" : "secondary"}>{etapa(solicitud)}</Badge></div>
                <p className="text-secondary">{fechaSeguimiento(solicitud.inicio)} — {fechaSeguimiento(solicitud.fin)}</p>
                <p>Asistentes estimados: {solicitud.asistentes}</p><p>Lugar preferido: {solicitud.lugar || "Por definir"}</p>
                {solicitud.observaciones && <p className="text-break" style={{ whiteSpace: "pre-wrap" }}>{solicitud.observaciones}</p>}
                {solicitud.motivoCierre && <Alert variant="secondary">{solicitud.motivoCierre}</Alert>}
                <div className="d-flex flex-wrap gap-2">
                    {editable && <Button variant="outline-primary" onClick={() => setFormulario(true)}>Editar solicitud</Button>}
                    {esAdmin && solicitud.estado === "PENDIENTE" && <Button onClick={() => setConfirmacion("revision")}>Iniciar revisión</Button>}
                    {(esAdmin ? ["PENDIENTE", "EN_REVISION"].includes(solicitud.estado) : solicitud.estado === "PENDIENTE") && <Button variant="outline-danger" onClick={() => { setMotivo(""); setConfirmacion("cierre"); }}>{esAdmin ? "Rechazar" : "Retirar solicitud"}</Button>}
                </div>
                {solicitud.presupuestos.length > 0 && !solicitud.evento && <Alert variant="info" className="mt-3 mb-0">Hay propuestas vinculadas. Los cambios sensibles y el cierre requieren verificación de Presupuestos.</Alert>}
            </Card.Body></Card>
            {solicitud.evento && <Card className="mb-4"><Card.Body><h2 className="h5">Evento contratado #{solicitud.evento.id}</h2>
                <p>{solicitud.evento.tipoEvento.nombre} · {solicitud.evento.lugar}</p><p>{fechaSeguimiento(solicitud.evento.inicio)} — {fechaSeguimiento(solicitud.evento.fin)}</p>
                {esAdmin && <Button as={Link} to={`/admin/eventos/${solicitud.evento.id}`} variant="outline-primary">Ver evento</Button>}
            </Card.Body></Card>}
            <h2 className="h5">Antecedentes comerciales</h2>
            {solicitud.presupuestos.length ? <ListGroup className="mb-4">{solicitud.presupuestos.map(p => <ListGroup.Item key={p.id}>Presupuesto #{p.id} · {p.estado}</ListGroup.Item>)}</ListGroup> : <p className="text-secondary">Sin propuestas vinculadas. La gestión de propuestas se conectará desde Presupuestos.</p>}
            <h2 className="h5">Historial de la solicitud</h2><ListGroup>{historial.map(h => <ListGroup.Item key={h.id}><strong>{h.accion.replaceAll("_", " ")}</strong><small className="d-block text-secondary">{fechaSeguimiento(h.createdAt)}</small>{h.motivo && <p className="mb-0">{h.motivo}</p>}</ListGroup.Item>)}</ListGroup>
        </> : <>
            {!lista.items.length ? <EmptyState icon="bi-inbox" title="Sin solicitudes" description="No hay solicitudes que coincidan con los filtros." /> : <Row className="g-4">{lista.items.map(s => <Col key={s.id} md={6} xl={4}><Card className="h-100 shadow-sm"><Card.Body className="p-4">
                <h2 className="h5">{s.tipoEvento.nombre}</h2><Badge bg="secondary">{etapa(s)}</Badge><p className="mt-3">{fechaSeguimiento(s.inicio)}</p><p>{s.lugar || "Lugar por definir"}</p>
                <Button as={Link} to={`${base}/${s.id}`} variant="outline-primary">Ver solicitud #{s.id}</Button>
            </Card.Body></Card></Col>)}</Row>}
            <div className="d-flex justify-content-between align-items-center mt-4"><Button variant="outline-secondary" disabled={consulta.pagina <= 1} onClick={() => setConsulta(v => ({ ...v, pagina: v.pagina - 1 }))}>Anterior</Button>
                <span>Página {consulta.pagina} · {lista.total} solicitudes</span><Button variant="outline-secondary" disabled={consulta.pagina * 20 >= lista.total} onClick={() => setConsulta(v => ({ ...v, pagina: v.pagina + 1 }))}>Siguiente</Button></div>
        </>)}
        {formulario && <SolicitudFormulario solicitud={id ? solicitud : null} esAdmin={esAdmin} onHide={() => setFormulario(false)} onGuardado={s => { setFormulario(false); if (!id) navigate(`${base}/${s.id}`); else { setMensaje("Solicitud guardada correctamente."); setRevision(v => v + 1); } }} />}
        <ConfirmModal show={Boolean(confirmacion)} onHide={() => !saving && setConfirmacion("")} onConfirm={confirmar} loading={saving}
            title={confirmacion === "revision" ? "Iniciar revisión" : esAdmin ? "Rechazar solicitud" : "Retirar solicitud"} confirmText="Confirmar" variant={confirmacion === "revision" ? "primary" : "danger"}>
            {confirmacion === "revision" ? <p>La solicitud pasará a En revisión y el cliente dejará de poder editarla.</p> : <Form.Group controlId="solicitud-motivo"><Form.Label>Motivo obligatorio (mínimo 3 caracteres)</Form.Label><Form.Control as="textarea" rows={3} maxLength={2000} value={motivo} onChange={e => setMotivo(e.target.value)} isInvalid={motivo.trim().length < 3} /><Form.Control.Feedback type="invalid">Ingresa el motivo para confirmar el cierre.</Form.Control.Feedback></Form.Group>}
        </ConfirmModal>
    </Container>;
}
