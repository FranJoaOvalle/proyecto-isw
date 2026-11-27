import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Alert, Badge, Button, Card, Col, Container,
    ProgressBar, Row, Spinner
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";

import { getClientes } from "../../services/cliente.service";
import { listarPagos } from "../../services/pago.service";
import { getEventosSeguimiento } from "../../services/seguimiento.service";

import {
    getEventosEvaluables,
    getRankingProductores
} from "../../services/evaluacion-productor.service";

import {
    estadosEvento,
    varianteEstado
} from "../../components/eventos/seguimiento.utils";

import "./AdminPage.css";

const moneda = valor => Number(valor).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
});

function Indicador({ titulo, valor, detalle, icono, color, ruta }) {
    return (
        <Card
            as={Link}
            to={ruta}
            className={`dashboard-indicador border-start border-${color} text-decoration-none h-100`}
        >
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-secondary small fw-semibold">
                        {titulo}
                    </span>

                    <div className={`dashboard-icono text-${color} bg-${color}-subtle`}>
                        <i className={`bi bi-${icono}`} />
                    </div>
                </div>

                <div className="fs-3 fw-bold mb-1">
                    {valor ?? "—"}
                </div>

                <small className="text-secondary">
                    {detalle}
                </small>
            </Card.Body>
        </Card>
    );
}

function AlertaOperativa({ titulo, cantidad, icono, ruta }) {
    return (
        <Link
            to={ruta}
            className="dashboard-item text-decoration-none d-flex align-items-center gap-3 p-3"
        >
            <div className={`dashboard-icono ${
                cantidad > 0
                    ? "bg-warning-subtle text-warning-emphasis"
                    : "bg-secondary-subtle text-secondary"
            }`}>
                <i className={`bi bi-${icono}`} />
            </div>

            <span className="flex-grow-1">{titulo}</span>

            <Badge bg={cantidad > 0 ? "warning" : "secondary"}
                   text={cantidad > 0 ? "dark" : undefined}>
                {cantidad ?? "—"}
            </Badge>

            <i className="bi bi-chevron-right text-secondary small" />
        </Link>
    );
}

function EncabezadoSeccion({ titulo, ruta }) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">{titulo}</h5>

            <Link to={ruta} className="small text-decoration-none">
                Ver todo <i className="bi bi-arrow-right ms-1" />
            </Link>
        </div>
    );
}

export default function AdminPage() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [errores, setErrores] = useState([]);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            setLoading(true);
            setErrores([]);

            const consultas = [
                ["clientes", getClientes()],
                ["eventos", getEventosSeguimiento()],
                ["pagos", listarPagos()],
                ["evaluaciones", getEventosEvaluables()],
                ["ranking", getRankingProductores()]
            ];

            const resultados = await Promise.allSettled(
                consultas.map(([, peticion]) => peticion)
            );

            if (!activo) return;

            const resultado = {};
            const fallidos = [];

            resultados.forEach((item, index) => {
                const [clave] = consultas[index];

                if (item.status === "fulfilled") {
                    resultado[clave] = item.value;
                } else {
                    resultado[clave] = null;
                    fallidos.push(clave);
                }
            });

            setData(resultado);
            setErrores(fallidos);
            setLoading(false);
        };

        cargar();

        return () => {
            activo = false;
        };
    }, [revision]);

    const eventos = data.eventos ?? [];
    const pagos = data.pagos ?? [];
    const clientes = data.clientes ?? [];
    const evaluaciones = data.evaluaciones ?? [];
    const ranking = data.ranking?.ranking ?? [];

    const ahora = Date.now();
    const limite = ahora + 7 * 24 * 60 * 60 * 1000;

    const proximos = eventos.filter(e =>
        e.estado === "CONFIRMADO" &&
        new Date(e.inicio).getTime() >= ahora &&
        new Date(e.inicio).getTime() < limite
    ).sort((a, b) =>
        new Date(a.inicio) - new Date(b.inicio)
    );

    const eventosSinProductor = eventos.filter(e =>
        ["CONFIRMADO", "EN_CURSO"].includes(e.estado) &&
        !e.productorId
    ).length;

    const eventosEnCurso = eventos.filter(
        e => e.estado === "EN_CURSO"
    ).length;

    const pagosPendientes = pagos.filter(
        p => p.estado === "PENDIENTE"
    );

    const montoPagado = pagos
        .filter(p => p.estado === "PAGADO")
        .reduce((total, p) => total + Number(p.monto), 0);

    const montoPendiente = pagosPendientes.reduce(
        (total, p) => total + Number(p.monto), 0
    );

    const evaluacionesPendientes = evaluaciones.filter(
        e => !e.evaluacionProductor
    ).length;

    const clientesActivos = clientes.filter(
        c => c.usuario?.activo
    ).length;

    const mejoresProductores = ranking.filter(
        p => p.posicion !== null
    ).slice(0, 3);

    const estados = Object.entries(estadosEvento).map(
        ([estado, nombre]) => ({
            estado,
            nombre,
            cantidad: eventos.filter(e => e.estado === estado).length,
            color: varianteEstado[estado]
        })
    );

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container fluid className="dashboard-admin py-4 px-3 px-xl-4">
            <PageHeader
                title="Panel de control"
                description="Resumen operativo de NES Eventos."
            >
                <Button
                    variant="outline-secondary"
                    onClick={() => setRevision(r => r + 1)}
                >
                    <i className="bi bi-arrow-clockwise me-2" />
                    Actualizar
                </Button>
            </PageHeader>

            {errores.length > 0 && (
                <Alert variant="warning">
                    No fue posible cargar: {errores.join(", ")}.
                    Algunos indicadores no están disponibles.
                </Alert>
            )}

            <div className="dashboard-banner rounded-3 p-4 mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <div className="dashboard-fecha-actual small mb-2 opacity-75">
                            {new Date().toLocaleDateString("es-CL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                timeZone: "America/Santiago"
                            })}
                        </div>

                        <h3 className="fw-bold mb-2">
                            Resumen de operaciones
                        </h3>

                        <p className="mb-0 opacity-75">
                            {data.eventos
                                ? `${eventosEnCurso} eventos en curso y ${proximos.length} próximos eventos.`
                                : "Información de eventos no disponible."}
                        </p>
                    </div>

                    <Button
                        as={Link}
                        to="/admin/agenda"
                        variant="primary"
                    >
                        <i className="bi bi-calendar-week me-2" />
                        Ver agenda
                    </Button>
                </div>
            </div>

            <Row className="g-3 mb-4">
                <Col sm={6} xl={3}>
                    <Indicador
                        titulo="Próximos eventos"
                        valor={data.eventos ? proximos.length : null}
                        detalle="Durante los próximos 7 días"
                        icono="calendar-event"
                        color="primary"
                        ruta="/admin/eventos"
                    />
                </Col>

                <Col sm={6} xl={3}>
                    <Indicador
                        titulo="Pagos registrados"
                        valor={data.pagos ? moneda(montoPagado) : null}
                        detalle="Total histórico pagado"
                        icono="wallet2"
                        color="success"
                        ruta="/admin/pagos"
                    />
                </Col>

                <Col sm={6} xl={3}>
                    <Indicador
                        titulo="Evaluaciones pendientes"
                        valor={data.evaluaciones ? evaluacionesPendientes : null}
                        detalle="Evaluaciones de gerencia"
                        icono="clipboard-check"
                        color="warning"
                        ruta="/admin/evaluaciones"
                    />
                </Col>

                <Col sm={6} xl={3}>
                    <Indicador
                        titulo="Clientes activos"
                        valor={data.clientes ? clientesActivos : null}
                        detalle={data.clientes
                            ? `${clientes.length} clientes registrados`
                            : "Información no disponible"}
                        icono="people"
                        color="info"
                        ruta="/admin/clientes"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-4">
                <Col xl={7}>
                    <Card className="h-100">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">
                                Requiere atención
                            </h5>

                            <AlertaOperativa
                                titulo="Eventos sin productor asignado"
                                cantidad={data.eventos ? eventosSinProductor : null}
                                icono="person-exclamation"
                                ruta="/admin/eventos"
                            />

                            <AlertaOperativa
                                titulo="Pagos pendientes"
                                cantidad={data.pagos ? pagosPendientes.length : null}
                                icono="cash-stack"
                                ruta="/admin/pagos"
                            />

                            <AlertaOperativa
                                titulo="Evaluaciones de productores pendientes"
                                cantidad={data.evaluaciones ? evaluacionesPendientes : null}
                                icono="clipboard"
                                ruta="/admin/evaluaciones"
                            />
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={5}>
                    <Card className="h-100">
                        <Card.Body>
                            <EncabezadoSeccion
                                titulo="Resumen financiero"
                                ruta="/admin/pagos"
                            />

                            <div className="text-secondary small">
                                Pagos registrados
                            </div>

                            <div className="fs-3 fw-bold text-success mb-3">
                                {data.pagos ? moneda(montoPagado) : "—"}
                            </div>

                            <div className="text-secondary small">
                                Montos pendientes
                            </div>

                            <div className="fs-4 fw-bold mb-3">
                                {data.pagos ? moneda(montoPendiente) : "—"}
                            </div>

                            <ProgressBar>
                                <ProgressBar
                                    variant="success"
                                    now={montoPagado + montoPendiente > 0
                                        ? montoPagado / (montoPagado + montoPendiente) * 100
                                        : 0}
                                />

                                <ProgressBar
                                    variant="warning"
                                    now={montoPagado + montoPendiente > 0
                                        ? montoPendiente / (montoPagado + montoPendiente) * 100
                                        : 0}
                                />
                            </ProgressBar>

                            <small className="text-secondary d-block mt-2">
                                Distribución entre pagos pagados y pendientes.
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mb-4">
                <Col xl={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <EncabezadoSeccion
                                titulo="Estado de eventos"
                                ruta="/admin/eventos"
                            />

                            {data.eventos ? estados.map(item => (
                                <div key={item.estado} className="mb-3">
                                    <div className="d-flex justify-content-between mb-2 small">
                                        <span>{item.nombre}</span>
                                        <strong>{item.cantidad}</strong>
                                    </div>

                                    <ProgressBar
                                        variant={item.color}
                                        now={eventos.length
                                            ? item.cantidad / eventos.length * 100
                                            : 0}
                                        style={{ height: 7 }}
                                    />
                                </div>
                            )) : (
                                <p className="text-secondary">
                                    Información no disponible.
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <EncabezadoSeccion
                                titulo="Mejor desempeño"
                                ruta="/admin/ranking"
                            />

                            {mejoresProductores.map(p => (
                                <div
                                    key={p.productorId}
                                    className="dashboard-item d-flex align-items-center gap-3 p-3"
                                >
                                    <div className={`dashboard-posicion posicion-${p.posicion}`}>
                                        <i className="bi bi-trophy-fill" />
                                    </div>

                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">
                                            {p.nombres} {p.apellidos}
                                        </div>

                                        <small className="text-secondary">
                                            {p.eventosCompletados} eventos completados
                                            {p.estado === "PROVISIONAL" && " · Provisional"}
                                        </small>
                                    </div>

                                    <div className="text-end">
                                        <div className="fw-bold fs-5">
                                            {p.puntuacionFinal.toFixed(2)}
                                        </div>

                                        <small className="text-secondary">
                                            de 5.00
                                        </small>
                                    </div>
                                </div>
                            ))}

                            {!mejoresProductores.length && (
                                <p className="text-secondary py-3">
                                    {data.ranking
                                        ? "Todavía no hay productores con puntuación calculada."
                                        : "Ranking no disponible."}
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Card.Body>
                    <EncabezadoSeccion
                        titulo="Próximos eventos"
                        ruta="/admin/eventos"
                    />

                    {proximos.slice(0, 5).map(evento => {
                        const fecha = new Date(evento.inicio);

                        return (
                            <Link
                                key={evento.id}
                                to={`/admin/eventos/${evento.id}`}
                                className="dashboard-item text-decoration-none d-flex align-items-center flex-wrap gap-3 p-3"
                            >
                                <div className="dashboard-fecha">
                                    <strong className="fs-4">
                                        {fecha.toLocaleDateString("es-CL", {
                                            day: "2-digit",
                                            timeZone: "America/Santiago"
                                        })}
                                    </strong>

                                    <small className="text-uppercase">
                                        {fecha.toLocaleDateString("es-CL", {
                                            month: "short",
                                            timeZone: "America/Santiago"
                                        })}
                                    </small>
                                </div>

                                <div className="flex-grow-1">
                                    <div className="fw-semibold">
                                        {evento.tipoEvento.nombre}
                                    </div>

                                    <small className="text-secondary">
                                        <i className="bi bi-geo-alt me-1" />
                                        {evento.lugar}
                                    </small>

                                    <div className="small text-secondary mt-1">
                                        {evento.productor
                                            ? `${evento.productor.nombres} ${evento.productor.apellidos}`
                                            : "Sin productor asignado"}
                                    </div>
                                </div>

                                <Badge bg="primary">
                                    Confirmado
                                </Badge>

                                <i className="bi bi-chevron-right text-secondary" />
                            </Link>
                        );
                    })}

                    {!proximos.length && (
                        <p className="text-secondary py-3">
                            {data.eventos
                                ? "No hay eventos programados para los próximos 7 días."
                                : "Información no disponible."}
                        </p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}