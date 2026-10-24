import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { TIPOS_ACTIVIDAD } from "./agenda.utils";

const ESTADOS_AGENDA = [
    ["PENDIENTE", "Actividad pendiente"],
    ["COMPLETADA", "Actividad completada"],
    ["CANCELADA", "Actividad cancelada"],
    ["CONFIRMADO", "Evento confirmado"],
    ["POSPUESTO", "Evento pospuesto"],
    ["EN_CURSO", "Evento en curso"],
    ["COMPLETADO", "Evento completado"],
    ["CANCELADO", "Evento cancelado"]
];

export default function AgendaFiltros({ agenda }) {
    const { esAdmin, filtros, setFiltros, productores, registrosDelPeriodo, mesVisible, vistaAgenda } = agenda;
    const hayFiltros = Object.values(filtros).some(Boolean);
    const rangoInvalido = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta;

    const cambiarFiltro = (campo, valor) => {
        setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    };

    const limpiarFiltros = () => {
        setFiltros({ estado: "", tipo: "", productorId: "", desde: "", hasta: "" });
    };

    return (
        <Card className="bg-body text-body border rounded-4 mb-4">
            <Card.Body className="p-3 p-lg-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                        <h2 className="h6 fw-bold mb-1">
                            <i className="bi bi-sliders2 text-primary me-2" />
                            Filtrar agenda
                        </h2>
                        <p className="small text-body-secondary mb-0">
                            {esAdmin
                                ? "Filtra por fecha, estado, tipo o productor."
                                : "Filtra tus compromisos por fecha, estado y tipo de actividad."}
                        </p>
                    </div>
                    <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={limpiarFiltros} disabled={!hayFiltros}>
                        <i className="bi bi-arrow-counterclockwise me-1" />Limpiar filtros
                    </Button>
                </div>

                {rangoInvalido && (
                    <Alert variant="warning" className="py-2 small">
                        La fecha inicial debe ser anterior o igual a la fecha final.
                    </Alert>
                )}

                <Row className="g-3">
                    <Col xs={12} md={6} xl={3}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold">Desde</Form.Label>
                            <Form.Control type="date" value={filtros.desde} onChange={(e) => cambiarFiltro("desde", e.target.value)} className="rounded-3" />
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={6} xl={3}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold">Hasta</Form.Label>
                            <Form.Control type="date" value={filtros.hasta} onChange={(e) => cambiarFiltro("hasta", e.target.value)} className="rounded-3" />
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={6} xl={3}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold">Estado</Form.Label>
                            <Form.Select value={filtros.estado} onChange={(e) => cambiarFiltro("estado", e.target.value)} className="rounded-3">
                                <option value="">Todos los estados</option>
                                {ESTADOS_AGENDA.map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={6} xl={3}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold">Tipo de actividad</Form.Label>
                            <Form.Select value={filtros.tipo} onChange={(e) => cambiarFiltro("tipo", e.target.value)} className="rounded-3">
                                <option value="">Todos los tipos</option>
                                {TIPOS_ACTIVIDAD.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    {esAdmin && (
                        <Col xs={12} md={6} xl={3}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">Productor</Form.Label>
                                <Form.Select value={filtros.productorId} onChange={(e) => cambiarFiltro("productorId", e.target.value)} className="rounded-3">
                                    <option value="">Todos los productores</option>
                                    {productores.map((productor) => (
                                        <option key={productor.id} value={String(productor.id)}>
                                            {productor.nombres} {productor.apellidos}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    )}
                </Row>

                <div className="small text-body-secondary mt-3">
                    {rangoInvalido
                        ? "No hay registros para el rango indicado."
                        : `Se muestran ${registrosDelPeriodo.length} registros ${vistaAgenda === "semana" ? "en esta semana" : `de ${mesVisible.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`} con los filtros actuales.`}
                </div>
            </Card.Body>
        </Card>
    );
}
