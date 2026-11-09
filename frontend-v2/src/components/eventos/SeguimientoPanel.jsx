import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    ListGroup,
    Modal,
    Row,
    Spinner
} from "react-bootstrap";
import EmptyState from "../EmptyState";
import {
    getSeguimientos,
    getAutoresSeguimiento,
    crearSeguimiento,
    getComentariosSeguimiento,
    comentarSeguimiento
} from "../../services/seguimiento.service";
import {
    tiposSeguimiento,
    importanciasSeguimiento,
    nombreAutor,
    fechaSeguimiento,
    mensajeError,
    parametrosSeguimiento
} from "./seguimiento.utils";

const filtrosVacios = {
    buscar: "",
    tipo: "",
    importancia: "",
    usuarioId: "",
    desde: "",
    hasta: ""
};
const registroVacio = { descripcion: "", tipo: "NOVEDAD", importancia: "BAJA" };

export default function SeguimientoPanel({ eventoId }) {
    const [registros, setRegistros] = useState([]);
    const [autores, setAutores] = useState([]);
    const [filtros, setFiltros] = useState(filtrosVacios);
    const [consulta, setConsulta] = useState(filtrosVacios);
    const [revision, setRevision] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [mostrar, setMostrar] = useState(false);
    const [form, setForm] = useState(registroVacio);
    const [validated, setValidated] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorFormulario, setErrorFormulario] = useState("");
    const [seleccionado, setSeleccionado] = useState(null);

    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true);
            setError("");
            try {
                const [historial, usuarios] = await Promise.all([
                    getSeguimientos(eventoId, parametrosSeguimiento(consulta)),
                    getAutoresSeguimiento(eventoId)
                ]);
                if (activo) {
                    setRegistros(historial);
                    setAutores(usuarios);
                }
            } catch (err) {
                if (activo)
                    setError(
                        mensajeError(
                            err,
                            "No fue posible cargar el seguimiento."
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
    }, [eventoId, consulta, revision]);

    async function guardar(event) {
        event.preventDefault();
        setValidated(true);
        if (
            !event.currentTarget.checkValidity() ||
            !form.descripcion.trim() ||
            guardando
        )
            return;
        setGuardando(true);
        setErrorFormulario("");
        try {
            await crearSeguimiento(eventoId, form);
            setMostrar(false);
            setMensaje("Acontecimiento registrado correctamente.");
            setRevision((value) => value + 1);
        } catch (err) {
            setErrorFormulario(
                mensajeError(err, "No fue posible registrar el acontecimiento.")
            );
        } finally {
            setGuardando(false);
        }
    }

    const cambiarFiltro = (campo, valor) =>
        setFiltros((actual) => ({ ...actual, [campo]: valor }));
    return (
        <section aria-label="Seguimiento del evento">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h4 mb-0">Seguimiento</h2>
                <Button
                    onClick={() => {
                        setForm(registroVacio);
                        setValidated(false);
                        setErrorFormulario("");
                        setMostrar(true);
                    }}
                >
                    <i className="bi bi-plus-lg me-2" />
                    Registrar acontecimiento
                </Button>
            </div>
            {mensaje && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setMensaje("")}
                >
                    {mensaje}
                </Alert>
            )}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Form
                        onSubmit={(event) => {
                            event.preventDefault();
                            setConsulta({ ...filtros });
                        }}
                    >
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="seguimiento-buscar">
                                    <Form.Label>
                                        Buscar en la descripción
                                    </Form.Label>
                                    <Form.Control
                                        value={filtros.buscar}
                                        maxLength={200}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "buscar",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Palabras clave"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="seguimiento-tipo">
                                    <Form.Label>Tipo</Form.Label>
                                    <Form.Select
                                        value={filtros.tipo}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "tipo",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">Todos</option>
                                        {Object.entries(tiposSeguimiento).map(
                                            ([key, label]) => (
                                                <option
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </option>
                                            )
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="seguimiento-importancia">
                                    <Form.Label>Importancia</Form.Label>
                                    <Form.Select
                                        value={filtros.importancia}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "importancia",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">Todas</option>
                                        {Object.entries(
                                            importanciasSeguimiento
                                        ).map(([key, label]) => (
                                            <option
                                                key={key}
                                                value={key}
                                            >
                                                {label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="seguimiento-autor">
                                    <Form.Label>Autor</Form.Label>
                                    <Form.Select
                                        value={filtros.usuarioId}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "usuarioId",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">Todos</option>
                                        {autores.map((autor) => (
                                            <option
                                                key={autor.id}
                                                value={autor.id}
                                            >
                                                {nombreAutor(autor)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="seguimiento-desde">
                                    <Form.Label>Desde</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filtros.desde}
                                        max={filtros.hasta || undefined}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "desde",
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="seguimiento-hasta">
                                    <Form.Label>Hasta</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filtros.hasta}
                                        min={filtros.desde || undefined}
                                        onChange={(e) =>
                                            cambiarFiltro(
                                                "hasta",
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col className="d-flex gap-2">
                                <Button type="submit">Aplicar filtros</Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setFiltros(filtrosVacios);
                                        setConsulta({ ...filtrosVacios });
                                    }}
                                >
                                    Limpiar
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
            {error ? (
                <Alert variant="danger">
                    {error}{" "}
                    <Button
                        variant="link"
                        onClick={() => setRevision((v) => v + 1)}
                    >
                        Reintentar
                    </Button>
                </Alert>
            ) : cargando ? (
                <div
                    className="text-center py-4"
                    role="status"
                >
                    <Spinner size="sm" /> Cargando seguimiento...
                </div>
            ) : registros.length === 0 ? (
                <EmptyState
                    icon="bi-journal-text"
                    title="Sin acontecimientos"
                    description="No hay registros que coincidan con los filtros actuales."
                />
            ) : (
                <ListGroup className="shadow-sm">
                    {registros.map((registro) => (
                        <ListGroup.Item
                            key={registro.id}
                            className="p-4"
                        >
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                <Badge bg="secondary">
                                    {tiposSeguimiento[registro.tipo]}
                                </Badge>
                                <Badge
                                    bg={
                                        {
                                            ALTA: "danger",
                                            MEDIA: "warning",
                                            BAJA: "info"
                                        }[registro.importancia]
                                    }
                                    text={
                                        registro.importancia === "ALTA"
                                            ? "white"
                                            : "dark"
                                    }
                                >
                                    Importancia{" "}
                                    {importanciasSeguimiento[
                                        registro.importancia
                                    ].toLowerCase()}
                                </Badge>
                            </div>
                            <p
                                className="text-break"
                                style={{ whiteSpace: "pre-wrap" }}
                            >
                                {registro.descripcion}
                            </p>
                            <div className="small text-secondary mb-3">
                                {nombreAutor(registro.usuario)} ·{" "}
                                {fechaSeguimiento(registro.createdAt)}
                            </div>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setSeleccionado(registro)}
                            >
                                Ver comentarios ({registro._count.comentarios})
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
            <Modal
                show={mostrar}
                onHide={() => !guardando && setMostrar(false)}
                backdrop="static"
            >
                <Form
                    noValidate
                    validated={validated}
                    onSubmit={guardar}
                >
                    <Modal.Header closeButton={!guardando}>
                        <Modal.Title>Registrar acontecimiento</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {errorFormulario && (
                            <Alert variant="danger">{errorFormulario}</Alert>
                        )}
                        <Form.Group
                            controlId="registro-descripcion"
                            className="mb-3 position-relative"
                        >
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                required
                                maxLength={5000}
                                value={form.descripcion}
                                isInvalid={
                                    validated && !form.descripcion.trim()
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        descripcion: e.target.value
                                    })
                                }
                            />
                            <Form.Control.Feedback
                                type="invalid"
                                tooltip
                            >
                                Ingresa una descripción de hasta 5000
                                caracteres.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group
                            controlId="registro-tipo"
                            className="mb-3"
                        >
                            <Form.Label>Tipo</Form.Label>
                            <Form.Select
                                value={form.tipo}
                                onChange={(e) =>
                                    setForm({ ...form, tipo: e.target.value })
                                }
                            >
                                {Object.entries(tiposSeguimiento).map(
                                    ([key, label]) => (
                                        <option
                                            key={key}
                                            value={key}
                                        >
                                            {label}
                                        </option>
                                    )
                                )}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="registro-importancia">
                            <Form.Label>Importancia</Form.Label>
                            <Form.Select
                                value={form.importancia}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        importancia: e.target.value
                                    })
                                }
                            >
                                {Object.entries(importanciasSeguimiento).map(
                                    ([key, label]) => (
                                        <option
                                            key={key}
                                            value={key}
                                        >
                                            {label}
                                        </option>
                                    )
                                )}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            disabled={guardando}
                            onClick={() => setMostrar(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={guardando}
                        >
                            {guardando ? "Guardando..." : "Guardar registro"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            {seleccionado && (
                <ComentariosModal
                    key={seleccionado.id}
                    eventoId={eventoId}
                    registro={seleccionado}
                    onHide={() => setSeleccionado(null)}
                    onGuardado={() => {
                        setRevision((v) => v + 1);
                        setMensaje("Comentario agregado correctamente.");
                    }}
                />
            )}
        </section>
    );
}

function ComentariosModal({ eventoId, registro, onHide, onGuardado }) {
    const [comentarios, setComentarios] = useState([]);
    const [texto, setTexto] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [validated, setValidated] = useState(false);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true);
            setError("");
            try {
                const datos = await getComentariosSeguimiento(
                    eventoId,
                    registro.id
                );
                if (activo) setComentarios(datos);
            } catch (err) {
                if (activo)
                    setError(
                        mensajeError(
                            err,
                            "No fue posible cargar los comentarios."
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
    }, [eventoId, registro.id, revision]);

    async function comentar(event) {
        event.preventDefault();
        setValidated(true);
        if (!event.currentTarget.checkValidity() || !texto.trim() || guardando)
            return;
        setGuardando(true);
        setError("");
        try {
            const nuevo = await comentarSeguimiento(
                eventoId,
                registro.id,
                texto
            );
            setComentarios((actual) => [...actual, nuevo]);
            setTexto("");
            setValidated(false);
            onGuardado();
        } catch (err) {
            setError(
                mensajeError(err, "No fue posible agregar el comentario.")
            );
        } finally {
            setGuardando(false);
        }
    }
    return (
        <Modal
            show
            onHide={() => !guardando && onHide()}
            size="lg"
            backdrop="static"
        >
            <Modal.Header closeButton={!guardando}>
                <Modal.Title>Comentarios del acontecimiento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Badge
                    bg="secondary"
                    className="mb-2"
                >
                    {tiposSeguimiento[registro.tipo]}
                </Badge>
                <p
                    className="text-break"
                    style={{ whiteSpace: "pre-wrap" }}
                >
                    {registro.descripcion}
                </p>
                <p className="text-secondary small">
                    {nombreAutor(registro.usuario)} ·{" "}
                    {fechaSeguimiento(registro.createdAt)}
                </p>
                {error && (
                    <Alert variant="danger">
                        {error}{" "}
                        <Button
                            variant="link"
                            onClick={() => setRevision((v) => v + 1)}
                        >
                            Recargar
                        </Button>
                    </Alert>
                )}
                {cargando ? (
                    <div role="status">
                        <Spinner size="sm" /> Cargando comentarios...
                    </div>
                ) : comentarios.length === 0 ? (
                    <p className="text-secondary">Aún no hay comentarios.</p>
                ) : (
                    <ListGroup className="mb-3">
                        {comentarios.map((item) => (
                            <ListGroup.Item key={item.id}>
                                <p
                                    className="mb-1 text-break"
                                    style={{ whiteSpace: "pre-wrap" }}
                                >
                                    {item.comentario}
                                </p>
                                <small className="text-secondary">
                                    {nombreAutor(item.usuario)} ·{" "}
                                    {fechaSeguimiento(item.createdAt)}
                                </small>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
                <Form
                    noValidate
                    validated={validated}
                    onSubmit={comentar}
                >
                    <Form.Group
                        controlId="seguimiento-comentario"
                        className="mb-3 position-relative"
                    >
                        <Form.Label>Agregar comentario</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            required
                            maxLength={2000}
                            value={texto}
                            disabled={guardando || cargando}
                            isInvalid={validated && !texto.trim()}
                            onChange={(e) => setTexto(e.target.value)}
                        />
                        <Form.Control.Feedback
                            type="invalid"
                            tooltip
                        >
                            Ingresa un comentario de hasta 2000 caracteres.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Button
                        type="submit"
                        disabled={guardando || cargando}
                    >
                        {guardando ? "Guardando..." : "Agregar comentario"}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
