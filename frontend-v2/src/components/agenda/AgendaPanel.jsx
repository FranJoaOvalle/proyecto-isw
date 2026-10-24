import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Container,
    Toast,
    ToastContainer
} from "react-bootstrap";

import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import ConfirmModal from "../ConfirmModal";
import api from "../../services/_api";
import { getAgenda } from "../../services/agenda.service";
import AgendaFiltros from "./AgendaFiltros";
import AgendaLista from "./AgendaLista";
import AgendaMes from "./AgendaMes";
import AgendaSemana from "./AgendaSemana";
import ActividadFormularioModal from "./ActividadFormularioModal";
import {
    convertirAFechaHoraLocal,
    obtenerFechaLocal,
    obtenerRegistrosDelDia
} from "./agenda.utils";
import {
    crearActividad,
    actualizarActividad,
    cambiarEstadoActividad,
    cancelarActividad,
    eliminarFisicamenteActividad
} from "../../services/actividad.service";

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
    const [vistaAgenda, setVistaAgenda] = useState("mes");
    const [registroListaSeleccionado, setRegistroListaSeleccionado] = useState(null);
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
    const [actividadReactivando, setActividadReactivando] = useState(null);
    const [cambiandoEstadoActividad, setCambiandoEstadoActividad] = useState(false);
    const [actividadEliminando, setActividadEliminando] = useState(null);
    const [eliminandoActividad, setEliminandoActividad] = useState(false);

    const [filtros, setFiltros] = useState({
        estado: "",
        tipo: "",
        productorId: "",
        desde: "",
        hasta: ""
    });

    const [formActividad, setFormActividad] = useState({
        titulo: "",
        descripcion: "",
        tipo: "TAREA",
        inicio: `${hoy}T09:00`,
        fin: `${hoy}T10:00`,
        lugar: "",
        eventoId: "",
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

        if (!esAdmin) {
            return () => {
                activo = false;
            };
        }

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
    }, [esAdmin]);

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
            eventoId: "",
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
            eventoId: actividad.eventoId ? String(actividad.eventoId) : "",
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

        if (esAdmin && !actividadEditando && productores.length === 0) {
            setError(
                "No hay productores activos disponibles para asignar."
            );
            return;
        }

        if (esAdmin && productoresActividad.length === 0) {
            setError("Debes asignar al menos un productor.");
            return;
        }

        if (
            esAdmin &&
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
                lugar: formActividad.lugar.trim() || null,
                eventoId: formActividad.eventoId
                    ? Number(formActividad.eventoId)
                    : null
            };

            if (esAdmin) {
                payload.productores = productoresActividad;
            }

            if (actividadEditando) {
                await actualizarActividad(
                    actividadEditando.id,
                    esAdmin ? { ...payload, estado: formActividad.estado } : payload
                );

                setMensaje("Actividad actualizada correctamente.");
            } else {
                await crearActividad(payload);

                setMensaje("Actividad creada correctamente.");
            }

            await recargarAgenda();
            setMostrarFormulario(false);
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

    const actualizarEstadoActividad = async (actividad, estado) => {
        if (cambiandoEstadoActividad) return;

        try {
            setCambiandoEstadoActividad(true);
            setError("");
            setMensaje("");

            await cambiarEstadoActividad(actividad.id, estado);
            await recargarAgenda();
            setMensaje(estado === "COMPLETADA"
                ? "Actividad completada correctamente."
                : "Actividad marcada como pendiente.");
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                "No fue posible actualizar el estado de la actividad."
            );
        } finally {
            setCambiandoEstadoActividad(false);
        }
    };

    const completarActividadPendiente = (actividad) =>
        actualizarEstadoActividad(actividad, "COMPLETADA");

    const marcarActividadPendiente = (actividad) =>
        actualizarEstadoActividad(actividad, "PENDIENTE");

    const confirmarReactivacion = async () => {
        if (!actividadReactivando || cambiandoEstadoActividad) return;

        try {
            setCambiandoEstadoActividad(true);
            setError("");
            setMensaje("");

            await cambiarEstadoActividad(actividadReactivando.id, "PENDIENTE");
            await recargarAgenda();
            setActividadReactivando(null);
            setMensaje("Actividad reactivada como pendiente.");
        } catch (err) {
            setActividadReactivando(null);
            setError(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                "No fue posible reactivar la actividad."
            );
        } finally {
            setCambiandoEstadoActividad(false);
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
            if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
                return false;
            }

            const inicio = new Date(registro.inicio);
            const fin = registro.fin ? new Date(registro.fin) : inicio;

            if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
                return false;
            }

            if (filtros.estado && registro.estado !== filtros.estado) {
                return false;
            }

            if (filtros.tipo && registro.tipoRegistro === "ACTIVIDAD" && registro.tipo !== filtros.tipo) {
                return false;
            }

            if (filtros.desde) {
                const desde = new Date(`${filtros.desde}T00:00:00`);
                if (fin < desde) return false;
            }

            if (filtros.hasta) {
                const hasta = new Date(`${filtros.hasta}T23:59:59.999`);
                if (inicio > hasta) return false;
            }

            if (esAdmin && filtros.productorId) {
                const coincideProductor = registro.tipoRegistro === "EVENTO"
                    ? String(registro.productorId) === filtros.productorId
                    : (registro.productores || []).some(
                    (asignacion) =>
                        String(asignacion.productorId) === filtros.productorId
                );

                if (!coincideProductor) return false;
            }

            return true;
        });
    }, [registros, filtros, esAdmin]);

    const diasSemana = useMemo(() => {
        const primerDia = new Date(`${fechaSeleccionada}T12:00:00`);
        primerDia.setDate(primerDia.getDate() - ((primerDia.getDay() + 6) % 7));

        return Array.from({ length: 7 }, (_, indice) => {
            const fecha = new Date(primerDia);
            fecha.setDate(primerDia.getDate() + indice);
            return { fecha: obtenerFechaLocal(fecha) };
        });
    }, [fechaSeleccionada]);

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

    const registrosDelMes = useMemo(() => {
        const anio = mesVisible.getFullYear();
        const mes = mesVisible.getMonth();

        const inicioMes = new Date(anio, mes, 1);
        const finMes = new Date(anio, mes + 1, 1);

        return registrosFiltrados
            .filter((registro) => {
                const inicio = new Date(registro.inicio);
                const fin = registro.fin
                    ? new Date(registro.fin)
                    : inicio;

                if (
                    Number.isNaN(inicio.getTime()) ||
                    Number.isNaN(fin.getTime())
                ) {
                    return false;
                }

                // Incluir registros que se crucen con el mes visible.
                return inicio < finMes && fin >= inicioMes;
            })
            .sort(
                (a, b) =>
                    new Date(a.inicio).getTime() -
                    new Date(b.inicio).getTime()
            );
    }, [registrosFiltrados, mesVisible]);

    const registrosSemana = useMemo(() => {
        const inicioSemana = new Date(`${diasSemana[0]?.fecha}T00:00:00`);
        const finSemana = new Date(`${diasSemana[6]?.fecha}T00:00:00`);
        finSemana.setDate(finSemana.getDate() + 1);

        return registrosFiltrados.filter((registro) => {
            const inicio = new Date(registro.inicio);
            const fin = registro.fin ? new Date(registro.fin) : inicio;
            return !Number.isNaN(inicio.getTime()) && !Number.isNaN(fin.getTime()) && inicio < finSemana && fin >= inicioSemana;
        });
    }, [diasSemana, registrosFiltrados]);

    const registrosDelPeriodo = vistaAgenda === "semana"
        ? registrosSemana
        : registrosDelMes;

    const cantidadActividades = registrosDelDia.filter(
        (registro) => registro.tipoRegistro === "ACTIVIDAD"
    ).length;

    const cantidadEventos = registrosDelDia.filter(
        (registro) => registro.tipoRegistro === "EVENTO"
    ).length;

    const cambiarMes = (cantidad) => {
        if (vistaAgenda === "semana") {
            const nuevaFecha = new Date(`${fechaSeleccionada}T12:00:00`);
            nuevaFecha.setDate(nuevaFecha.getDate() + cantidad * 7);
            const nuevaFechaLocal = obtenerFechaLocal(nuevaFecha);
            setFechaSeleccionada(nuevaFechaLocal);
            setMesVisible(new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1));
            setRegistroListaSeleccionado(null);
            return;
        }

        setMesVisible((actual) =>
            new Date(
                actual.getFullYear(),
                actual.getMonth() + cantidad,
                1
            )
        );

    };

    const irAHoy = () => {
        const fecha = new Date();
        fecha.setDate(1);

        setMesVisible(fecha);
        setFechaSeleccionada(hoy);
        setRegistroListaSeleccionado(null);
    };

    const seleccionarDia = (fecha) => {
        setFechaSeleccionada(fecha);
        setRegistroListaSeleccionado(null);
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

    const agendaProps = {
        esAdmin,
        eventosDisponibles: registros.filter((registro) => registro.tipoRegistro === "EVENTO"),
        vistaAgenda,
        mesVisible,
        cambiarMes,
        irAHoy,
        registrosDelMes,
        registrosFiltrados,
        cargando,
        fechaSeleccionada,
        seleccionarDia,
        diasSemana,
        registrosDelPeriodo,
        registrosSemana,
        diasCalendario,
        registrosPorDia,
        registrosDelDia,
        cantidadActividades,
        cantidadEventos,
        cambiandoEstadoActividad,
        registroListaSeleccionado,
        setRegistroListaSeleccionado,
        filtros,
        setFiltros,
        productores,
        abrirEdicionActividad,
        completarActividadPendiente,
        marcarActividadPendiente,
        anularActividad,
        setActividadReactivando,
        solicitarEliminacionFisica,
        mostrarFormulario,
        setMostrarFormulario,
        guardandoActividad,
        guardarActividad,
        actividadEditando,
        formActividad,
        setFormActividad,
        cargandoProductores,
        productoresActividad,
        cambiarProductorAsignado,
        cambiarResponsable,
        error
    };
    return (
        <Container fluid="xl" className="pt-5 pb-4 px-3 px-lg-4">
            <PageHeader
                title="Agenda"
                description={esAdmin
                    ? "Toda la planificación de actividades y eventos de la organización."
                    : "Consulta tus eventos asignados y actividades programadas."}
            />

            <ToastContainer
                position="bottom-end"
                className="position-fixed p-3"
                style={{ zIndex: 1080 }}
            >
                {error && !mostrarFormulario && (
                    <Toast
                        bg="danger"
                        onClose={() => setError("")}
                        role="alert"
                        aria-live="assertive"
                    >
                        <Toast.Header className="text-bg-danger border-0">
                            <i className="bi bi-exclamation-circle-fill me-2" />
                            <strong className="me-auto">Ocurrió un error</strong>
                        </Toast.Header>
                        <Toast.Body className="text-white">{error}</Toast.Body>
                    </Toast>
                )}

                {mensaje && (
                    <Toast
                        bg="success"
                        onClose={() => setMensaje("")}
                        delay={4500}
                        autohide
                        role="status"
                        aria-live="polite"
                    >
                        <Toast.Header className="text-bg-success border-0">
                            <i className="bi bi-check-circle-fill me-2" />
                            <strong className="me-auto">Listo</strong>
                        </Toast.Header>
                        <Toast.Body className="text-white">{mensaje}</Toast.Body>
                    </Toast>
                )}
            </ToastContainer>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div
                    className="d-inline-flex gap-1 p-1 border rounded-3 bg-body-tertiary"
                    role="group"
                    aria-label="Vista de la agenda"
                >
                    <Button
                        variant={vistaAgenda === "mes" ? "primary" : "light"}
                        size="sm"
                        className={`rounded-2 ${
                            vistaAgenda === "mes"
                                ? ""
                                : "bg-transparent border-0 text-body"
                        }`}
                        onClick={() => setVistaAgenda("mes")}
                        aria-pressed={vistaAgenda === "mes"}
                    >
                        <i className="bi bi-calendar3 me-2" />
                        Mes
                    </Button>

                    <Button
                        variant={vistaAgenda === "lista" ? "primary" : "light"}
                        size="sm"
                        className={`rounded-2 ${
                            vistaAgenda === "lista"
                                ? ""
                                : "bg-transparent border-0 text-body"
                        }`}
                        onClick={() => setVistaAgenda("lista")}
                        aria-pressed={vistaAgenda === "lista"}
                    >
                        <i className="bi bi-list-ul me-2" />
                        Lista
                    </Button>
                    <Button
                        variant={vistaAgenda === "semana" ? "primary" : "light"}
                        size="sm"
                        className={`rounded-2 ${vistaAgenda === "semana" ? "" : "bg-transparent border-0 text-body"}`}
                        onClick={() => setVistaAgenda("semana")}
                        aria-pressed={vistaAgenda === "semana"}
                    >
                        <i className="bi bi-calendar-week me-2" />
                        Semana
                    </Button>
                </div>

                <Button
                    variant="primary"
                    className="rounded-3 fw-semibold px-3 shadow-sm"
                    onClick={abrirNuevaActividad}
                >
                    <i className="bi bi-plus-lg me-2" />
                    Nueva actividad
                </Button>
            </div>

        <AgendaFiltros agenda={agendaProps} />

            <AgendaLista agenda={agendaProps} />

            <AgendaMes agenda={agendaProps} />

        <AgendaSemana agenda={agendaProps} />

            <ActividadFormularioModal agenda={agendaProps} />

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
            {/* La reactivación siempre devuelve la actividad al estado pendiente. */}
            {esAdmin && <ConfirmModal
                show={Boolean(actividadReactivando)}
                onHide={() => {
                    if (!cambiandoEstadoActividad) {
                        setActividadReactivando(null);
                    }
                }}
                onConfirm={confirmarReactivacion}
                title="Reactivar actividad"
                confirmText="Sí, reactivar"
                variant="success"
                loading={cambiandoEstadoActividad}
            >
                La actividad{" "}
                <strong>«{actividadReactivando?.titulo}»</strong>{" "}
                volverá al estado pendiente. El sistema comprobará que no existan conflictos de horario.
            </ConfirmModal>}
            {/* Modal de confirmación para eliminar físicamente una actividad */}
            {esAdmin && <ConfirmModal
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
            </ConfirmModal>}
        </Container>
    );
}
