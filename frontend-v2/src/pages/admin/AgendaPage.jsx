import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Spinner
} from "react-bootstrap";

import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import api from "../../services/_api";
import { getAgenda } from "../../services/agenda.service";
import {
    crearActividad,
    actualizarActividad,
    cambiarEstadoActividad,
    cancelarActividad
} from "../../services/actividad.service";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TIPOS_ACTIVIDAD = [
    { value: "TAREA", label: "Tarea" },
    { value: "REUNION", label: "Reunión" },
    { value: "VISITA_RECINTO", label: "Visita a recinto" }
];

const obtenerFechaLocal = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};

const convertirAFechaHoraLocal = (fecha) => {
    if (!fecha) return "";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return "";

    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    const horas = String(valor.getHours()).padStart(2, "0");
    const minutos = String(valor.getMinutes()).padStart(2, "0");

    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
};

const obtenerNombre = (registro) => {
    if (registro.tipoRegistro === "ACTIVIDAD") {
        return registro.titulo || "Actividad";
    }

    return registro.tipoEvento?.nombre || "Evento";
};

const obtenerProductoresAsignados = (registro) => {
    if (!Array.isArray(registro.productores)) {
        return [];
    }

    return registro.productores.map((asignacion) => {
        const productor = asignacion.productor;

        return {
            id: asignacion.productorId,
            nombre: productor
                ? `${productor.nombres} ${productor.apellidos}`.trim()
                : "Productor sin nombre",
            esResponsable: asignacion.esResponsable
        };
    });
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
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "ADMIN";

    const [registros, setRegistros] = useState([]);
    const [productores, setProductores] = useState([]);
    const [productoresActividad, setProductoresActividad] = useState([]);

    const [mesVisible, setMesVisible] = useState(() => {
        const fecha = new Date();
        fecha.setDate(1);
        return fecha;
    });

    const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [cargandoProductores, setCargandoProductores] = useState(false);
    const [error, setError] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [actividadEditando, setActividadEditando] = useState(null);
    const [guardandoActividad, setGuardandoActividad] = useState(false);
    const [mensaje, setMensaje] = useState("");

    // Estados para confirmar la cancelación de una actividad.
    const [actividadCancelando, setActividadCancelando] = useState(null);
    const [cancelandoActividad, setCancelandoActividad] = useState(false);

    const [formActividad, setFormActividad] = useState({
        titulo: "",
        descripcion: "",
        tipo: "TAREA",
        inicio: `${hoy}T09:00`,
        fin: `${hoy}T10:00`,
        lugar: "",
        estado: "PENDIENTE"
    });

    useEffect(() => {
        let activo = true;

        const cargarAgenda = async () => {
            try {
                setCargando(true);
                setError("");

                const datos = await getAgenda();

                if (activo) {
                    setRegistros(Array.isArray(datos) ? datos : []);
                }
            } catch (err) {
                if (activo) {
                    setError(
                        err.response?.data?.error?.message ||
                        err.response?.data?.message ||
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

    useEffect(() => {
        let activo = true;

        const cargarProductores = async () => {
            try {
                setCargandoProductores(true);

                const response = await api.get("/productores");
                const lista = response.data.productores || [];

                if (activo) {
                    setProductores(
                        lista.filter((productor) => productor.usuario?.activo)
                    );
                }
            } catch (err) {
                if (activo) {
                    setError(
                        err.response?.data?.error?.message ||
                        err.response?.data?.message ||
                        "No fue posible cargar los productores."
                    );
                }
            } finally {
                if (activo) {
                    setCargandoProductores(false);
                }
            }
        };

        cargarProductores();

        return () => {
            activo = false;
        };
    }, []);

    const recargarAgenda = async () => {
        const datos = await getAgenda();
        setRegistros(Array.isArray(datos) ? datos : []);
    };

    const abrirNuevaActividad = () => {
        setActividadEditando(null);
        setProductoresActividad([]);

        setFormActividad({
            titulo: "",
            descripcion: "",
            tipo: "TAREA",
            inicio: `${fechaSeleccionada}T09:00`,
            fin: `${fechaSeleccionada}T10:00`,
            lugar: "",
            estado: "PENDIENTE"
        });

        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const abrirEdicionActividad = (actividad) => {
        setActividadEditando(actividad);

        setFormActividad({
            titulo: actividad.titulo || "",
            descripcion: actividad.descripcion || "",
            tipo: actividad.tipo || "TAREA",
            inicio: convertirAFechaHoraLocal(actividad.inicio),
            fin: convertirAFechaHoraLocal(actividad.fin),
            lugar: actividad.lugar || "",
            estado: actividad.estado === "CANCELADA"
                ? "PENDIENTE"
                : actividad.estado
        });

        setProductoresActividad(
            (actividad.productores || []).map((asignacion) => ({
                productorId: asignacion.productorId,
                esResponsable: asignacion.esResponsable
            }))
        );

        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const cambiarProductorAsignado = (productorId, seleccionado) => {
        setProductoresActividad((actuales) => {
            if (seleccionado) {
                if (
                    actuales.some(
                        (item) => item.productorId === productorId
                    )
                ) {
                    return actuales;
                }

                return [
                    ...actuales,
                    {
                        productorId,
                        esResponsable: actuales.length === 0
                    }
                ];
            }

            const eliminadoEraResponsable = actuales.some(
                (item) =>
                    item.productorId === productorId &&
                    item.esResponsable
            );

            const restantes = actuales.filter(
                (item) => item.productorId !== productorId
            );

            if (eliminadoEraResponsable && restantes.length > 0) {
                return restantes.map((item, indice) => ({
                    ...item,
                    esResponsable: indice === 0
                }));
            }

            return restantes;
        });
    };

    const cambiarResponsable = (productorId) => {
        setProductoresActividad((actuales) =>
            actuales.map((item) => ({
                ...item,
                esResponsable: item.productorId === productorId
            }))
        );
    };

    const guardarActividad = async (e) => {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (
            new Date(formActividad.fin) <=
            new Date(formActividad.inicio)
        ) {
            setError(
                "La fecha de término debe ser posterior a la fecha de inicio."
            );
            return;
        }

        if (!actividadEditando && productores.length === 0) {
            setError(
                "No hay productores activos disponibles para asignar."
            );
            return;
        }

        if (productoresActividad.length === 0) {
            setError("Debes asignar al menos un productor.");
            return;
        }

        if (
            productoresActividad.filter((item) => item.esResponsable).length !== 1
        ) {
            setError(
                "Debes seleccionar exactamente un productor responsable."
            );
            return;
        }

        try {
            setGuardandoActividad(true);

            const payload = {
                titulo: formActividad.titulo.trim(),
                descripcion: formActividad.descripcion.trim() || null,
                tipo: formActividad.tipo,
                inicio: new Date(formActividad.inicio).toISOString(),
                fin: new Date(formActividad.fin).toISOString(),
                lugar: formActividad.lugar.trim() || null
            };

            payload.productores = productoresActividad;

            if (actividadEditando) {
                await actualizarActividad(actividadEditando.id, payload);
                console.log("Estado original:", actividadEditando.estado);
                console.log("Estado seleccionado:", formActividad.estado);

                if (formActividad.estado !== actividadEditando.estado) {
                    await cambiarEstadoActividad(
                        actividadEditando.id,
                        formActividad.estado
                    );
                }

                setMensaje("Actividad actualizada correctamente.");
            } else {
                await crearActividad({
                    ...payload,
                    estado: "PENDIENTE"
                });

                setMensaje("Actividad creada correctamente.");
            }

            await recargarAgenda();
            setMostrarFormulario(false);
            setRegistroSeleccionado(null);
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                "No fue posible guardar la actividad."
            );
        } finally {
            setGuardandoActividad(false);
        }
    };

    // Abre el modal de confirmación sin cancelar inmediatamente.
    const anularActividad = (actividad) => {
        setError("");
        setMensaje("");
        setActividadCancelando(actividad);
    };

    // Cancela la actividad únicamente cuando el usuario confirma.
    const confirmarCancelacion = async () => {
        if (!actividadCancelando || cancelandoActividad) return;

        try {
            setCancelandoActividad(true);
            setError("");
            setMensaje("");

            await cancelarActividad(actividadCancelando.id);
            await recargarAgenda();

            setRegistroSeleccionado(null);
            setActividadCancelando(null);
            setMensaje("Actividad cancelada correctamente.");
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                "No fue posible cancelar la actividad."
            );
        } finally {
            setCancelandoActividad(false);
        }
    };

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

            {error && !mostrarFormulario && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            <div className="d-flex justify-content-end mb-3">
                <Button
                    variant="primary"
                    className="rounded-3"
                    onClick={abrirNuevaActividad}
                >
                    <i className="bi bi-plus-lg me-2" />
                    Nueva actividad
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
                                            {mesVisible.toLocaleDateString(
                                                "es-CL",
                                                {
                                                    month: "long",
                                                    year: "numeric"
                                                }
                                            )}
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
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                                            <Badge
                                                bg={esEvento ? "primary" : "success"}
                                                className="rounded-pill px-2 py-1 d-inline-flex align-items-center justify-content-center text-nowrap"
                                                style={{
                                                    minHeight: 25,
                                                    fontSize: "0.73rem",
                                                    lineHeight: 1.1,
                                                    flexShrink: 0
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
                                                registro.descripcion ||
                                                registro.tipoEvento?.descripcion ||
                                                ""
                                            }
                                        >
                                            {registro.descripcion ||
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

                                        {!esEvento &&
                                            (registro.estado !== "CANCELADA" || esAdmin) && (
                                                <div className="d-flex gap-2 mt-3">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="rounded-3 flex-fill py-2"
                                                        onClick={() => abrirEdicionActividad(registro)}
                                                    >
                                                        <i className="bi bi-pencil me-1" />
                                                        Editar
                                                    </Button>

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
                                                </div>
                                            )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Formulario para crear o editar actividades */}
            <Modal
                show={mostrarFormulario}
                onHide={() => {
                    if (!guardandoActividad) {
                        setMostrarFormulario(false);
                    }
                }}
                centered
            >
                <Form onSubmit={guardarActividad}>
                    <Modal.Header closeButton={!guardandoActividad}>
                        <Modal.Title>
                            {actividadEditando
                                ? "Editar actividad"
                                : "Nueva actividad"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Título *</Form.Label>
                            <Form.Control
                                required
                                minLength={2}
                                maxLength={100}
                                value={formActividad.titulo}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        titulo: e.target.value
                                    })
                                }
                                placeholder="Ej. Reunión de coordinación"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                maxLength={2000}
                                value={formActividad.descripcion}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        descripcion: e.target.value
                                    })
                                }
                                placeholder="Describe las tareas o el objetivo de la actividad"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de actividad *</Form.Label>
                            <Form.Select
                                required
                                value={formActividad.tipo}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        tipo: e.target.value
                                    })
                                }
                            >
                                {TIPOS_ACTIVIDAD.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        {actividadEditando && (
                            <Form.Group className="mb-3">
                                <Form.Label>Estado de la actividad *</Form.Label>
                                <Form.Select
                                    value={formActividad.estado}
                                    onChange={(e) =>
                                        setFormActividad((anterior) => ({
                                            ...anterior,
                                            estado: e.target.value
                                        }))
                                    }
                                >
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="COMPLETADA">Completada</option>
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Inicio *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={formActividad.inicio}
                                        onChange={(e) =>
                                            setFormActividad({
                                                ...formActividad,
                                                inicio: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Término *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={formActividad.fin}
                                        onChange={(e) =>
                                            setFormActividad({
                                                ...formActividad,
                                                fin: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Lugar</Form.Label>
                            <Form.Control
                                maxLength={200}
                                value={formActividad.lugar}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        lugar: e.target.value
                                    })
                                }
                                placeholder="Lugar donde se realizará"
                            />
                        </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Productores asignados *</Form.Label>

                                {cargandoProductores ? (
                                    <div className="d-flex align-items-center gap-2 text-secondary py-2">
                                        <Spinner size="sm" />
                                        <span className="small">
                                            Cargando productores...
                                        </span>
                                    </div>
                                ) : productores.length === 0 ? (
                                    <Alert variant="warning" className="mb-0">
                                        No hay productores activos disponibles.
                                    </Alert>
                                ) : (
                                    <div className="border rounded-3 px-3">
                                        {productores.map((productor) => {
                                            const asignado =
                                                productoresActividad.find(
                                                    (item) =>
                                                        item.productorId === productor.id
                                                );

                                            return (
                                                <div
                                                    key={productor.id}
                                                    className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 border-bottom"
                                                >
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`productor-${productor.id}`}
                                                        label={`${productor.nombres} ${productor.apellidos}`}
                                                        checked={Boolean(asignado)}
                                                        onChange={(e) =>
                                                            cambiarProductorAsignado(
                                                                productor.id,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />

                                                    {asignado && (
                                                        <Form.Check
                                                            type="radio"
                                                            name="productorResponsable"
                                                            id={`responsable-${productor.id}`}
                                                            label="Responsable"
                                                            checked={asignado.esResponsable}
                                                            onChange={() =>
                                                                cambiarResponsable(productor.id)
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <Form.Text className="text-body-secondary">
                                    Selecciona al menos un productor y marca
                                    exactamente uno como responsable. El primero
                                    seleccionado queda como responsable inicialmente.
                                </Form.Text>
                            </Form.Group>

                        {error && (
                            <Alert variant="danger" className="mt-3 mb-0">
                                {error}
                            </Alert>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setMostrarFormulario(false)}
                            disabled={guardandoActividad}
                        >
                            Cerrar
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                guardandoActividad ||
                                (!actividadEditando &&
                                    (cargandoProductores || productores.length === 0))
                            }
                        >
                            {guardandoActividad ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar actividad"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de confirmación para cancelar una actividad */}
            <ConfirmModal
                show={Boolean(actividadCancelando)}
                onHide={() => {
                    if (!cancelandoActividad) {
                        setActividadCancelando(null);
                    }
                }}
                onConfirm={confirmarCancelacion}
                title="Cancelar actividad"
                confirmText="Sí, cancelar"
                variant="danger"
                loading={cancelandoActividad}
            >
                ¿Estás seguro de que deseas cancelar la actividad{" "}
                <strong>
                    «{actividadCancelando?.titulo}»
                </strong>
                ?
            </ConfirmModal>
        </Container>
    );
}