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
    cancelarActividad,
    eliminarFisicamenteActividad
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
    const [actividadEliminando, setActividadEliminando] = useState(null);
    const [eliminandoActividad, setEliminandoActividad] = useState(false);

    const [filtros, setFiltros] = useState({
        estado: "",
        tipo: "",
        productorResponsable: ""
    });

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

        // Abre el modal de confirmación para eliminar físicamente una actividad.
    const solicitarEliminacionFisica = (actividad) => {
        setError("");
        setMensaje("");
        setActividadEliminando(actividad);
    };

    // Elimina definitivamente la actividad cuando ADMIN confirma.
    const confirmarEliminacionFisica = async () => {
        if (!actividadEliminando || eliminandoActividad) return;

        try {
            setEliminandoActividad(true);
            setError("");
            setMensaje("");

            await eliminarFisicamenteActividad(actividadEliminando.id);
            await recargarAgenda();

            setRegistroSeleccionado(null);
            setActividadEliminando(null);
            setMensaje("Actividad eliminada definitivamente.");
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                "No fue posible eliminar físicamente la actividad."
            );
        } finally {
            setEliminandoActividad(false);
        }
    };

    const registrosFiltrados = useMemo(() => {
        return registros.filter((registro) => {
            // Los eventos se mantienen visibles.
            if (registro.tipoRegistro === "EVENTO") {
                return true;
            }

            // Filtrar por estado de la actividad.
            if (
                filtros.estado &&
                registro.estado !== filtros.estado
            ) {
                return false;
            }

            // Filtrar por tipo de actividad.
            if (
                filtros.tipo &&
                registro.tipo !== filtros.tipo
            ) {
                return false;
            }

            // Filtrar por productor responsable.
            if (filtros.productorResponsable) {
                const tieneResponsable = (registro.productores || []).some(
                    (asignacion) =>
                        asignacion.esResponsable &&
                        String(asignacion.productorId) ===
                            filtros.productorResponsable
                );

                if (!tieneResponsable) {
                    return false;
                }
            }

            return true;
        });
    }, [registros, filtros]);

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

        registrosFiltrados.forEach((registro) => {
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
    }, [registrosFiltrados]);

    const registrosDelDia = obtenerRegistrosDelDia(
        registrosFiltrados,
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

            {/* Calendario mensual */}
            <Card className="bg-body text-body border rounded-4 mb-4 overflow-hidden shadow">
                <div className="bg-primary" style={{ height: 5 }} />

                <Card.Body className="p-3 p-lg-4">
                    {/* Encabezado */}
                    <Row className="align-items-center g-3 mb-4">
                        <Col xs={12} lg>
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                                    style={{ width: 54, height: 54, flexShrink: 0 }}
                                >
                                    <i className="bi bi-calendar3 fs-3" />
                                </div>

                                <div className="min-w-0">
                                    <div className="small fw-bold text-primary mb-1">
                                        MI AGENDA
                                    </div>

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
                        </Col>

                        <Col xs={12} lg="auto">
                            <div className="d-flex align-items-center justify-content-between justify-content-lg-end gap-2">
                                <div className="d-flex align-items-center gap-1 p-1 rounded-3 border bg-body-tertiary">
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="rounded-2 border-0 bg-transparent text-body"
                                        onClick={() => cambiarMes(-1)}
                                        aria-label="Mes anterior"
                                    >
                                        <i className="bi bi-chevron-left" />
                                    </Button>

                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="rounded-2 border-0 bg-transparent text-body"
                                        onClick={() => cambiarMes(1)}
                                        aria-label="Mes siguiente"
                                    >
                                        <i className="bi bi-chevron-right" />
                                    </Button>
                                </div>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="rounded-3 fw-semibold px-3 shadow-sm"
                                    onClick={irAHoy}
                                >
                                    <i className="bi bi-calendar-check me-2" />
                                    Hoy
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {/* Filtros de la agenda */}
                    <Card className="bg-body text-body border rounded-4 mb-4">
                        <Card.Body className="p-3 p-lg-4">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <div>
                                    <h2 className="h6 fw-bold mb-1">
                                        <i className="bi bi-sliders2 text-primary me-2" />
                                        Filtrar agenda
                                    </h2>
                                    <p className="small text-body-secondary mb-0">
                                        Filtra las actividades por estado, tipo y responsable.
                                    </p>
                                </div>

                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-3"
                                    onClick={() =>
                                        setFiltros({
                                            estado: "",
                                            tipo: "",
                                            productorResponsable: ""
                                        })
                                    }
                                    disabled={
                                        !filtros.estado &&
                                        !filtros.tipo &&
                                        !filtros.productorResponsable
                                    }
                                >
                                    <i className="bi bi-arrow-counterclockwise me-1" />
                                    Limpiar filtros
                                </Button>
                            </div>

                            <Row className="g-3">
                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold">
                                            Estado
                                        </Form.Label>
                                        <Form.Select
                                            value={filtros.estado}
                                            onChange={(e) =>
                                                setFiltros((actuales) => ({
                                                    ...actuales,
                                                    estado: e.target.value
                                                }))
                                            }
                                            className="rounded-3"
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="PENDIENTE">Pendiente</option>
                                            <option value="COMPLETADA">Completada</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold">
                                            Tipo de actividad
                                        </Form.Label>
                                        <Form.Select
                                            value={filtros.tipo}
                                            onChange={(e) =>
                                                setFiltros((actuales) => ({
                                                    ...actuales,
                                                    tipo: e.target.value
                                                }))
                                            }
                                            className="rounded-3"
                                        >
                                            <option value="">Todos los tipos</option>
                                            {TIPOS_ACTIVIDAD.map((tipo) => (
                                                <option key={tipo.value} value={tipo.value}>
                                                    {tipo.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold">
                                            Productor responsable
                                        </Form.Label>
                                        <Form.Select
                                            value={filtros.productorResponsable}
                                            onChange={(e) =>
                                                setFiltros((actuales) => ({
                                                    ...actuales,
                                                    productorResponsable: e.target.value
                                                }))
                                            }
                                            className="rounded-3"
                                        >
                                            <option value="">Todos los productores</option>
                                            {productores.map((productor) => (
                                                <option
                                                    key={productor.id}
                                                    value={String(productor.id)}
                                                >
                                                    {productor.nombres} {productor.apellidos}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="small text-body-secondary mt-3">
                                Se muestran {registrosFiltrados.length} registros con los filtros actuales.
                            </div>
                        </Card.Body>
                    </Card>

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
                                <div className="d-flex align-items-start gap-2">
                                    <i className="bi bi-info-circle text-primary mt-1" />
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

            <div
                className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3"
                style={{ marginTop: "60px" }}
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
            {/* Modal de confirmación para eliminar físicamente una actividad */}
            <ConfirmModal
                show={Boolean(actividadEliminando)}
                onHide={() => {
                    if (!eliminandoActividad) {
                        setActividadEliminando(null);
                    }
                }}
                onConfirm={confirmarEliminacionFisica}
                title="Eliminar definitivamente"
                confirmText="Sí, eliminar definitivamente"
                variant="danger"
                loading={eliminandoActividad}
            >
                ¿Estás seguro de que deseas eliminar definitivamente la actividad{" "}
                <strong>«{actividadEliminando?.titulo}»</strong>?

                <p className="text-danger mt-2 mb-0">
                    Esta acción no se puede deshacer.
                </p>
            </ConfirmModal>
        </Container>
    );
}