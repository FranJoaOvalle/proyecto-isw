import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    ListGroup,
    Row,
    Spinner
} from "react-bootstrap";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import EmptyState from "../EmptyState";
import ConfirmModal from "../ConfirmModal";
import NotificacionToast from "../NotificacionToast";
import TableToolbar from "../admin/TableToolbar";
import SolicitudFormulario from "./SolicitudFormulario";
import { estadoPropuestaCliente, nombresEstadoPresupuesto, propuestaVigente } from "../presupuestos/presupuesto.utils";
import {
    listarSolicitudes,
    obtenerSolicitud,
    historialSolicitud,
    revisarSolicitud,
    cerrarSolicitud
} from "../../services/solicitud.service";
import {
    estadosEvento,
    varianteEstado,
    fechaSeguimiento,
    direccionConComuna,
    mensajeError
} from "../eventos/seguimiento.utils";

const estados = {
    PENDIENTE: "Pendiente",
    EN_REVISION: "En revisión",
    CONTRATADA: "Contratada",
    RECHAZADA: "Rechazada"
};
const accionesHistorial = {
    CREACION: "Solicitud creada",
    EDICION: "Solicitud editada",
    INICIO_REVISION: "Revisión iniciada",
    ENVIO_PROPUESTA: "Propuesta enviada",
    FORMALIZACION: "Contratación confirmada",
    CANCELACION_PROPUESTA: "Propuesta cancelada",
    VENCIMIENTO_PROPUESTAS: "Propuestas vencidas",
    INVALIDACION_BORRADORES: "Borradores invalidados",
    RETIRO_CLIENTE: "Solicitud retirada",
    RECHAZO_ADMIN: "Solicitud rechazada"
};
const etapa = (s, esAdmin) =>
    s.evento
        ? estadosEvento[s.evento.estado]
        : s.tipoCierre === "RETIRO_CLIENTE"
          ? "Retirada"
          : !esAdmin && s.estado === "EN_REVISION" && s.presupuestos.some(propuestaVigente)
            ? "Propuesta recibida"
            : estados[s.estado];
export default function SolicitudesPanel() {
    const { id } = useParams();
    const { usuario } = useAuth();
    const { state } = useLocation();
    const tipoEventoId = state?.tipoEventoId;
    return (
        <Panel
            key={`${usuario?.id}-${usuario?.rol}-${id ?? `lista-${tipoEventoId ?? ""}`}`}
            id={id}
            tipoEventoId={tipoEventoId}
        />
    );
}
function Panel({ id, tipoEventoId }) {
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
    const [formulario, setFormulario] = useState(
        !id && !esAdmin && Number.isInteger(tipoEventoId) && tipoEventoId > 0
    );
    const [confirmacion, setConfirmacion] = useState("");
    const [motivo, setMotivo] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true);
            setError("");
            try {
                if (id) {
                    const [s, h] = await Promise.all([
                        obtenerSolicitud(id),
                        historialSolicitud(id)
                    ]);
                    if (activo) {
                        setSolicitud(s);
                        setHistorial(h);
                    }
                } else {
                    const datos = await listarSolicitudes(consulta);
                    if (activo) setLista(datos);
                }
            } catch (err) {
                if (activo)
                    setError(
                        mensajeError(
                            err,
                            "No fue posible cargar las solicitudes."
                        )
                    );
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => {
            activo = false;
        };
    }, [id, consulta, revision]);
    async function confirmar() {
        if (saving) return;
        if (confirmacion === "cierre" && motivo.trim().length < 3) return;
        setSaving(true);
        setError("");
        try {
            if (confirmacion === "revision") await revisarSolicitud(id);
            else await cerrarSolicitud(id, motivo.trim(), !esAdmin);
            setConfirmacion("");
            setMensaje("Solicitud actualizada correctamente.");
            setRevision((v) => v + 1);
        } catch (err) {
            setError(
                mensajeError(err, "No fue posible actualizar la solicitud.")
            );
            setConfirmacion("");
        } finally {
            setSaving(false);
        }
    }
    const editable =
        solicitud &&
        (esAdmin
            ? solicitud.presupuestos.every((p) => ["BORRADOR", "CANCELADO", "VENCIDO"].includes(p.estado) ||
                (p.estado === "ENVIADO" && p.venceAt && new Date(p.venceAt) <= new Date()))
            : !solicitud.presupuestos.length) &&
        (esAdmin
            ? ["PENDIENTE", "EN_REVISION"].includes(solicitud.estado)
            : solicitud.estado === "PENDIENTE");
    return (
        <Container className="py-5">
            <PageHeader
                title={
                    id
                        ? `Solicitud #${id}`
                        : esAdmin
                          ? "Solicitudes de eventos"
                          : "Mis solicitudes"
                }
                description="Consulta los datos, propuestas y avances de cada solicitud."
            >
                {!esAdmin && <Button variant="outline-primary" className="me-2" disabled={cargando || saving}
                    onClick={() => setRevision((valor) => valor + 1)}>Actualizar</Button>}
                {id ? (
                    <Button
                        as={Link}
                        to={base}
                        variant="outline-secondary"
                    >
                        Volver a solicitudes
                    </Button>
                ) : (
                    <Button onClick={() => setFormulario(true)}>
                        Nueva solicitud
                    </Button>
                )}
            </PageHeader>
            <NotificacionToast mensaje={mensaje} onClose={() => setMensaje("")} />
            {error && (
                <Alert variant="danger">
                    {error}{" "}
                    <Button
                        variant="link"
                        onClick={() => setRevision((v) => v + 1)}
                    >
                        Reintentar
                    </Button>
                </Alert>
            )}
            {!id && (
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setConsulta({
                            pagina: 1,
                            ...(filtros.buscar.trim() ? { buscar: filtros.buscar.trim() } : {}),
                            ...(filtros.estado ? { estado: filtros.estado } : {})
                        });
                    }}
                >
                    <TableToolbar
                        search={filtros.buscar}
                        onSearchChange={(buscar) =>
                            setFiltros((v) => ({ ...v, buscar }))
                        }
                        searchPlaceholder="Buscar por tipo o lugar..."
                        estado={filtros.estado}
                        onEstadoChange={(estado) =>
                            setFiltros((v) => ({ ...v, estado }))
                        }
                        opcionesEstado={{ "": "Todos", ...estados }}
                    >
                        <div className="d-flex gap-2">
                            <Button type="submit">Buscar</Button>
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setFiltros({ buscar: "", estado: "" });
                                    setConsulta({ pagina: 1 });
                                }}
                            >
                                Limpiar
                            </Button>
                        </div>
                    </TableToolbar>
                </Form>
            )}
            {cargando ? (
                <div role="status">
                    <Spinner size="sm" /> Cargando solicitudes...
                </div>
            ) : (
                !error &&
                (id ? (
                    solicitud && (
                        <>
                            <Card className="shadow-sm mb-4">
                                <Card.Body className="p-4">
                                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                                        <h2 className="h4 mb-0">
                                            {solicitud.tipoEvento.nombre}
                                        </h2>
                                        <Badge bg={solicitud.evento
                                            ? varianteEstado[solicitud.evento.estado] ?? "secondary"
                                            : "secondary"}>
                                            {etapa(solicitud, esAdmin)}
                                        </Badge>
                                    </div>
                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <small className="d-block text-body-secondary">Inicio</small>
                                            <span>{fechaSeguimiento(solicitud.inicio)}</span>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="d-block text-body-secondary">Término</small>
                                            <span>{fechaSeguimiento(solicitud.fin)}</span>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="d-block text-body-secondary">Asistentes estimados</small>
                                            <span>{solicitud.asistentes} personas</span>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="d-block text-body-secondary">Lugar preferido</small>
                                            <span>{solicitud.lugar || "Por definir"}</span>
                                        </Col>
                                    </Row>
                                    {solicitud.observaciones && (
                                        <div className="border-top mt-4 pt-3">
                                            <small className="d-block text-body-secondary">Observaciones</small>
                                            <p className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>
                                                {solicitud.observaciones}
                                            </p>
                                        </div>
                                    )}
                                    {solicitud.motivoCierre && (
                                        <Alert variant="secondary">
                                            {solicitud.motivoCierre}
                                        </Alert>
                                    )}
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        {editable && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() =>
                                                    setFormulario(true)
                                                }
                                            >
                                                Editar solicitud
                                            </Button>
                                        )}
                                        {esAdmin &&
                                            solicitud.estado ===
                                                "PENDIENTE" && (
                                                <Button
                                                    onClick={() =>
                                                        setConfirmacion(
                                                            "revision"
                                                        )
                                                    }
                                                >
                                                    Iniciar revisión
                                                </Button>
                                            )}
                                        {(esAdmin
                                            ? [
                                                  "PENDIENTE",
                                                  "EN_REVISION"
                                              ].includes(solicitud.estado)
                                            : solicitud.estado ===
                                              "PENDIENTE") && (
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => {
                                                    setMotivo("");
                                                    setConfirmacion("cierre");
                                                }}
                                            >
                                                {esAdmin
                                                    ? "Rechazar"
                                                    : "Retirar solicitud"}
                                            </Button>
                                        )}
                                    </div>
                                    {solicitud.presupuestos.length > 0 &&
                                        !solicitud.evento && (
                                            <Alert
                                                variant="info"
                                                className="mt-3 mb-0"
                                            >
                                                Hay propuestas vinculadas. Los
                                                cambios sensibles y el cierre
                                                requieren verificación de
                                                Presupuestos.
                                            </Alert>
                                        )}
                                </Card.Body>
                            </Card>
                            {solicitud.evento && (
                                <Card className="shadow-sm mb-4">
                                    <Card.Body className="p-4">
                                        <h2 className="h5 mb-3">
                                            Evento contratado #
                                            {solicitud.evento.id}
                                        </h2>
                                        <Row className="g-3">
                                            <Col sm={6}>
                                                <small className="d-block text-body-secondary">Tipo de evento</small>
                                                <span>{solicitud.evento.tipoEvento.nombre}</span>
                                            </Col>
                                            <Col sm={6}>
                                                <small className="d-block text-body-secondary">Recinto</small>
                                                <span>{solicitud.evento.lugar}</span>
                                                {solicitud.evento.direccion &&
                                                    <small className="d-block text-body-secondary">{direccionConComuna(solicitud.evento.direccion, solicitud.evento.comuna)}</small>}
                                            </Col>
                                            <Col sm={6}>
                                                <small className="d-block text-body-secondary">Inicio</small>
                                                <span>{fechaSeguimiento(solicitud.evento.inicio)}</span>
                                            </Col>
                                            <Col sm={6}>
                                                <small className="d-block text-body-secondary">Término</small>
                                                <span>{fechaSeguimiento(solicitud.evento.fin)}</span>
                                            </Col>
                                        </Row>
                                        <Button as={Link}
                                            to={`/${esAdmin ? "admin" : "cliente"}/eventos/${solicitud.evento.id}`}
                                            variant="outline-primary" className="mt-3">
                                            Ver evento
                                        </Button>
                                    </Card.Body>
                                </Card>
                            )}
                            <Card className="shadow-sm mb-4">
                                <Card.Body className="p-4">
                                    <h2 className="h5 mb-3">Antecedentes comerciales</h2>
                                    {solicitud.presupuestos.length ? (
                                        <ListGroup variant="flush" className="mb-3">
                                            {solicitud.presupuestos.map((p) => (
                                                <ListGroup.Item key={p.id} className="px-0">
                                                    Presupuesto #{p.id} · {esAdmin ? nombresEstadoPresupuesto[p.estado] ?? p.estado : estadoPropuestaCliente(p)}
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <p className="text-body-secondary mb-3">
                                            Aún no hay propuestas vinculadas a esta solicitud.
                                        </p>
                                    )}
                                    <Button as={Link} to={esAdmin ? "/admin/presupuestos" : `/cliente/compra?solicitudId=${solicitud.id}`}
                                        variant="outline-primary">
                                        {esAdmin ? "Gestionar presupuestos" : "Revisar propuestas"}
                                    </Button>
                                </Card.Body>
                            </Card>
                            <Card className="shadow-sm">
                                <Card.Body className="p-4">
                                    <h2 className="h5 mb-3">Historial de la solicitud</h2>
                                    <ListGroup variant="flush">
                                        {historial.map((h) => (
                                            <ListGroup.Item key={h.id} className="px-0">
                                                <strong>{accionesHistorial[h.accion] ?? h.accion.replaceAll("_", " ")}</strong>
                                                <small className="d-block text-body-secondary">{fechaSeguimiento(h.createdAt)}</small>
                                                {h.motivo && <p className="mb-0 mt-1">{h.motivo}</p>}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </>
                    )
                ) : (
                    <>
                        {!lista.items.length ? (
                            <EmptyState
                                icon="bi-inbox"
                                title="Sin solicitudes"
                                description="No hay solicitudes que coincidan con los filtros."
                            />
                        ) : (
                            <Row className="g-4">
                                {lista.items.map((s) => (
                                    <Col
                                        key={s.id}
                                        md={6}
                                        xl={4}
                                    >
                                        <Card className="h-100 shadow-sm">
                                            <Card.Body className="p-4">
                                                <h2 className="h5">
                                                    {s.tipoEvento.nombre}
                                                </h2>
                                                <Badge bg={s.evento
                                                    ? varianteEstado[s.evento.estado] ?? "secondary"
                                                    : "secondary"}>
                                                    {etapa(s, esAdmin)}
                                                </Badge>
                                                <p className="mt-3">
                                                    {fechaSeguimiento(s.inicio)}
                                                </p>
                                                <p>
                                                    {s.lugar ||
                                                        "Lugar por definir"}
                                                </p>
                                                <Button
                                                    as={Link}
                                                    to={`${base}/${s.id}`}
                                                    variant="outline-primary"
                                                >
                                                    Ver solicitud #{s.id}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <Button
                                variant="outline-secondary"
                                disabled={consulta.pagina <= 1}
                                onClick={() =>
                                    setConsulta((v) => ({
                                        ...v,
                                        pagina: v.pagina - 1
                                    }))
                                }
                            >
                                Anterior
                            </Button>
                            <span>
                                Página {consulta.pagina} · {lista.total}{" "}
                                solicitudes
                            </span>
                            <Button
                                variant="outline-secondary"
                                disabled={consulta.pagina * 20 >= lista.total}
                                onClick={() =>
                                    setConsulta((v) => ({
                                        ...v,
                                        pagina: v.pagina + 1
                                    }))
                                }
                            >
                                Siguiente
                            </Button>
                        </div>
                    </>
                ))
            )}
            {formulario && (
                <SolicitudFormulario
                    tipoEventoIdInicial={!esAdmin ? tipoEventoId : undefined}
                    solicitud={id ? solicitud : null}
                    esAdmin={esAdmin}
                    onHide={() => setFormulario(false)}
                    onGuardado={(s) => {
                        setFormulario(false);
                        if (!id) navigate(`${base}/${s.id}`);
                        else {
                            setMensaje("Solicitud guardada correctamente.");
                            setRevision((v) => v + 1);
                        }
                    }}
                />
            )}
            <ConfirmModal
                show={Boolean(confirmacion)}
                onHide={() => !saving && setConfirmacion("")}
                onConfirm={confirmar}
                loading={saving}
                title={
                    confirmacion === "revision"
                        ? "Iniciar revisión"
                        : esAdmin
                          ? "Rechazar solicitud"
                          : "Retirar solicitud"
                }
                confirmText="Confirmar"
                variant={confirmacion === "revision" ? "primary" : "danger"}
            >
                {confirmacion === "revision" ? (
                    <p>
                        La solicitud pasará a En revisión y el cliente dejará de
                        poder editarla.
                    </p>
                ) : (
                    <Form.Group controlId="solicitud-motivo">
                        <Form.Label>
                            Motivo obligatorio (mínimo 3 caracteres)
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            maxLength={2000}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            isInvalid={motivo.trim().length < 3}
                        />
                        <Form.Control.Feedback type="invalid">
                            Ingresa el motivo para confirmar el cierre.
                        </Form.Control.Feedback>
                    </Form.Group>
                )}
            </ConfirmModal>
        </Container>
    );
}
