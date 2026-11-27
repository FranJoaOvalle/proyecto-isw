import {useEffect, useState} from "react";

import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner,
    Table
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import EvaluacionProductorModal from "../../components/encuestas/EvaluacionProductorModal";
import HistorialProductorModal from "../../components/encuestas/HistorialProductorModal";
import RespuestaClienteModal from "../../components/encuestas/RespuestaClienteModal";

import {
    getEventosEvaluables
} from "../../services/evaluacion-productor.service";

export default function EvaluacionesPage() {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

    const [productorHistorial, setProductorHistorial] = useState(null);

    const [respuestaClienteId, setRespuestaClienteId] = useState(null);

    const loadEventos = async () => {
        try {
            setError("");
            setEventos(await getEventosEvaluables());
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar las evaluaciones."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEventos();
    }, []);

    const total = eventos.length;

    const evaluados = eventos.filter(
        evento => Boolean(evento.evaluacionProductor)
    ).length;

    const pendientes = total - evaluados;

    const eventosFiltrados = eventos.filter(evento => {
        const termino = search.trim().toLowerCase();

        const contenido = [
            evento.id,
            evento.tipoEvento.nombre,
            evento.lugar,
            evento.productor?.nombres,
            evento.productor?.apellidos
        ].join(" ").toLowerCase();

        const coincideBusqueda = contenido.includes(termino);

        const coincideEstado =
            estado === "TODOS" ||
            (estado === "EVALUADOS" &&
                evento.evaluacionProductor) ||
            (estado === "PENDIENTES" &&
                !evento.evaluacionProductor);

        return coincideBusqueda && coincideEstado;
    });

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border"/>
            </div>
        );
    }

    return (
        <Container className="py-5">
            <PageHeader
                title="Evaluaciones de productores"
                description="Revisa las calificaciones de clientes y registra la evaluación de gerencia de cada evento completado."
            />

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            <Row className="g-3 mb-4">
                {[
                    {
                        label: "Eventos evaluables",
                        value: total,
                        icon: "bi-calendar-check",
                        color: "primary"
                    },
                    {
                        label: "Evaluados",
                        value: evaluados,
                        icon: "bi-clipboard-check",
                        color: "success"
                    },
                    {
                        label: "Pendientes",
                        value: pendientes,
                        icon: "bi-hourglass-split",
                        color: "warning"
                    }
                ].map(item => (
                    <Col md={4} key={item.label}>
                        <Card className="h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-secondary">
                                        {item.label}
                                    </span>

                                    <i className={
                                        `bi ${item.icon} text-${item.color} fs-4`
                                    }/>
                                </div>

                                <div className="fs-2 fw-bold">
                                    {item.value}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-3 mb-4">
                <Col md={8}>
                    <Form.Control
                        placeholder="Buscar evento o productor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </Col>

                <Col md={4}>
                    <Form.Select
                        value={estado}
                        onChange={e => setEstado(e.target.value)}
                    >
                        <option value="TODOS">Todos</option>
                        <option value="EVALUADOS">Evaluados</option>
                        <option value="PENDIENTES">Pendientes</option>
                    </Form.Select>
                </Col>
            </Row>

            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead>
                    <tr>
                        <th>Evento</th>
                        <th>Productor</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Gerencia</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                    </thead>

                    <tbody>
                    {eventosFiltrados.map(evento => (
                        <tr key={evento.id}>
                            <td>
                                <div className="fw-semibold">
                                    {evento.tipoEvento.nombre}
                                </div>

                                <small className="text-secondary">
                                    #{evento.id} · {evento.lugar}
                                </small>
                            </td>

                            <td>
                                <Button
                                    variant="link"
                                    className="p-0 text-decoration-none text-start"
                                    title="Consultar historial de desempeño"
                                    onClick={() =>
                                        setProductorHistorial(evento.productorId)
                                    }
                                >
                                    {evento.productor?.nombres}{" "}
                                    {evento.productor?.apellidos}

                                    <i className="bi bi-clock-history ms-2"/>
                                </Button>
                            </td>

                            <td>
                                {new Date(evento.fin).toLocaleDateString(
                                    "es-CL",
                                    {timeZone: "America/Santiago"}
                                )}
                            </td>

                            <td>
                                <Button
                                    variant="link"
                                    className="p-0 text-decoration-none"
                                    title="Consultar encuesta del cliente"
                                    onClick={() => setRespuestaClienteId(evento.id)}
                                >
                                    {evento.calificacion ? (
                                        <Badge bg="primary">
                                            {evento.calificacion.puntuacion} / 5
                                            <i className="bi bi-eye ms-2"/>
                                        </Badge>
                                    ) : (
                                        <span className="text-secondary small">
                                            Sin calificar
                                            <i className="bi bi-eye ms-2"/>
                                        </span>
                                    )}
                                </Button>
                            </td>

                            <td>
                                {evento.evaluacionProductor ? (
                                    <Badge bg="success">
                                        {evento.evaluacionProductor.puntuacion} / 5
                                    </Badge>
                                ) : (
                                    <Badge bg="warning" text="dark">
                                        Pendiente
                                    </Badge>
                                )}
                            </td>

                            <td className="text-end">
                                <Button
                                    size="sm"
                                    variant={
                                        evento.evaluacionProductor
                                            ? "outline-secondary"
                                            : "primary"
                                    }
                                    onClick={() =>
                                        setEventoSeleccionado(evento.id)
                                    }
                                >
                                    <i className={
                                        evento.evaluacionProductor
                                            ? "bi bi-eye me-2"
                                            : "bi bi-clipboard-check me-2"
                                    }/>

                                    {evento.evaluacionProductor
                                        ? "Ver evaluación"
                                        : "Evaluar"}
                                </Button>
                            </td>
                        </tr>
                    ))}

                    {eventosFiltrados.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="text-center text-secondary py-4"
                            >
                                No se encontraron eventos.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            {eventoSeleccionado !== null && (
                <EvaluacionProductorModal
                    key={eventoSeleccionado}
                    eventoId={eventoSeleccionado}
                    onClose={() => setEventoSeleccionado(null)}
                    onSaved={loadEventos}
                />
            )}

            {productorHistorial !== null && (
                <HistorialProductorModal
                    key={productorHistorial}
                    productorId={productorHistorial}
                    onClose={() => setProductorHistorial(null)}
                />
            )}

            {respuestaClienteId !== null && (
                <RespuestaClienteModal
                    key={respuestaClienteId}
                    eventoId={respuestaClienteId}
                    onClose={() => setRespuestaClienteId(null)}
                />
            )}
        </Container>
    );
}