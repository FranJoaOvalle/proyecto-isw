import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { getAgenda } from "../../services/agenda.service";

const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-CL", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const obtenerNombre = (registro) => {
    if (registro.tipoRegistro === "ACTIVIDAD") {
        return registro.titulo;
    }

    return registro.tipoEvento?.nombre ?? "Evento";
};

const obtenerVarianteEstado = (estado) => {
    const variantes = {
        PENDIENTE: "warning",
        COMPLETADA: "success",
        CANCELADA: "danger",
        ORGANIZACION: "info",
        CONFIRMADO: "success",
        POSPUESTO: "warning",
        EN_CURSO: "primary",
        COMPLETADO: "success",
        CANCELADO: "danger",
        FINALIZADO: "success"
    };

    return variantes[estado] ?? "secondary";
};

export default function AgendaPage() {
    const [registros, setRegistros] = useState([]);
    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarAgenda = async () => {
            try {
                setCargando(true);
                setError("");

                const datos = await getAgenda(
                    inicio || undefined,
                    fin ? `${fin}T23:59:59.999` : undefined
                );

                setRegistros(datos);
            } catch (err) {
                setError(
                    err.response?.data?.error?.message ??
                    "No fue posible cargar la agenda."
                );
            } finally {
                setCargando(false);
            }
        };

        cargarAgenda();
    }, [inicio, fin]);

    return (
        <Container className="py-5">
            <PageHeader
                title="Agenda"
                description="Consulta las actividades y los eventos programados."
            />

            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Desde</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={inicio}
                                    max={fin || undefined}
                                    onChange={(e) => setInicio(e.target.value)}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Hasta</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={fin}
                                    min={inicio || undefined}
                                    onChange={(e) => setFin(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {cargando ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando agenda...</span>
                    </Spinner>
                </div>
            ) : registros.length === 0 ? (
                <Card>
                    <Card.Body>
                        <EmptyState
                            icon="bi-calendar-x"
                            title="No hay registros"
                            description="No se encontraron actividades ni eventos para el período seleccionado."
                        />
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-3">
                    {registros.map((registro) => (
                        <Col
                            key={`${registro.tipoRegistro}-${registro.id}`}
                            md={6}
                            xl={4}
                        >
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                                        <Badge
                                            bg={
                                                registro.tipoRegistro === "EVENTO"
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                        >
                                            {registro.tipoRegistro === "EVENTO"
                                                ? "Evento"
                                                : "Actividad"}
                                        </Badge>

                                        <Badge
                                            bg={obtenerVarianteEstado(registro.estado)}
                                        >
                                            {registro.estado}
                                        </Badge>
                                    </div>

                                    <Card.Title>
                                        {obtenerNombre(registro)}
                                    </Card.Title>

                                    {registro.descripcion && (
                                        <Card.Text className="text-secondary">
                                            {registro.descripcion}
                                        </Card.Text>
                                    )}

                                    <div className="small">
                                        <p className="mb-2">
                                            <i className="bi bi-calendar-event me-2" />
                                            <strong>Inicio:</strong>{" "}
                                            {formatearFecha(registro.inicio)}
                                        </p>

                                        <p className="mb-2">
                                            <i className="bi bi-calendar-check me-2" />
                                            <strong>Término:</strong>{" "}
                                            {formatearFecha(registro.fin)}
                                        </p>

                                        <p className="mb-0">
                                            <i className="bi bi-geo-alt me-2" />
                                            <strong>Lugar:</strong>{" "}
                                            {registro.lugar || "Sin lugar definido"}
                                        </p>
                                    </div>

                                    {registro.tipoRegistro === "ACTIVIDAD" &&
                                        registro.tipo && (
                                            <div className="mt-3">
                                                <Badge bg="light" text="dark">
                                                    {registro.tipo}
                                                </Badge>
                                            </div>
                                        )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}