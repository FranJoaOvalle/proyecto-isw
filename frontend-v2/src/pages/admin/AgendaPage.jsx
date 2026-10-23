import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
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

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const obtenerFechaLocal = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};

const obtenerNombre = (registro) => {
    if (registro.tipoRegistro === "ACTIVIDAD") {
        return registro.titulo || "Actividad";
    }

    return registro.tipoEvento?.nombre || "Evento";
};

const formatearFecha = (fecha) => {
    if (!fecha) return "Sin definir";

    return new Date(fecha).toLocaleString("es-CL", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const formatearDia = (fecha) =>
    new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

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

    return variantes[estado] || "secondary";
};

const formatearEstado = (estado) => {
    if (!estado) return "";

    const texto = estado.replaceAll("_", " ").toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const obtenerRegistrosDelDia = (registros, fecha) => {
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(inicioDia);
    finDia.setDate(finDia.getDate() + 1);

    return registros.filter((registro) => {
        const inicioRegistro = new Date(registro.inicio);

        if (Number.isNaN(inicioRegistro.getTime())) {
            return false;
        }

        const finRegistro = registro.fin
            ? new Date(registro.fin)
            : inicioRegistro;

        return inicioRegistro < finDia && finRegistro >= inicioDia;
    });
};

export default function AgendaPage() {
    const hoy = obtenerFechaLocal(new Date());

    const [registros, setRegistros] = useState([]);

    const [mesVisible, setMesVisible] = useState(() => {
        const fecha = new Date();
        fecha.setDate(1);
        return fecha;
    });

    const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // Carga todos los registros para navegar libremente por el calendario.
    useEffect(() => {
        let activo = true;

        const cargarAgenda = async () => {
            try {
                setCargando(true);
                setError("");

                const datos = await getAgenda();

                if (activo) {
                    setRegistros(datos);
                }
            } catch (err) {
                if (activo) {
                    setError(
                        err.response?.data?.error?.message ||
                        "No fue posible cargar la agenda."
                    );
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        };

        cargarAgenda();

        return () => {
            activo = false;
        };
    }, []);

    // Construye las semanas del mes visible.
    const diasCalendario = useMemo(() => {
        const anio = mesVisible.getFullYear();
        const mes = mesVisible.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const desplazamiento = (primerDia.getDay() + 6) % 7;
        const cantidadDias = new Date(anio, mes + 1, 0).getDate();

        const totalCeldas =
            Math.ceil((desplazamiento + cantidadDias) / 7) * 7;

        return Array.from({ length: totalCeldas }, (_, indice) => {
            const fecha = new Date(
                anio,
                mes,
                indice - desplazamiento + 1
            );

            return {
                fecha: obtenerFechaLocal(fecha),
                numero: fecha.getDate(),
                perteneceMes: fecha.getMonth() === mes,
                esHoy: obtenerFechaLocal(fecha) === hoy
            };
        });
    }, [mesVisible, hoy]);

    // Organiza los registros para mostrarlos en cada día.
    const registrosPorDia = useMemo(() => {
        const mapa = {};

        registros.forEach((registro) => {
            const comienzo = new Date(registro.inicio);

            if (Number.isNaN(comienzo.getTime())) return;

            const termino = registro.fin
                ? new Date(registro.fin)
                : comienzo;

            const cursor = new Date(comienzo);
            cursor.setHours(0, 0, 0, 0);

            const ultimoDia = new Date(termino);
            ultimoDia.setHours(0, 0, 0, 0);

            while (cursor <= ultimoDia) {
                const fecha = obtenerFechaLocal(cursor);

                if (!mapa[fecha]) {
                    mapa[fecha] = [];
                }

                const yaExiste = mapa[fecha].some(
                    (item) =>
                        item.tipoRegistro === registro.tipoRegistro &&
                        item.id === registro.id
                );

                if (!yaExiste) {
                    mapa[fecha].push(registro);
                }

                cursor.setDate(cursor.getDate() + 1);
            }
        });

        return mapa;
    }, [registros]);

    const registrosDelDia = obtenerRegistrosDelDia(
        registros,
        fechaSeleccionada
    );

    const cantidadActividades = registrosDelDia.filter(
        (registro) => registro.tipoRegistro === "ACTIVIDAD"
    ).length;

    const cantidadEventos = registrosDelDia.filter(
        (registro) => registro.tipoRegistro === "EVENTO"
    ).length;

    const cambiarMes = (cantidad) => {
        setMesVisible((actual) =>
            new Date(
                actual.getFullYear(),
                actual.getMonth() + cantidad,
                1
            )
        );

        setRegistroSeleccionado(null);
    };

    const irAHoy = () => {
        const fecha = new Date();
        fecha.setDate(1);

        setMesVisible(fecha);
        setFechaSeleccionada(hoy);
        setRegistroSeleccionado(null);
    };

    const seleccionarDia = (fecha) => {
        setFechaSeleccionada(fecha);
        setRegistroSeleccionado(null);

        const fechaElegida = new Date(`${fecha}T12:00:00`);

        if (
            fechaElegida.getMonth() !== mesVisible.getMonth() ||
            fechaElegida.getFullYear() !== mesVisible.getFullYear()
        ) {
            setMesVisible(
                new Date(
                    fechaElegida.getFullYear(),
                    fechaElegida.getMonth(),
                    1
                )
            );
        }
    };

    const seleccionarRegistro = (registro) => {
        setRegistroSeleccionado((actual) => {
            if (
                actual?.tipoRegistro === registro.tipoRegistro &&
                actual?.id === registro.id
            ) {
                return null;
            }

            return registro;
        });
    };

    return (
        <Container fluid="xl" className="pt-5 pb-4 px-3 px-lg-4">
            <PageHeader
                title="Agenda"
                description="Toda la planificación de tus actividades y eventos en un solo lugar."
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

            {/* Calendario mensual */}
            <Card className="bg-body text-body border border-secondary border-opacity-25 shadow-sm rounded-4 mb-4 overflow-hidden">
                <Card.Body className="p-0">
                    <div className="p-3 p-md-4 border-bottom">
                        <Row className="align-items-center g-3">
                            <Col>
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-4 bg-primary text-white shadow-sm"
                                        style={{
                                            width: 52,
                                            height: 52,
                                            flexShrink: 0
                                        }}
                                    >
                                        <i className="bi bi-calendar3 fs-3" />
                                    </div>

                                    <div>
                                        <h2 className="h4 text-capitalize fw-bold mb-1">
                                            {mesVisible.toLocaleDateString("es-CL", {
                                                month: "long",
                                                year: "numeric"
                                            })}
                                        </h2>
                                        <p className="small text-secondary mb-0">
                                            Vista mensual de tu planificación
                                        </p>
                                    </div>
                                </div>
                            </Col>

                            <Col xs="auto">
                                <div className="d-flex flex-wrap align-items-end justify-content-end gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        className="rounded-3"
                                        onClick={() => cambiarMes(-1)}
                                        aria-label="Mes anterior"
                                    >
                                        <i className="bi bi-chevron-left" />
                                    </Button>

                                    <Form.Group style={{ width: 155 }}>
                                        <Form.Label className="small fw-semibold mb-1">
                                            Ir a una fecha
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={fechaSeleccionada}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    seleccionarDia(e.target.value);
                                                }
                                            }}
                                            aria-label="Ir a una fecha"
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="outline-primary"
                                        className="rounded-3"
                                        onClick={irAHoy}
                                    >
                                        Hoy
                                    </Button>

                                    <Button
                                        variant="outline-secondary"
                                        className="rounded-3"
                                        onClick={() => cambiarMes(1)}
                                        aria-label="Mes siguiente"
                                    >
                                        <i className="bi bi-chevron-right" />
                                    </Button>
                                </div>
                            </Col>
                        </Row>

                        <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                            <span className="d-flex align-items-center gap-2 small text-secondary">
                                <span
                                    className="rounded-circle bg-success"
                                    style={{ width: 9, height: 9 }}
                                />
                                Actividades
                            </span>

                            <span className="d-flex align-items-center gap-2 small text-secondary">
                                <span
                                    className="rounded-circle bg-primary"
                                    style={{ width: 9, height: 9 }}
                                />
                                Eventos
                            </span>

                            <span className="d-flex align-items-center gap-2 small text-secondary">
                                <span
                                    className="rounded-circle border border-primary border-2"
                                    style={{ width: 10, height: 10 }}
                                />
                                Día seleccionado
                            </span>

                            <span className="ms-auto small text-secondary">
                                {registros.length} registros
                            </span>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="d-flex flex-column align-items-center py-5">
                            <Spinner
                                animation="border"
                                variant="primary"
                                className="mb-3"
                            />
                            <span className="small text-secondary">
                                Cargando calendario...
                            </span>
                        </div>
                    ) : (
                        <div className="p-2 p-md-3">
                            <div
                                className="border border-secondary border-opacity-25 rounded-3 overflow-hidden"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))"
                                }}
                            >
                                {DIAS_SEMANA.map((dia) => (
                                    <div
                                        key={dia}
                                        className="text-center small fw-bold text-body-secondary bg-body-tertiary py-3 border-bottom"
                                    >
                                        {dia}
                                    </div>
                                ))}

                                {diasCalendario.map((dia) => {
                                    const registrosDia =
                                        registrosPorDia[dia.fecha] || [];

                                    const seleccionado =
                                        fechaSeleccionada === dia.fecha;

                                    return (
                                        <button
                                            key={dia.fecha}
                                            type="button"
                                            onClick={() => seleccionarDia(dia.fecha)}
                                            aria-label={`Seleccionar ${dia.fecha}`}
                                            aria-pressed={seleccionado}
                                            className={[
                                                "d-flex flex-column text-start border-0 border-end border-bottom",
                                                "p-1 p-md-2",
                                                seleccionado
                                                    ? "bg-primary bg-opacity-25"
                                                    : "bg-body",
                                                !dia.perteneceMes
                                                    ? "text-body-secondary"
                                                    : "text-body"
                                            ].join(" ")}
                                            style={{
                                                minWidth: 0,
                                                minHeight: "clamp(76px, 10vw, 132px)",
                                                cursor: "pointer",
                                                outline: seleccionado
                                                    ? "2px solid var(--bs-primary)"
                                                    : "none",
                                                outlineOffset: "-2px",
                                                borderColor: "var(--bs-border-color)",
                                                opacity: dia.perteneceMes ? 1 : 0.82
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span
                                                    className={[
                                                        "d-inline-flex align-items-center justify-content-center rounded-circle small",
                                                        dia.esHoy
                                                            ? "bg-primary text-white fw-bold"
                                                            : "fw-semibold"
                                                    ].join(" ")}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {dia.numero}
                                                </span>

                                                {registrosDia.length > 0 && (
                                                    <span
                                                        className="small text-body-secondary fw-semibold"
                                                        style={{ fontSize: 11 }}
                                                    >
                                                        {registrosDia.length}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="d-flex flex-column gap-1 w-100">
                                                {registrosDia.slice(0, 2).map((registro) => {
                                                    const esEvento =
                                                        registro.tipoRegistro === "EVENTO";

                                                    return (
                                                        <div
                                                            key={`${registro.tipoRegistro}-${registro.id}`}
                                                            className={[
                                                                "rounded-2 px-1 py-1 small",
                                                                esEvento
                                                                    ? "bg-primary bg-opacity-25 text-body fw-semibold"
                                                                    : "bg-success bg-opacity-25 text-body fw-semibold"
                                                            ].join(" ")}
                                                            style={{
                                                                fontSize: "clamp(10px, 0.85vw, 12px)",
                                                                lineHeight: 1.35,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                width: "100%"
                                                            }}
                                                            title={obtenerNombre(registro)}
                                                        >
                                                            <i
                                                                className={`bi ${
                                                                    esEvento
                                                                        ? "bi-calendar-event"
                                                                        : "bi-check2-circle"
                                                                } me-1`}
                                                            />
                                                            {obtenerNombre(registro)}
                                                        </div>
                                                    );
                                                })}

                                                {registrosDia.length > 2 && (
                                                    <span
                                                        className="small text-body-secondary fw-semibold px-1"
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

                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 px-1">
                                <span className="small text-secondary">
                                    <i className="bi bi-info-circle me-2" />
                                    Selecciona una fecha para ver sus actividades y eventos.
                                </span>

                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-decoration-none p-0"
                                    onClick={irAHoy}
                                >
                                    Volver a hoy
                                    <i className="bi bi-arrow-right ms-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Detalle del día */}
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
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

                        const seleccionado =
                            registroSeleccionado?.tipoRegistro ===
                                registro.tipoRegistro &&
                            registroSeleccionado?.id === registro.id;

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
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                                            <Badge
                                                bg={esEvento ? "primary" : "success"}
                                                className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                style={{ minHeight: 25, fontSize: "0.73rem", lineHeight: 1.1, flexShrink: 0 }}
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

                                            <Badge
                                                bg={obtenerVarianteEstado(registro.estado)}
                                                className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                style={{ minHeight: 25, fontSize: "0.73rem", lineHeight: 1.1, flexShrink: 0 }}
                                            >
                                                {registro.estado ? formatearEstado(registro.estado) : "Sin estado"}
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
                                            title={registro.descripcion || registro.tipoEvento?.descripcion || ""}
                                        >
                                            {registro.descripcion || registro.tipoEvento?.descripcion || " "}
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
                                        </div>

                                        {(esEvento
                                            ? registro.tipoEvento?.nombre || registro.asistentes !== undefined
                                            : registro.tipo) && (
                                            <div className="bg-body-tertiary text-body rounded-3 p-3 mt-4 border border-secondary border-opacity-10">
                                                {esEvento && registro.tipoEvento?.nombre && (
                                                    <p className="small mb-2">
                                                        <strong>Tipo de evento:</strong>{" "}
                                                        {registro.tipoEvento.nombre}
                                                    </p>
                                                )}

                                                {!esEvento && registro.tipo && (
                                                    <p className="small mb-0">
                                                        <strong>Tipo de actividad:</strong>{" "}
                                                        {String(registro.tipo)
                                                            .toLocaleLowerCase("es-CL")
                                                            .replace(/^./u, (letra) => letra.toLocaleUpperCase("es-CL"))}
                                                    </p>
                                                )}

                                                {esEvento && registro.asistentes !== undefined && (
                                                    <p className="small mb-0">
                                                        <strong>Asistentes:</strong>{" "}
                                                        {registro.asistentes}
                                                    </p>
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
        </Container>
    );
}