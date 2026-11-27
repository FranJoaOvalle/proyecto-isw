import { useEffect, useState } from "react";

import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    ProgressBar,
    Row,
    Spinner,
    Table
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";

import HistorialProductorModal
    from "../../components/encuestas/HistorialProductorModal";

import {
    ESTADOS_RANKING,
    formatearPuntuacion,
    construirPeriodo
} from "../../components/encuestas/ranking.utils";

import {
    getRankingProductores
} from "../../services/evaluacion-productor.service";

function Indicador({ label, value, icon, color }) {
    return (
        <Card className="h-100">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">
                        {label}
                    </span>

                    <i className={`bi bi-${icon} text-${color} fs-4`} />
                </div>

                <div className="fs-2 fw-bold">
                    {value}
                </div>
            </Card.Body>
        </Card>
    );
}

function Posicion({ productor }) {
    if (productor.posicion === null) {
        return <span className="text-secondary">—</span>;
    }

    if (productor.posicion <= 3) {
        const colores = {
            1: "#d4a017",
            2: "#9299a1",
            3: "#b87333"
        };

        return (
            <span
                className="fw-bold fs-5"
                style={{
                    color: colores[productor.posicion]
                }}
            >
                <i className="bi bi-trophy-fill me-2" />
                {productor.posicion}°
            </span>
        );
    }

    return (
        <span className="fw-semibold">
            {productor.posicion}°
        </span>
    );
}

function Puntuacion({ valor, cantidad }) {
    return (
        <div>
            <div className="fw-semibold">
                {formatearPuntuacion(valor)}

                {valor !== null && (
                    <small className="text-secondary fw-normal">
                        {" / 5"}
                    </small>
                )}
            </div>

            <small className="text-secondary">
                {cantidad} {cantidad === 1
                ? "evaluación"
                : "evaluaciones"}
            </small>
        </div>
    );
}

export default function RankingPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [periodo, setPeriodo] = useState({});

    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");

    const [productorHistorial, setProductorHistorial] =
        useState(null);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError("");

        getRankingProductores(periodo, controller.signal)
            .then(resultado => {
                if (!controller.signal.aborted) {
                    setData(resultado);
                }
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setData(null);

                    setError(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar el ranking."
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [periodo]);

    const aplicarPeriodo = (e) => {
        e.preventDefault();
        setError("");

        if (desde && hasta && desde > hasta) {
            setError("El período seleccionado no es válido.");
            return;
        }

        setPeriodo(construirPeriodo(desde, hasta));
    };

    const limpiarFiltros = () => {
        setDesde("");
        setHasta("");
        setSearch("");
        setEstado("TODOS");
        setPeriodo({});
    };

    const ranking = data?.ranking ?? [];

    const clasificados = ranking.filter(
        p => p.estado === "CLASIFICADO"
    ).length;

    const provisionales = ranking.filter(
        p => p.estado === "PROVISIONAL"
    ).length;

    const sinDatos = ranking.filter(
        p => p.estado === "SIN_DATOS"
    ).length;

    const rankingFiltrado = ranking.filter(productor => {
        const termino = search.trim().toLowerCase();

        const nombre = [
            productor.nombres,
            productor.apellidos
        ].join(" ").toLowerCase();

        return nombre.includes(termino) && (estado === "TODOS" || productor.estado === estado);
    });

    return (
        <Container className="py-5">
            <PageHeader
                title="Ranking de productores"
                description="El período se aplica a la fecha de término de los eventos evaluados."
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

            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={aplicarPeriodo}>
                        <Row className="g-3 align-items-end">
                            <Col md>
                                <Form.Group>
                                    <Form.Label>Desde</Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={desde}
                                        max={hasta || undefined}
                                        onChange={e =>
                                            setDesde(e.target.value)
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md>
                                <Form.Group>
                                    <Form.Label>Hasta</Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={hasta}
                                        min={desde || undefined}
                                        onChange={e =>
                                            setHasta(e.target.value)
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md="auto">
                                <div className="d-flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                    >
                                        <i className="bi bi-funnel me-2" />
                                        Aplicar
                                    </Button>

                                    <Button
                                        variant="outline-secondary"
                                        onClick={limpiarFiltros}
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : data && (
                <>
                    <Row className="g-3 mb-4">
                        <Col sm={6} xl={3}>
                            <Indicador
                                label="Productores activos"
                                value={ranking.length}
                                icon="people"
                                color="primary"
                            />
                        </Col>

                        <Col sm={6} xl={3}>
                            <Indicador
                                label="Clasificados"
                                value={clasificados}
                                icon="trophy"
                                color="success"
                            />
                        </Col>

                        <Col sm={6} xl={3}>
                            <Indicador
                                label="Provisionales"
                                value={provisionales}
                                icon="hourglass-split"
                                color="warning"
                            />
                        </Col>

                        <Col sm={6} xl={3}>
                            <Indicador
                                label="Sin datos suficientes"
                                value={sinDatos}
                                icon="clipboard"
                                color="secondary"
                            />
                        </Col>
                    </Row>

                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="fw-semibold">
                                Criterios de evaluación
                            </h6>

                            <div className="d-flex justify-content-between mb-2">
                                <small>
                                    Gerencia: {
                                    data.configuracion.pesoGerencia * 100
                                }%
                                </small>

                                <small>
                                    Clientes: {
                                    data.configuracion.pesoClientes * 100
                                }%
                                </small>
                            </div>

                            <ProgressBar>
                                <ProgressBar
                                    variant="primary"
                                    now={data.configuracion.pesoGerencia * 100}
                                    key={1}
                                />

                                <ProgressBar
                                    variant="info"
                                    now={data.configuracion.pesoClientes * 100}
                                    key={2}
                                />
                            </ProgressBar>

                            <small className="text-secondary d-block mt-3">
                                Se requieren al menos {
                                data.configuracion.minimoEvaluaciones
                            } evaluaciones de cada fuente para obtener una
                                clasificación definitiva.
                            </small>
                        </Card.Body>
                    </Card>

                    <Row className="g-3 mb-4">
                        <Col md={8}>
                            <Form.Control
                                placeholder="Buscar productor..."
                                value={search}
                                onChange={e =>
                                    setSearch(e.target.value)
                                }
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Select
                                value={estado}
                                onChange={e =>
                                    setEstado(e.target.value)
                                }
                            >
                                <option value="TODOS">
                                    Todos los estados
                                </option>

                                {Object.entries(ESTADOS_RANKING).map(
                                    ([value, item]) => (
                                        <option key={value} value={value}>
                                            {item.label}
                                        </option>
                                    )
                                )}
                            </Form.Select>
                        </Col>
                    </Row>

                    <div className="table-responsive">
                        <Table hover className="align-middle">
                            <thead>
                            <tr>
                                <th>Posición</th>
                                <th>Productor</th>
                                <th>Eventos</th>
                                <th>Gerencia</th>
                                <th>Clientes</th>
                                <th>Puntuación final</th>
                                <th>Estado</th>
                                <th className="text-end">
                                    Historial
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {rankingFiltrado.map(productor => {
                                const estadoRanking =
                                    ESTADOS_RANKING[productor.estado];

                                return (
                                    <tr key={productor.productorId}>
                                        <td>
                                            <Posicion productor={productor} />
                                        </td>

                                        <td className="fw-semibold">
                                            {productor.nombres}{" "}
                                            {productor.apellidos}
                                        </td>

                                        <td>
                                            {productor.eventosCompletados}
                                        </td>

                                        <td>
                                            <Puntuacion
                                                valor={productor.promedioGerencia}
                                                cantidad={productor.evaluacionesGerencia}
                                            />
                                        </td>

                                        <td>
                                            <Puntuacion
                                                valor={productor.promedioClientes}
                                                cantidad={productor.evaluacionesClientes}
                                            />
                                        </td>

                                        <td style={{ minWidth: 120 }}>
                                            <div className="fw-bold fs-5">
                                                {formatearPuntuacion(
                                                    productor.puntuacionFinal
                                                )}
                                            </div>

                                            {productor.puntuacionFinal !== null && (
                                                <ProgressBar
                                                    now={
                                                        productor.puntuacionFinal * 20
                                                    }
                                                    style={{ height: 6 }}
                                                />
                                            )}
                                        </td>

                                        <td>
                                            <Badge
                                                bg={estadoRanking.variant}
                                                text={
                                                    productor.estado === "PROVISIONAL"
                                                        ? "dark"
                                                        : undefined
                                                }
                                            >
                                                {estadoRanking.label}
                                            </Badge>
                                        </td>

                                        <td className="text-end">
                                            <div className="table-actions">
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    title="Consultar historial"
                                                    onClick={() =>
                                                        setProductorHistorial(
                                                            productor.productorId
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-clock-history" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rankingFiltrado.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="text-center text-secondary py-4"
                                    >
                                        No se encontraron productores.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}

            {productorHistorial !== null && (
                <HistorialProductorModal
                    key={productorHistorial}
                    productorId={productorHistorial}
                    onClose={() => setProductorHistorial(null)}
                />
            )}
        </Container>
    );
}