import { Link } from "react-router-dom";
import ReservaEventoSelector from "./ReservaEventoSelector";
import { datosReservaEvento } from "./reserva.utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Form,
    Modal,
    Spinner,
    Table
} from "react-bootstrap";

import ConfirmModal from "../ConfirmModal";
import EmptyState from "../EmptyState";
import TableToolbar from "../admin/TableToolbar";
import MapaEspacios from "./MapaEspacios";
import NotificacionToast from "./NotificacionToast";
import {
    cancelarReservaEspacio,
    createEspacio,
    deleteEspacio,
    getEspacios,
    getReservasEspacio,
    reservarEspacio,
    updateEspacio,
    updateEspacioEstado
} from "../../services/espacio.service";

const initialSpace = {
    nombre: "",
    direccion: "",
    comuna: "",
    capacidad: "",
    costoArriendo: "",
    unidadArriendo: "",
    habilitado: true,
    observaciones: ""
};

const initialBooking = { referencia: "", inicio: "", fin: "" };
const unidades = { HORA: "hora", DIA: "día", EVENTO: "evento" };
const moneda = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
});
const fechaLocal = value => new Date(value).toLocaleString("es-CL");

function fechaIso(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("La fecha indicada no es válida.");
    return date.toISOString();
}

function intervaloDia(value) {
    const [year, month, day] = value.split("-").map(Number);
    const inicio = new Date(year, month - 1, day);
    const fin = new Date(year, month - 1, day + 1);
    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

function intervaloHora(dia, hora) {
    const [year, month, day] = dia.split("-").map(Number);
    const [hours, minutes] = hora.split(":").map(Number);
    const inicio = new Date(year, month - 1, day, hours, minutes);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

function textoTarifa(espacio) {
    if (espacio.costoArriendo == null) return "Costo de arriendo sin informar";
    const unidad = unidades[espacio.unidadArriendo] ?? espacio.unidadArriendo;
    return `${moneda.format(Number(espacio.costoArriendo))} / ${unidad}`;
}

export default function EspaciosPanel({ eventoInicial }) {
    const [espacios, setEspacios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingId, setChangingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [vista, setVista] = useState("lista");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialSpace);
    const [validated, setValidated] = useState(false);
    const [spaceEstado, setSpaceEstado] = useState(null);
    const [spaceEliminar, setSpaceEliminar] = useState(null);
    const [rango, setRango] = useState({ inicio: "", fin: "" });
    const [rangoAplicado, setRangoAplicado] = useState(null);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [reservas, setReservas] = useState([]);
    const [booking, setBooking] = useState({ ...initialBooking, ...datosReservaEvento(eventoInicial) });
    const [showBookings, setShowBookings] = useState(false);
    const [bookingSaving, setBookingSaving] = useState(false);
    const [bookingCancel, setBookingCancel] = useState(null);

    const cargarEspacios = useCallback(async (intervalo = rangoAplicado) => {
        try {
            const data = await getEspacios(intervalo);
            setEspacios(data);
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cargar los espacios."
            );
        } finally {
            setLoading(false);
        }
    }, [rangoAplicado]);

    useEffect(() => {
        // Initial data loading belongs to an effect; state updates happen after the request resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void cargarEspacios();
    }, [cargarEspacios]);

    const abrirCrear = () => {
        setEditing(null);
        setForm({ ...initialSpace });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const abrirEditar = espacio => {
        setEditing(espacio);
        setForm({
            nombre: espacio.nombre,
            direccion: espacio.direccion,
            comuna: espacio.comuna ?? "",
            capacidad: String(espacio.capacidad),
            costoArriendo: espacio.costoArriendo == null ? "" : String(espacio.costoArriendo),
            unidadArriendo: espacio.unidadArriendo ?? "",
            habilitado: espacio.habilitado,
            observaciones: espacio.observaciones ?? ""
        });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const cerrarModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setValidated(false);
    };

    const handleSubmit = async event => {
        event.preventDefault();
        const element = event.currentTarget;
        if (!element.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        if (Boolean(form.costoArriendo) !== Boolean(form.unidadArriendo)) {
            setError("Indica juntos el costo y la unidad de arriendo, o deja ambos vacíos.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        const data = {
            nombre: form.nombre.trim(),
            direccion: form.direccion.trim(),
            comuna: form.comuna.trim() || null,
            capacidad: Number(form.capacidad),
            costoArriendo: form.costoArriendo === "" ? null : Number(form.costoArriendo),
            unidadArriendo: form.unidadArriendo || null,
            habilitado: form.habilitado,
            observaciones: form.observaciones.trim() || null
        };

        try {
            if (editing) await updateEspacio(editing.id, data);
            else await createEspacio(data);
            setShowModal(false);
            setEditing(null);
            setSuccess(editing ? "Espacio actualizado correctamente." : "Espacio registrado correctamente.");
            await cargarEspacios();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible guardar el espacio."
            );
        } finally {
            setSaving(false);
        }
    };

    const buscarDisponibilidad = async event => {
        event.preventDefault();
        setError("");
        try {
            if (!rango.inicio) throw new Error("Selecciona el día que quieres consultar.");
            const intervalo = rango.fin
                ? intervaloHora(rango.inicio, rango.fin)
                : intervaloDia(rango.inicio);
            setLoading(true);
            await cargarEspacios(intervalo);
            setRangoAplicado(intervalo);
        } catch (err) {
            setError(err.message || "No fue posible consultar la disponibilidad.");
        }
    };

    const limpiarDisponibilidad = async () => {
        setRangoAplicado(null);
        setRango({ inicio: "", fin: "" });
        setLoading(true);
        await cargarEspacios(null);
    };

    const confirmarEstado = async () => {
        if (!spaceEstado) return;
        setChangingId(spaceEstado.id);
        setError("");
        setSuccess("");
        try {
            await updateEspacioEstado(spaceEstado.id, !spaceEstado.habilitado);
            setSpaceEstado(null);
            setSuccess(spaceEstado.habilitado
                ? "Espacio deshabilitado. Las reservas existentes se conservan."
                : "Espacio habilitado para nuevas reservas.");
            await cargarEspacios();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cambiar el estado del espacio."
            );
        } finally {
            setChangingId(null);
        }
    };

    const confirmarEliminacion = async () => {
        if (!spaceEliminar) return;
        setChangingId(spaceEliminar.id);
        setError("");
        setSuccess("");
        try {
            await deleteEspacio(spaceEliminar.id);
            setSuccess(`Espacio ${spaceEliminar.nombre} eliminado definitivamente.`);
            setSpaceEliminar(null);
            await cargarEspacios();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible eliminar el espacio."
            );
            setSpaceEliminar(null);
        } finally {
            setChangingId(null);
        }
    };

    const abrirReservas = async espacio => {
        setSelectedSpace(espacio);
        setBooking({ ...initialBooking, ...datosReservaEvento(eventoInicial) });
        setError("");
        setShowBookings(true);
        try {
            setReservas(await getReservasEspacio(espacio.id));
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cargar las reservas del espacio."
            );
        }
    };

    const guardarReserva = async event => {
        event.preventDefault();
        const element = event.currentTarget;
        if (!element.checkValidity()) {
            event.stopPropagation();
            return;
        }
        setBookingSaving(true);
        setError("");
        try {
            const inicio = fechaIso(booking.inicio);
            const fin = fechaIso(booking.fin);
            if (new Date(fin) <= new Date(inicio)) throw new Error("El término debe ser posterior al inicio.");
            await reservarEspacio(selectedSpace.id, {
                ...(booking.eventoId ? { eventoId: Number(booking.eventoId) } : {}),
                inicio,
                fin,
                referencia: booking.referencia.trim()
            });
            setBooking({ ...initialBooking, ...datosReservaEvento(eventoInicial) });
            setReservas(await getReservasEspacio(selectedSpace.id));
            setSuccess("Reserva registrada correctamente.");
            await cargarEspacios();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                err.message ??
                "No fue posible registrar la reserva."
            );
        } finally {
            setBookingSaving(false);
        }
    };

    const confirmarCancelacion = async () => {
        if (!bookingCancel) return;
        setBookingSaving(true);
        setError("");
        try {
            await cancelarReservaEspacio(bookingCancel.id);
            setBookingCancel(null);
            setReservas(await getReservasEspacio(selectedSpace.id));
            setSuccess("Reserva cancelada; su historial se conserva.");
            await cargarEspacios();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cancelar la reserva."
            );
        } finally {
            setBookingSaving(false);
        }
    };

    const filtrados = useMemo(() => {
        const termino = search.trim().toLowerCase();
        return espacios.filter(espacio => {
            const coincideTexto = !termino ||
                espacio.nombre.toLowerCase().includes(termino) ||
                espacio.direccion.toLowerCase().includes(termino) ||
                (espacio.comuna ?? "").toLowerCase().includes(termino);
            const coincideEstado = estado === "TODOS" ||
                (estado === "ACTIVOS" && espacio.habilitado) ||
                (estado === "INACTIVOS" && !espacio.habilitado);
            return coincideTexto && coincideEstado;
        });
    }, [espacios, search, estado]);

    return (
        <>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="h4 fw-bold mb-1">Espacios y reservas</h2>
                    <p className="text-secondary mb-0">
                        Mantén el registro de recintos, revisa disponibilidad y evita reservas superpuestas.
                    </p>
                </div>
                <Button onClick={abrirCrear}><i className="bi bi-plus-lg me-2" />Nuevo espacio</Button>
            </div>

            <NotificacionToast mensaje={error && !showModal && !showBookings ? error : ""} tipo="danger" onClose={() => setError("")} />
            <NotificacionToast mensaje={success} onClose={() => setSuccess("")} />

            <Form onSubmit={buscarDisponibilidad} className="border rounded-3 p-3 mb-4 bg-body-tertiary">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-calendar2-check text-primary" />
                    <strong>Consultar disponibilidad</strong>
                </div>
                <div className="row align-items-start g-3">
                    <Form.Group className="col-md-4">
                        <Form.Label>Día del evento</Form.Label>
                        <Form.Control type="date" value={rango.inicio} onChange={event => setRango(current => ({ ...current, inicio: event.target.value }))} required />
                    </Form.Group>
                    <Form.Group className="col-md-4">
                        <Form.Label>Hora (opcional)</Form.Label>
                        <Form.Control type="time" value={rango.fin} onChange={event => setRango(current => ({ ...current, fin: event.target.value }))} disabled={!rango.inicio} />
                        <Form.Text className="text-secondary">Una hora consulta ese bloque; sin hora se revisa el día completo.</Form.Text>
                    </Form.Group>
                    <div className="col-md-4 d-flex flex-wrap gap-2 pt-md-4">
                        <Button type="submit" disabled={loading}><i className="bi bi-search me-2" />Consultar</Button>
                        {rangoAplicado && <Button type="button" variant="outline-secondary" onClick={limpiarDisponibilidad} disabled={loading}>Ver todos</Button>}
                    </div>
                </div>
                {rangoAplicado && <small className="text-secondary d-block mt-2">
                    {rango.fin
                        ? "Mostrando disponibilidad el " + new Date(rangoAplicado.inicio).toLocaleDateString("es-CL") + " entre " +
                            new Date(rangoAplicado.inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) + " y " +
                            new Date(rangoAplicado.fin).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) + "."
                        : "Mostrando disponibilidad para el día " + new Date(rangoAplicado.inicio).toLocaleDateString("es-CL") + "."}
                </small>}
            </Form>

            <div className="d-flex gap-2 mb-3" role="group" aria-label="Vista de espacios">
                <Button type="button" variant={vista === "lista" ? "primary" : "outline-primary"} aria-pressed={vista === "lista"} onClick={() => setVista("lista")}>
                    <i className="bi bi-list-ul me-2" />Lista
                </Button>
                <Button type="button" variant={vista === "mapa" ? "primary" : "outline-primary"} aria-pressed={vista === "mapa"} onClick={() => setVista("mapa")}>
                    <i className="bi bi-map me-2" />Mapa
                </Button>
            </div>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar espacio por nombre o dirección..."
                estado={estado}
                onEstadoChange={setEstado}
            />

            {loading ? (
                <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
            ) : vista === "mapa" ? (
                <MapaEspacios espacios={filtrados} onReservas={abrirReservas} onUbicacionGuardada={() => cargarEspacios()} />
            ) : filtrados.length === 0 ? (
                <EmptyState
                    icon="bi-building"
                    title={espacios.length ? "No se encontraron espacios" : "Aún no hay espacios registrados"}
                    description={espacios.length
                        ? "Prueba con otros términos o filtros."
                        : "Registra recintos para consultar su disponibilidad y gestionar reservas."}
                />
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle">
                        <caption className="caption-top text-secondary">{filtrados.length} espacios</caption>
                        <thead>
                            <tr><th>Espacio</th><th>Capacidad</th><th>Arriendo</th><th>Estado</th><th>Disponibilidad</th><th className="text-end">Acciones</th></tr>
                        </thead>
                        <tbody>
                            {filtrados.map(espacio => (
                                <tr key={espacio.id}>
                                    <td>
                                        <div className="fw-semibold">{espacio.nombre}</div>
                                        <small className="text-secondary">{espacio.direccion}{espacio.comuna ? `, ${espacio.comuna}` : ""}</small>
                                        {espacio.observaciones && <div className="small text-secondary">{espacio.observaciones}</div>}
                                    </td>
                                    <td>{espacio.capacidad.toLocaleString("es-CL")} personas</td>
                                    <td>{textoTarifa(espacio)}</td>
                                    <td><Badge bg={espacio.habilitado ? "success" : "secondary"}>{espacio.habilitado ? "Habilitado" : "Deshabilitado"}</Badge></td>
                                    <td>
                                        {!rangoAplicado ? (
                                            espacio.proximaReserva
                                                ? <small className="text-secondary">Próxima: {fechaLocal(espacio.proximaReserva.inicio)}</small>
                                                : <small className="text-secondary">Sin reservas próximas</small>
                                        ) : (
                                            <Badge bg={!espacio.habilitado ? "secondary" : espacio.disponible ? "success" : "warning"} text={espacio.habilitado && !espacio.disponible ? "dark" : undefined}>
                                                {!espacio.habilitado ? "Deshabilitado" : espacio.disponible ? "Disponible" : "Reservado"}
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="text-end text-nowrap">
                                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => abrirReservas(espacio)}>
                                            <i className="bi bi-calendar2-week me-1" />Reservas
                                        </Button>
                                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => abrirEditar(espacio)}>
                                            <i className="bi bi-pencil me-1" />Editar
                                        </Button>
                                        <Button size="sm" variant={espacio.habilitado ? "outline-warning" : "outline-success"} disabled={changingId === espacio.id} onClick={() => setSpaceEstado(espacio)}>
                                            {espacio.habilitado ? "Deshabilitar" : "Habilitar"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="ms-2"
                                            disabled={changingId === espacio.id}
                                            onClick={() => setSpaceEliminar(espacio)}
                                        >
                                            <i className="bi bi-trash me-1" />Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            <Modal show={showModal} onHide={cerrarModal} centered>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{editing ? "Editar espacio" : "Registrar espacio"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del espacio</Form.Label>
                            <Form.Control value={form.nombre} onChange={event => setForm(current => ({ ...current, nombre: event.target.value }))} minLength={2} maxLength={100} required disabled={saving} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Dirección</Form.Label>
                            <Form.Control value={form.direccion} onChange={event => setForm(current => ({ ...current, direccion: event.target.value }))} minLength={2} maxLength={250} required disabled={saving} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="espacio-comuna">
                            <Form.Label>Comuna (opcional)</Form.Label>
                            <Form.Control value={form.comuna} onChange={event => setForm(current => ({ ...current, comuna: event.target.value }))} minLength={2} maxLength={100} disabled={saving} />
                            <Form.Text>Se utilizará al confirmar la ubicación de un evento.</Form.Text>
                        </Form.Group>
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Capacidad (personas)</Form.Label>
                                <Form.Control type="number" value={form.capacidad} onChange={event => setForm(current => ({ ...current, capacidad: event.target.value }))} min={1} max={2147483647} step={1} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Costo de arriendo (CLP)</Form.Label>
                                <Form.Control type="number" value={form.costoArriendo} onChange={event => setForm(current => ({ ...current, costoArriendo: event.target.value }))} min={0} max={9999999999.99} step="0.01" placeholder="Sin informar" disabled={saving} />
                            </Form.Group>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Unidad de cobro</Form.Label>
                            <Form.Select value={form.unidadArriendo} onChange={event => setForm(current => ({ ...current, unidadArriendo: event.target.value }))} disabled={saving} required={form.costoArriendo !== ""}>
                                <option value="">Sin informar</option>
                                <option value="HORA">Por hora</option>
                                <option value="DIA">Por día</option>
                                <option value="EVENTO">Por evento</option>
                            </Form.Select>
                            <Form.Text className="text-secondary">Indica ambos campos de arriendo o déjalos vacíos.</Form.Text>
                        </Form.Group>
                        <Form.Check
                            className="mb-3"
                            type="switch"
                            label="Habilitado para nuevas reservas"
                            checked={form.habilitado}
                            onChange={event => setForm(current => ({ ...current, habilitado: event.target.checked }))}
                            disabled={saving}
                        />
                        <Form.Group>
                            <Form.Label>Observaciones</Form.Label>
                            <Form.Control as="textarea" rows={3} value={form.observaciones} onChange={event => setForm(current => ({ ...current, observaciones: event.target.value }))} maxLength={2000} disabled={saving} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>{saving && <Spinner size="sm" className="me-2" />}{editing ? "Guardar cambios" : "Crear espacio"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showBookings} onHide={() => !bookingSaving && setShowBookings(false)} size="lg" centered>
                <Modal.Header closeButton={!bookingSaving}>
                    <Modal.Title>Reservas · {selectedSpace?.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
                    <p className="text-secondary">Las reservas se registran con una referencia para identificar el evento.</p>
                    <Form onSubmit={guardarReserva} className="border rounded-3 p-3 mb-4">
                        <h3 className="h6 fw-bold">Nueva reserva</h3>
                        <ReservaEventoSelector value={booking.eventoId} disabled={bookingSaving} eventoInicial={eventoInicial} onChange={evento => setBooking(current => ({ ...current, ...datosReservaEvento(evento) }))} />
                        <div className="row g-3">
                            <Form.Group className="col-md-4">
                                <Form.Label>Referencia</Form.Label>
                                <Form.Control value={booking.referencia} onChange={event => setBooking(current => ({ ...current, referencia: event.target.value }))} minLength={2} maxLength={150} required disabled={bookingSaving} placeholder="Ej. Seminario anual" />
                            </Form.Group>
                            <Form.Group className="col-md-3">
                                <Form.Label>Inicio</Form.Label>
                                <Form.Control type="datetime-local" value={booking.inicio} onChange={event => setBooking(current => ({ ...current, inicio: event.target.value }))} required disabled={bookingSaving} />
                            </Form.Group>
                            <Form.Group className="col-md-3">
                                <Form.Label>Término</Form.Label>
                                <Form.Control type="datetime-local" value={booking.fin} onChange={event => setBooking(current => ({ ...current, fin: event.target.value }))} required disabled={bookingSaving} />
                            </Form.Group>
                            <div className="col-md-2 d-flex align-items-end">
                                <Button type="submit" className="w-100" disabled={bookingSaving}>{bookingSaving ? <Spinner size="sm" /> : "Reservar"}</Button>
                            </div>
                        </div>
                    </Form>
                    <h3 className="h6 fw-bold">Historial de reservas</h3>
                    {reservas.length === 0 ? (
                        <EmptyState icon="bi-calendar-x" title="Sin reservas" description="Este espacio todavía no tiene reservas registradas." />
                    ) : (
                        <div className="table-responsive">
                            <Table size="sm" className="align-middle">
                                <thead><tr><th>Referencia</th><th>Inicio</th><th>Término</th><th>Estado</th><th /></tr></thead>
                                <tbody>
                                    {reservas.map(reserva => (
                                        <tr key={reserva.id}>
                                            <td>{reserva.referencia}{reserva.eventoId && <Link className="d-block" to={`/admin/eventos/${reserva.eventoId}`}>Evento #{reserva.eventoId}</Link>}</td>
                                            <td>{fechaLocal(reserva.inicio)}</td>
                                            <td>{fechaLocal(reserva.fin)}</td>
                                            <td><Badge bg={reserva.cancelada ? "secondary" : "success"}>{reserva.cancelada ? "Cancelada" : "Vigente"}</Badge></td>
                                            <td className="text-end">{!reserva.cancelada && <Button size="sm" variant="outline-danger" onClick={() => setBookingCancel(reserva)} disabled={bookingSaving}>Cancelar</Button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowBookings(false)} disabled={bookingSaving}>Cerrar</Button></Modal.Footer>
            </Modal>

            <ConfirmModal
                show={Boolean(spaceEstado)}
                onHide={() => changingId === null && setSpaceEstado(null)}
                onConfirm={confirmarEstado}
                loading={changingId !== null}
                title={spaceEstado?.habilitado ? "Deshabilitar espacio" : "Habilitar espacio"}
                confirmText={spaceEstado?.habilitado ? "Deshabilitar" : "Habilitar"}
                variant={spaceEstado?.habilitado ? "danger" : "success"}
            >
                {spaceEstado?.habilitado
                    ? <>¿Deshabilitar <strong>{spaceEstado.nombre}</strong>? Las reservas existentes se conservarán.</>
                    : <>¿Habilitar <strong>{spaceEstado?.nombre}</strong> para nuevas reservas?</>}
            </ConfirmModal>

            <ConfirmModal
                show={Boolean(spaceEliminar)}
                onHide={() => changingId === null && setSpaceEliminar(null)}
                onConfirm={spaceEliminar?._count?.reservas
                    ? () => setSpaceEliminar(null)
                    : confirmarEliminacion}
                loading={Boolean(spaceEliminar && changingId === spaceEliminar.id)}
                title="Eliminar espacio definitivamente"
                confirmText={spaceEliminar?._count?.reservas ? "Entendido" : "Eliminar definitivamente"}
                variant={spaceEliminar?._count?.reservas ? "secondary" : "danger"}
            >
                {spaceEliminar?._count?.reservas
                    ? <><strong>{spaceEliminar.nombre}</strong> no se puede eliminar porque tiene {spaceEliminar._count.reservas} {spaceEliminar._count.reservas === 1 ? "reserva" : "reservas"} asociadas. Deshabilítalo para conservar el historial.</>
                    : <>¿Eliminar <strong>{spaceEliminar?.nombre}</strong> definitivamente? Esta acción no se puede deshacer.</>}
            </ConfirmModal>

            <ConfirmModal
                show={Boolean(bookingCancel)}
                onHide={() => !bookingSaving && setBookingCancel(null)}
                onConfirm={confirmarCancelacion}
                loading={bookingSaving}
                title="Cancelar reserva"
                confirmText="Cancelar reserva"
            >
                ¿Cancelar la reserva <strong>{bookingCancel?.referencia}</strong>? Su historial se conservará.
            </ConfirmModal>
        </>
    );
}
