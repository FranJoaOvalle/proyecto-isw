import { Link } from "react-router-dom";
import { datosReservaEvento, fechaMinimaReserva } from "./reserva.utils";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";

import ConfirmModal from "../ConfirmModal";
import EmptyState from "../EmptyState";
import {
    cancelarReservaRecurso,
    getReservasRecurso,
    registrarDevolucionRecurso,
    reservarRecurso
} from "../../services/recurso.service";

const reservaInicial = { referencia: "", cantidad: "1", inicio: "", fin: "" };
const devolucionInicial = { cantidadDanada: "0", cantidadPerdida: "0", observacionesDevolucion: "" };
const fechaTexto = value => new Date(value).toLocaleString("es-CL");
const fechaIso = value => {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) throw new Error("La fecha indicada no es válida.");
    return fecha.toISOString();
};

function estadoTexto(reserva) {
    if (reserva.cancelada) return ["Cancelada", "secondary"];
    if (reserva.estadoDevolucion === "PENDIENTE") return ["Pendiente de devolución", "warning"];
    return [reserva.estadoDevolucion === "CONFORME" ? "Devuelto conforme" : "Devuelto con observaciones", reserva.estadoDevolucion === "CONFORME" ? "success" : "danger"];
}

export default function ReservasRecursoModal({ recurso, show, onHide, onChanged, eventoInicial }) {
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ ...reservaInicial, ...datosReservaEvento(eventoInicial) });
    const [devolucion, setDevolucion] = useState(devolucionInicial);
    const [reservaDevolucion, setReservaDevolucion] = useState(null);
    const [reservaCancelar, setReservaCancelar] = useState(null);
    const reservasVisibles = eventoInicial
        ? reservas.filter(reserva => reserva.eventoId === eventoInicial.id)
        : reservas;
    const incluidoEnContrato = eventoInicial?.solicitudId &&
        eventoInicial.recursos?.some(item => item.recursoId === recurso?.id);
    const inicioMinimo = fechaMinimaReserva();

    const cargar = useCallback(async () => {
        if (!recurso) return;
        setLoading(true);
        setError("");
        try {
            setReservas(await getReservasRecurso(recurso.id));
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible cargar las reservas del equipo.");
        } finally {
            setLoading(false);
        }
    }, [recurso]);

    useEffect(() => {
        if (show) {
            // Cargar el historial al abrir el diálogo es una sincronización de datos externa.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void cargar();
        }
    }, [show, cargar]);

    const guardarReserva = async event => {
        event.preventDefault();
        const element = event.currentTarget;
        if (!element.checkValidity()) {
            event.stopPropagation();
            return;
        }
        setSaving(true);
        setError("");
        try {
            const inicio = fechaIso(form.inicio);
            const fin = fechaIso(form.fin);
            if (new Date(inicio) <= new Date()) throw new Error("El inicio de la reserva debe ser futuro.");
            if (new Date(fin) <= new Date(inicio)) throw new Error("El término debe ser posterior al inicio.");
            await reservarRecurso(recurso.id, {
                ...(form.eventoId ? { eventoId: Number(form.eventoId) } : {}),
                referencia: form.referencia.trim(),
                cantidad: Number(form.cantidad),
                inicio,
                fin
            });
            setForm({ ...reservaInicial, ...datosReservaEvento(eventoInicial) });
            await cargar();
            await onChanged();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? err.message ?? "No fue posible reservar el equipo.");
        } finally {
            setSaving(false);
        }
    };

    const guardarDevolucion = async event => {
        event.preventDefault();
        if (!reservaDevolucion) return;
        setSaving(true);
        setError("");
        try {
            await registrarDevolucionRecurso(recurso.id, reservaDevolucion.id, {
                cantidadDanada: Number(devolucion.cantidadDanada),
                cantidadPerdida: Number(devolucion.cantidadPerdida),
                observacionesDevolucion: devolucion.observacionesDevolucion.trim() || null
            });
            setReservaDevolucion(null);
            setDevolucion({ ...devolucionInicial });
            await cargar();
            await onChanged();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible registrar la devolución.");
        } finally {
            setSaving(false);
        }
    };

    const confirmarCancelacion = async () => {
        if (!reservaCancelar) return;
        setSaving(true);
        setError("");
        try {
            await cancelarReservaRecurso(reservaCancelar.id);
            setReservaCancelar(null);
            await cargar();
            await onChanged();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible cancelar la reserva.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Modal show={show} onHide={() => !saving && onHide()} size="xl" centered>
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>Reservas · {recurso?.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
                    <p className="text-secondary">{eventoInicial
                        ? `Asignación para el evento #${eventoInicial.id}. La contratación ya reserva los equipos cotizados.`
                        : "Consulta las reservas y registra aquí las devoluciones o una reserva independiente."}</p>
                    {recurso?.activo === false ? <Alert variant="secondary">Este equipo está deshabilitado para nuevas reservas.</Alert> : incluidoEnContrato ? <Alert variant="info">Este equipo ya está reservado por la propuesta contratada. Su cantidad se modifica mediante una revisión comercial.</Alert> :
                    <Form onSubmit={guardarReserva} className="border rounded-3 p-3 mb-4">
                        <h3 className="h6 fw-bold">{eventoInicial ? "Nueva asignación para este evento" : "Reserva independiente"}</h3>
                        <div className="row g-3 align-items-end">
                            <Form.Group className="col-lg-3">
                                <Form.Label>Referencia</Form.Label>
                                <Form.Control value={form.referencia} onChange={event => setForm(current => ({ ...current, referencia: event.target.value }))} minLength={2} maxLength={150} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-lg-1">
                                <Form.Label>Cantidad</Form.Label>
                                <Form.Control type="number" value={form.cantidad} onChange={event => setForm(current => ({ ...current, cantidad: event.target.value }))} min={1} max={recurso?.stockTotal ?? 1} step={1} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-lg-3">
                                <Form.Label>Inicio</Form.Label>
                                <Form.Control type="datetime-local" value={form.inicio} onChange={event => setForm(current => ({ ...current, inicio: event.target.value }))} min={inicioMinimo} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-lg-3">
                                <Form.Label>Término</Form.Label>
                                <Form.Control type="datetime-local" value={form.fin} onChange={event => setForm(current => ({ ...current, fin: event.target.value }))} min={form.inicio || inicioMinimo} required disabled={saving} />
                            </Form.Group>
                            <div className="col-lg-2"><Button type="submit" className="w-100" disabled={saving}>{saving ? <Spinner size="sm" /> : "Reservar"}</Button></div>
                        </div>
                    </Form>}

                    <h3 className="h6 fw-bold">{eventoInicial ? "Reservas de este evento" : "Historial de reservas"}</h3>
                    {loading ? <div className="text-center py-4"><Spinner animation="border" /></div> : reservasVisibles.length === 0 ? (
                        <EmptyState icon="bi-calendar-x" title="Sin reservas" description="Este equipo aún no tiene reservas." />
                    ) : (
                        <div className="table-responsive">
                            <Table size="sm" className="align-middle">
                                <thead><tr><th>Evento</th><th>Cantidad</th><th>Inicio</th><th>Término</th><th>Devolución</th><th className="text-end">Acciones</th></tr></thead>
                                <tbody>{reservasVisibles.map(reserva => {
                                    const [texto, variant] = estadoTexto(reserva);
                                    return (
                                        <tr key={reserva.id}>
                                            <td>{reserva.referencia}{reserva.eventoId && <Link className="d-block" to={`/admin/eventos/${reserva.eventoId}`}>Evento #{reserva.eventoId}</Link>}</td>
                                            <td>{reserva.cantidad}</td>
                                            <td>{fechaTexto(reserva.inicio)}</td>
                                            <td>{fechaTexto(reserva.fin)}</td>
                                            <td>
                                                <Badge bg={variant} text={variant === "warning" ? "dark" : undefined}>{texto}</Badge>
                                                {(reserva.cantidadDanada > 0 || reserva.cantidadPerdida > 0) && <small className="d-block text-secondary">
                                                    {reserva.cantidadDanada > 0 && `${reserva.cantidadDanada} dañadas`}
                                                    {reserva.cantidadDanada > 0 && reserva.cantidadPerdida > 0 ? " · " : ""}
                                                    {reserva.cantidadPerdida > 0 && `${reserva.cantidadPerdida} perdidas`}
                                                </small>}
                                                {reserva.observacionesDevolucion && <small className="d-block text-secondary">{reserva.observacionesDevolucion}</small>}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                {!reserva.cancelada && reserva.estadoDevolucion === "PENDIENTE" && <>
                                                    {!eventoInicial && new Date(reserva.inicio) <= new Date() && <Button size="sm" variant="outline-success" className="me-2" onClick={() => setReservaDevolucion(reserva)} disabled={saving}>Devolver</Button>}
                                                    {new Date(reserva.inicio) > new Date() && (eventoInicial ? reserva.referencia !== `Contrato evento #${eventoInicial.id}` : reserva.eventoId == null) &&
                                                        <Button size="sm" variant="outline-danger" onClick={() => setReservaCancelar(reserva)} disabled={saving}>Cancelar</Button>}
                                                </>}
                                            </td>
                                        </tr>
                                    );
                                })}</tbody>
                            </Table>
                        </div>
                    )}

                    {reservaDevolucion && (
                        <Form onSubmit={guardarDevolucion} className="border border-warning rounded-3 p-3 mt-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3 className="h6 fw-bold mb-0">Registrar devolución · {reservaDevolucion.referencia}</h3>
                                <Button size="sm" variant="link" onClick={() => setReservaDevolucion(null)} disabled={saving}>Cerrar</Button>
                            </div>
                            <div className="row g-3">
                                <Form.Group className="col-md-3">
                                    <Form.Label>Unidades dañadas</Form.Label>
                                    <Form.Control type="number" value={devolucion.cantidadDanada} onChange={event => setDevolucion(current => ({ ...current, cantidadDanada: event.target.value }))} min={0} max={reservaDevolucion.cantidad} step={1} required disabled={saving} />
                                </Form.Group>
                                <Form.Group className="col-md-3">
                                    <Form.Label>Unidades perdidas</Form.Label>
                                    <Form.Control type="number" value={devolucion.cantidadPerdida} onChange={event => setDevolucion(current => ({ ...current, cantidadPerdida: event.target.value }))} min={0} max={reservaDevolucion.cantidad} step={1} required disabled={saving} />
                                </Form.Group>
                                <Form.Group className="col-md-4">
                                    <Form.Label>Observaciones</Form.Label>
                                    <Form.Control value={devolucion.observacionesDevolucion} onChange={event => setDevolucion(current => ({ ...current, observacionesDevolucion: event.target.value }))} maxLength={2000} disabled={saving} placeholder="Estado en que regresó el equipo" />
                                </Form.Group>
                                <div className="col-md-2 d-flex align-items-end"><Button type="submit" className="w-100" disabled={saving}>Guardar</Button></div>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={onHide} disabled={saving}>Cerrar</Button></Modal.Footer>
            </Modal>

            <ConfirmModal
                show={Boolean(reservaCancelar)}
                onHide={() => !saving && setReservaCancelar(null)}
                onConfirm={confirmarCancelacion}
                loading={saving}
                title="Cancelar reserva"
                confirmText="Cancelar reserva"
            >
                ¿Cancelar la reserva <strong>{reservaCancelar?.referencia}</strong>?
            </ConfirmModal>
        </>
    );
}
