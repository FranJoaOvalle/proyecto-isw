import { Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import EmptyState from "../EmptyState";
import { DIAS_SEMANA, TIPOS_ACTIVIDAD, obtenerNombre, obtenerProductoresAsignados, formatearFecha, formatearDia, obtenerVarianteEstado, formatearEstado } from "./agenda.utils";

const obtenerNombreCliente = (cliente) => {
    if (!cliente) return "Cliente no disponible";

    if (cliente.tipo === "EMPRESA") {
        return cliente.empresa?.razonSocial || "Cliente empresa";
    }

    return `${cliente.persona?.nombres || ""} ${cliente.persona?.apellidos || ""}`.trim() || "Cliente persona";
};

export default function AgendaMes({ agenda }) {
    const { esAdmin, vistaAgenda, mesVisible, cambiarMes, irAHoy, registrosFiltrados, fechaSeleccionada, seleccionarDia, cargando, cambiandoEstadoActividad, diasCalendario, registrosPorDia, cantidadActividades, cantidadEventos, registrosDelDia, abrirEdicionActividad, completarActividadPendiente, marcarActividadPendiente, anularActividad, setActividadReactivando, solicitarEliminacionFisica } = agenda;

    return (
        <>            {vistaAgenda === "mes" && (
                    <Card className="bg-body text-body border rounded-4 mb-4 overflow-hidden shadow">
                    <div className="bg-primary" style={{ height: 5 }} />

                    <Card.Body className="p-3 p-lg-4">
                        {/* Encabezado */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 flex-shrink-0"
                                    style={{ width: 54, height: 54 }}
                                >
                                    <i className="bi bi-calendar3 fs-3" />
                                </div>

                                <div className="min-w-0">
                                    <div className="small fw-bold text-primary mb-1">MI AGENDA</div>
                                    <h2 className="h4 fw-bold text-capitalize mb-1">
                                        {mesVisible.toLocaleDateString("es-CL", {
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </h2>
                                    <div className="small text-body-secondary">
                                        Organiza y consulta tus eventos y actividades
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-3"
                                    onClick={() => cambiarMes(-1)}
                                    aria-label="Mes anterior"
                                >
                                    <i className="bi bi-chevron-left me-1" />Anterior
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="rounded-3 fw-semibold px-3 shadow-sm"
                                    onClick={irAHoy}
                                >
                                    <i className="bi bi-calendar-check me-2" />Hoy
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-3"
                                    onClick={() => cambiarMes(1)}
                                    aria-label="Mes siguiente"
                                >
                                    Siguiente<i className="bi bi-chevron-right ms-1" />
                                </Button>
                            </div>
                        </div>

                        {/* Resumen mensual */}
                        <div className="d-flex justify-content-center gap-2 mb-3">
                            <div
                                className="d-flex align-items-center gap-2 px-2 py-1 rounded-3 border border-primary border-opacity-25"
                                style={{
                                    backgroundColor: "var(--bs-primary-bg-subtle)",
                                    width: "fit-content"
                                }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-2 bg-primary text-white"
                                    style={{ width: 28, height: 28, flexShrink: 0 }}
                                >
                                    <i className="bi bi-calendar-event small" />
                                </div>

                                <div>
                                    <div className="small text-body-secondary">Eventos</div>
                                    <div className="fw-bold lh-1">
                                        {
                                            registrosFiltrados.filter(
                                                (registro) => registro.tipoRegistro === "EVENTO"
                                            ).length
                                        }
                                    </div>
                                </div>
                            </div>

                            <div
                                className="d-flex align-items-center gap-2 px-2 py-1 rounded-3 border border-success border-opacity-25"
                                style={{
                                    backgroundColor: "var(--bs-success-bg-subtle)",
                                    width: "fit-content"
                                }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-2 bg-success text-white"
                                    style={{ width: 28, height: 28, flexShrink: 0 }}
                                >
                                    <i className="bi bi-check2-circle small" />
                                </div>

                                <div>
                                    <div className="small text-body-secondary">Actividades</div>
                                    <div className="fw-bold lh-1">
                                        {
                                            registrosFiltrados.filter(
                                                (registro) => registro.tipoRegistro === "ACTIVIDAD"
                                            ).length
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selector de fecha y leyenda */}
                        <div className="border rounded-4 p-3 mb-4 bg-body-tertiary">
                            <Row className="align-items-end g-3">
                                <Col xs={12} md={5} lg={4}>
                                    <Form.Label className="small fw-semibold mb-2">
                                        <i className="bi bi-calendar-event text-primary me-2" />
                                        Ir a una fecha
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        size="sm"
                                        className="rounded-3 bg-body"
                                        value={fechaSeleccionada}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                seleccionarDia(e.target.value);
                                            }
                                        }}
                                        aria-label="Ir a una fecha"
                                    />
                                </Col>

                                <Col xs={12} md>
                                    <div className="d-flex align-items-center flex-wrap gap-3 gap-lg-4">
                                        <span className="small fw-semibold text-body-secondary">
                                            Referencias
                                        </span>

                                        <span className="d-inline-flex align-items-center gap-2 small">
                                            <span
                                                className="rounded-2 bg-primary"
                                                style={{ width: 10, height: 10 }}
                                            />
                                            Eventos
                                        </span>

                                        <span className="d-inline-flex align-items-center gap-2 small">
                                            <span
                                                className="rounded-2 bg-success"
                                                style={{ width: 10, height: 10 }}
                                            />
                                            Actividades
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Calendario */}
                        {cargando ? (
                            <div className="d-flex flex-column align-items-center py-5">
                                <Spinner
                                    animation="border"
                                    variant="primary"
                                    className="mb-3"
                                />
                                <span className="small text-body-secondary">
                                    Cargando calendario...
                                </span>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="border border-2 rounded-4 overflow-hidden"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                                        backgroundColor: "var(--bs-border-color)"
                                    }}
                                >
                                    {/* Encabezados de los días */}
                                    {DIAS_SEMANA.map((dia) => (
                                        <div
                                            key={dia}
                                            className="text-center small fw-bold text-body-secondary bg-body-tertiary border-end border-bottom py-3"
                                        >
                                            {dia}
                                        </div>
                                    ))}

                                    {/* Días del mes */}
                                    {diasCalendario.map((dia) => {
                                        const registrosDia = registrosPorDia[dia.fecha] || [];
                                        const seleccionado = fechaSeleccionada === dia.fecha;

                                        return (
                                            <button
                                                key={dia.fecha}
                                                type="button"
                                                onClick={() => seleccionarDia(dia.fecha)}
                                                aria-label={`Seleccionar ${dia.fecha}`}
                                                aria-pressed={seleccionado}
                                                className={[
                                                    "d-flex flex-column align-items-stretch text-start",
                                                    "border-0 border-end border-bottom p-1 p-sm-2 p-lg-3",
                                                    seleccionado
                                                        ? "bg-primary bg-opacity-10"
                                                        : dia.perteneceMes
                                                            ? "bg-body"
                                                            : "bg-body-tertiary",
                                                    !dia.perteneceMes
                                                        ? "text-secondary"
                                                        : "text-body"
                                                ].join(" ")}
                                                style={{
                                                    minWidth: 0,
                                                    minHeight: "clamp(88px, 10vw, 124px)",
                                                    cursor: "pointer",
                                                    boxShadow: seleccionado
                                                        ? "inset 0 0 0 2px var(--bs-primary)"
                                                        : "none",
                                                    transition: "background-color 0.15s ease"
                                                }}
                                            >
                                                {/* Número del día */}
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span
                                                        className="d-inline-flex align-items-center justify-content-center rounded-circle fw-semibold"
                                                        style={{
                                                            width: 30,
                                                            height: 30,
                                                            flexShrink: 0,
                                                            fontSize: 13,
                                                            backgroundColor: dia.esHoy
                                                                ? "var(--bs-primary)"
                                                                : "transparent",
                                                            color: dia.esHoy
                                                                ? "#fff"
                                                                : "var(--bs-body-color)",
                                                            outline:
                                                                seleccionado && !dia.esHoy
                                                                    ? "2px solid var(--bs-primary)"
                                                                    : "none",
                                                            outlineOffset: -1
                                                        }}
                                                    >
                                                        {dia.numero}
                                                    </span>

                                                    {registrosDia.length > 0 && (
                                                        <span
                                                            className="d-inline-flex align-items-center justify-content-center rounded-pill bg-body-tertiary border text-body-secondary fw-semibold"
                                                            style={{
                                                                minWidth: 22,
                                                                height: 22,
                                                                padding: "0 5px",
                                                                fontSize: 11
                                                            }}
                                                        >
                                                            {registrosDia.length}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Registros del día */}
                                                <div className="d-flex flex-column gap-1">
                                                    {registrosDia.slice(0, 2).map((registro) => {
                                                        const esEvento =
                                                            registro.tipoRegistro === "EVENTO";

                                                        return (
                                                            <div
                                                                key={`${registro.tipoRegistro}-${registro.id}`}
                                                                className="d-flex align-items-center gap-1 rounded-2 px-1 px-sm-2 py-1 fw-medium"
                                                                style={{
                                                                    backgroundColor: esEvento
                                                                        ? "var(--bs-primary-bg-subtle)"
                                                                        : "var(--bs-success-bg-subtle)",
                                                                    color: esEvento
                                                                        ? "var(--bs-primary-text-emphasis)"
                                                                        : "var(--bs-success-text-emphasis)",
                                                                    minWidth: 0,
                                                                    borderLeft: `3px solid var(--bs-${esEvento ? "primary" : "success"})`
                                                                }}
                                                                title={obtenerNombre(registro)}
                                                            >
                                                                <i
                                                                    className={`bi ${
                                                                        esEvento
                                                                            ? "bi-calendar-event"
                                                                            : "bi-check-circle"
                                                                    }`}
                                                                    style={{
                                                                        fontSize: 10,
                                                                        flexShrink: 0
                                                                    }}
                                                                />

                                                                <span
                                                                    className="small"
                                                                    style={{
                                                                        fontSize: "clamp(9px, 0.8vw, 12px)",
                                                                        lineHeight: 1.4,
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        minWidth: 0
                                                                    }}
                                                                >
                                                                    {obtenerNombre(registro)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}

                                                    {registrosDia.length > 2 && (
                                                        <span
                                                            className="small text-body-secondary px-1"
                                                            style={{ fontSize: 11 }}
                                                        >
                                                            +{registrosDia.length - 2} más
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Pie */}
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-3 pt-3 border-top">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-info-circle text-primary" />
                                        <span className="small text-body-secondary">
                                            Selecciona un día para consultar sus registros.
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="rounded-3 align-self-start align-self-sm-auto fw-semibold"
                                        onClick={irAHoy}
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-2" />
                                        Volver a hoy
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card.Body>
                </Card>
            )}
            {vistaAgenda === "mes" && (
                <>
                    <div
                        className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3"
                    >
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-calendar2-week text-primary fs-5" />
                            <h2 className="h5 fw-bold mb-0">
                                Detalle del día
                            </h2>
                        </div>

                        <p className="small text-secondary text-capitalize mb-0">
                            {formatearDia(fechaSeleccionada)}
                        </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                        <Badge bg="success" className="rounded-pill px-3 py-2">
                            {cantidadActividades} actividades
                        </Badge>

                        <Badge bg="primary" className="rounded-pill px-3 py-2">
                            {cantidadEventos} eventos
                        </Badge>
                    </div>
                </div>

            {cargando ? (
                <Card className="bg-body text-body border border-secondary border-opacity-25 shadow-sm rounded-4">
                    <Card.Body className="d-flex justify-content-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </Card.Body>
                </Card>
            ) : registrosDelDia.length === 0 ? (
                <Card className="bg-body text-body border border-secondary border-opacity-25 shadow-sm rounded-4">
                    <Card.Body className="py-4">
                        <EmptyState
                            icon="bi-calendar2-check"
                            title="Día sin registros"
                            description="No hay actividades ni eventos programados para esta fecha."
                        />
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-3">
                    {registrosDelDia.map((registro) => {
                        const esEvento =
                            registro.tipoRegistro === "EVENTO";

                        const productoresAsignados = esEvento
                            ? []
                            : obtenerProductoresAsignados(registro);

                        return (
                            <Col
                                key={`${registro.tipoRegistro}-${registro.id}`}
                                md={6}
                                xl={4}
                            >
                                <Card className="h-100 bg-body text-body border border-secondary border-opacity-25 shadow-sm rounded-4 overflow-hidden">
                                    <div
                                        className={esEvento ? "bg-primary" : "bg-success"}
                                        style={{ height: 4 }}
                                    />

                                    <Card.Body className="p-3 p-lg-4">
                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                            <div className="d-flex flex-wrap align-items-center gap-2">
                                                <Badge
                                                    bg={esEvento ? "primary" : "success"}
                                                    className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                    style={{
                                                        minHeight: 25,
                                                        fontSize: "0.73rem",
                                                        lineHeight: 1.1
                                                    }}
                                                >
                                                    <i
                                                        className={`bi ${
                                                            esEvento
                                                                ? "bi-calendar-event"
                                                                : "bi-list-check"
                                                        } me-1`}
                                                    />
                                                    {esEvento ? "Evento" : "Actividad"}
                                                </Badge>

                                                {!esEvento && (
                                                    <Badge
                                                        bg="info"
                                                        className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                        style={{
                                                            minHeight: 25,
                                                            fontSize: "0.73rem",
                                                            lineHeight: 1.1,
                                                            color: "#ffffff"
                                                        }}
                                                    >
                                                        {TIPOS_ACTIVIDAD.find(
                                                            (tipo) => tipo.value === registro.tipo
                                                        )?.label || "Sin tipo"}
                                                    </Badge>
                                                )}
                                            </div>

                                            <Badge
                                                bg={obtenerVarianteEstado(registro.estado)}
                                                className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                style={{
                                                    minHeight: 25,
                                                    fontSize: "0.73rem",
                                                    lineHeight: 1.1,
                                                    flexShrink: 0,
                                                    ...(registro.estado === "PENDIENTE"
                                                        ? {
                                                            backgroundColor: "#f0ad00",
                                                            color: "#ffffff"
                                                        }
                                                        : {})
                                                }}
                                            >
                                                {registro.estado
                                                    ? formatearEstado(registro.estado)
                                                    : "Sin estado"}
                                            </Badge>
                                        </div>

                                        <h3
                                            className="h6 fw-bold mb-2"
                                            style={{
                                                minHeight: "2.5rem",
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical",
                                                WebkitLineClamp: 2,
                                                overflow: "hidden"
                                            }}
                                            title={obtenerNombre(registro)}
                                        >
                                            {obtenerNombre(registro)}
                                        </h3>

                                        <p
                                            className="small text-body-secondary mb-4"
                                            style={{
                                                minHeight: "3rem",
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical",
                                                WebkitLineClamp: 2,
                                                overflow: "hidden"
                                            }}
                                            title={
                                                registro.observaciones ||
                                                registro.descripcion ||
                                                registro.tipoEvento?.descripcion ||
                                                ""
                                            }
                                        >
                                            {registro.observaciones ||
                                                registro.descripcion ||
                                                registro.tipoEvento?.descripcion ||
                                                " "}
                                        </p>

                                        <div className="d-flex flex-column gap-3 small">
                                            <div className="d-flex align-items-start gap-3">
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <i className="bi bi-clock" />
                                                </div>

                                                <div className="pt-1">
                                                    <div className="text-body-secondary mb-1">
                                                        Inicio
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {formatearFecha(registro.inicio)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-start gap-3">
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <i className="bi bi-clock-history" />
                                                </div>

                                                <div className="pt-1">
                                                    <div className="text-body-secondary mb-1">
                                                        Término
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {formatearFecha(registro.fin)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-start gap-3">
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <i className="bi bi-geo-alt" />
                                                </div>

                                                <div className="pt-1">
                                                    <div className="text-body-secondary mb-1">
                                                        Lugar
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {registro.lugar || "Sin lugar definido"}
                                                    </div>
                                                </div>
                                            </div>

                                            {esEvento && (
                                                <>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                            <i className="bi bi-people" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-body-secondary mb-1">Asistentes</div>
                                                            <div className="fw-semibold">{registro.asistentes ?? "Sin definir"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                            <i className="bi bi-person" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-body-secondary mb-1">Cliente</div>
                                                            <div className="fw-semibold">
                                                                {registro.cliente?.tipo === "EMPRESA"
                                                                    ? registro.cliente.empresa?.razonSocial || "Cliente empresa"
                                                                    : `${registro.cliente?.persona?.nombres || ""} ${registro.cliente?.persona?.apellidos || ""}`.trim() || "Cliente no disponible"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                            <i className="bi bi-person-badge" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-body-secondary mb-1">Productor asignado</div>
                                                            <div className="fw-semibold">
                                                                {registro.productor
                                                                    ? `${registro.productor.nombres || ""} ${registro.productor.apellidos || ""}`.trim() || "Productor sin nombre"
                                                                    : "Productor no asignado"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {registro.observaciones && (
                                                        <div className="d-flex align-items-start gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                                <i className="bi bi-card-text" />
                                                            </div>
                                                            <div className="pt-1">
                                                                <div className="text-body-secondary mb-1">Observaciones</div>
                                                                <div className="fw-semibold" style={{ whiteSpace: "pre-wrap" }}>{registro.observaciones}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {!esEvento && registro.evento && (
                                                <>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                            <i className="bi bi-calendar-event" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-body-secondary mb-1">Evento relacionado</div>
                                                            <div className="fw-semibold">
                                                                {registro.evento.tipoEvento?.nombre || "Evento contratado"}
                                                            </div>
                                                            <div className="text-body-secondary mt-1">
                                                                {formatearFecha(registro.evento.inicio)}
                                                                {registro.evento.fin ? ` – ${formatearFecha(registro.evento.fin)}` : ""}
                                                            </div>
                                                            <div className="text-body-secondary">
                                                                {registro.evento.lugar || "Sin lugar definido"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                            <i className="bi bi-person" />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="text-body-secondary mb-1">Cliente relacionado</div>
                                                            <div className="fw-semibold">
                                                                {obtenerNombreCliente(registro.evento.cliente)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!esEvento && (
                                            <div className="bg-body-tertiary text-body rounded-3 p-3 mt-3 border border-secondary border-opacity-10">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <i className="bi bi-people text-primary fs-5" />

                                                    <span className="fw-semibold">
                                                        Productores asignados
                                                    </span>

                                                    <Badge bg="secondary" pill>
                                                        {productoresAsignados.length}
                                                    </Badge>
                                                </div>

                                                {productoresAsignados.length === 0 ? (
                                                    <p className="small text-body-secondary mb-0">
                                                        No hay productores asignados.
                                                    </p>
                                                ) : (
                                                    <div className="d-flex flex-column gap-2">
                                                        {productoresAsignados.map((productor, indice) => (
                                                            <div
                                                                key={productor.id ?? indice}
                                                                className="d-flex align-items-center justify-content-between gap-2"
                                                            >
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <i className="bi bi-person-circle text-secondary fs-5" />

                                                                    <span className="small fw-medium">
                                                                        {productor.nombre}
                                                                    </span>
                                                                </div>

                                                                {productor.esResponsable && (
                                                                    <Badge
                                                                        bg="primary"
                                                                        className="rounded-pill text-nowrap"
                                                                    >
                                                                        Responsable
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!esEvento && (
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    {registro.estado === "PENDIENTE" && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => completarActividadPendiente(registro)}
                                                            disabled={cambiandoEstadoActividad}
                                                        >
                                                            <i className="bi bi-check2-circle me-1" />
                                                            Completar
                                                        </Button>
                                                    )}

                                                    {!esAdmin && registro.estado === "COMPLETADA" && (
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => marcarActividadPendiente(registro)}
                                                            disabled={cambiandoEstadoActividad}
                                                        >
                                                            <i className="bi bi-arrow-counterclockwise me-1" />
                                                            Marcar pendiente
                                                        </Button>
                                                    )}

                                                    {(registro.estado !== "CANCELADA" || esAdmin) && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => abrirEdicionActividad(registro)}
                                                        >
                                                            <i className="bi bi-pencil me-1" />
                                                            Editar
                                                        </Button>
                                                    )}

                                                    {registro.estado !== "CANCELADA" && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => anularActividad(registro)}
                                                        >
                                                            <i className="bi bi-x-circle me-1" />
                                                            Cancelar
                                                        </Button>
                                                    )}

                                                    {registro.estado === "CANCELADA" && esAdmin && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => setActividadReactivando(registro)}
                                                            disabled={cambiandoEstadoActividad}
                                                        >
                                                            <i className="bi bi-arrow-counterclockwise me-1" />
                                                            Reactivar
                                                        </Button>
                                                    )}

                                                    {esAdmin && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="rounded-3 flex-fill py-2"
                                                            onClick={() => solicitarEliminacionFisica(registro)}
                                                        >
                                                            <i className="bi bi-trash me-1" />
                                                            Eliminar
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
                </>
            )}

        </>
    );
}
