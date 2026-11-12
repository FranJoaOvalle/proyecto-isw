import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";

import ConfirmModal from "../ConfirmModal";
import EmptyState from "../EmptyState";
import {
    cancelarReservaVehiculo,
    getReservasVehiculo,
    registrarDevolucionVehiculo,
    reservarVehiculo
} from "../../services/vehiculo.service";

const inicial = { referencia: "", inicio: "", fin: "" };
const fechaTexto = value => new Date(value).toLocaleString("es-CL");
const fechaIso = value => {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) throw new Error("La fecha indicada no es válida.");
    return fecha.toISOString();
};

export default function ReservasVehiculoModal({ vehiculo, show, onHide, onChanged }) {
    const [reservas, setReservas] = useState([]);
    const [form, setForm] = useState(inicial);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [devolucionId, setDevolucionId] = useState(null);
    const [estadoDevolucion, setEstadoDevolucion] = useState("CONFORME");
    const [observaciones, setObservaciones] = useState("");
    const [cancelar, setCancelar] = useState(null);

    const cargar = useCallback(async () => {
        if (!vehiculo) return;
        setLoading(true);
        setError("");
        try {
            setReservas(await getReservasVehiculo(vehiculo.id));
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible cargar las reservas.");
        } finally {
            setLoading(false);
        }
    }, [vehiculo]);

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
            if (new Date(fin) <= new Date(inicio)) throw new Error("El término debe ser posterior al inicio.");
            await reservarVehiculo(vehiculo.id, { referencia: form.referencia.trim(), inicio, fin });
            setForm({ ...inicial });
            await cargar();
            await onChanged();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? err.message ?? "No fue posible reservar el vehículo.");
        } finally {
            setSaving(false);
        }
    };

    const guardarDevolucion = async event => {
        event.preventDefault();
        if (!devolucionId) return;
        setSaving(true);
        setError("");
        try {
            await registrarDevolucionVehiculo(vehiculo.id, devolucionId, {
                estadoDevolucion,
                observacionesDevolucion: observaciones.trim() || null
            });
            setDevolucionId(null);
            setEstadoDevolucion("CONFORME");
            setObservaciones("");
            await cargar();
            await onChanged();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible registrar la devolución.");
        } finally {
            setSaving(false);
        }
    };

    const confirmarCancelacion = async () => {
        if (!cancelar) return;
        setSaving(true);
        setError("");
        try {
            await cancelarReservaVehiculo(cancelar.id);
            setCancelar(null);
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
                    <Modal.Title>Agenda del vehículo · {vehiculo?.patente}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
                    <p className="text-secondary">Un vehículo no puede tener reservas superpuestas. Si aún no se registra la devolución, seguirá bloqueado para nuevas salidas.</p>
                    {!vehiculo?.habilitado || vehiculo?.estado !== "DISPONIBLE" ? <Alert variant="secondary">Este vehículo no admite nuevas asignaciones.</Alert> : <Form onSubmit={guardarReserva} className="border rounded-3 p-3 mb-4">
                        <h3 className="h6 fw-bold">Nueva asignación</h3>
                        <div className="row g-3 align-items-end">
                            <Form.Group className="col-md-4">
                                <Form.Label>Referencia</Form.Label>
                                <Form.Control value={form.referencia} onChange={event => setForm(current => ({ ...current, referencia: event.target.value }))} minLength={2} maxLength={150} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-3">
                                <Form.Label>Salida</Form.Label>
                                <Form.Control type="datetime-local" value={form.inicio} onChange={event => setForm(current => ({ ...current, inicio: event.target.value }))} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-3">
                                <Form.Label>Regreso</Form.Label>
                                <Form.Control type="datetime-local" value={form.fin} onChange={event => setForm(current => ({ ...current, fin: event.target.value }))} required disabled={saving} />
                            </Form.Group>
                            <div className="col-md-2"><Button type="submit" className="w-100" disabled={saving}>Asignar</Button></div>
                        </div>
                    </Form>}
                    <h3 className="h6 fw-bold">Historial</h3>
                    {loading ? <div className="text-center py-4"><Spinner animation="border" /></div> : reservas.length === 0 ? (
                        <EmptyState icon="bi-truck" title="Sin asignaciones" description="Este vehículo todavía no tiene salidas registradas." />
                    ) : (
                        <div className="table-responsive">
                            <Table size="sm" className="align-middle">
                                <thead><tr><th>Evento</th><th>Salida</th><th>Regreso</th><th>Estado</th><th>Observaciones</th><th className="text-end">Acciones</th></tr></thead>
                                <tbody>{reservas.map(reserva => (
                                    <tr key={reserva.id}>
                                        <td>{reserva.referencia}</td>
                                        <td>{fechaTexto(reserva.inicio)}</td>
                                        <td>{fechaTexto(reserva.fin)}</td>
                                        <td><Badge bg={reserva.cancelada ? "secondary" : reserva.estadoDevolucion === "PENDIENTE" ? "warning" : reserva.estadoDevolucion === "CONFORME" ? "success" : "danger"} text={!reserva.cancelada && reserva.estadoDevolucion === "PENDIENTE" ? "dark" : undefined}>{reserva.cancelada ? "Cancelada" : reserva.estadoDevolucion === "PENDIENTE" ? "Pendiente de devolución" : reserva.estadoDevolucion === "CONFORME" ? "Devuelto conforme" : "Devuelto con observaciones"}</Badge></td>
                                        <td>{reserva.observacionesDevolucion || "—"}</td>
                                        <td className="text-end text-nowrap">{!reserva.cancelada && reserva.estadoDevolucion === "PENDIENTE" && <>
                                            {new Date(reserva.inicio) <= new Date() && <Button size="sm" variant="outline-success" className="me-2" onClick={() => setDevolucionId(reserva.id)} disabled={saving}>Devolver</Button>}
                                            {new Date(reserva.inicio) > new Date() && <Button size="sm" variant="outline-danger" onClick={() => setCancelar(reserva)} disabled={saving}>Cancelar</Button>}
                                        </>}</td>
                                    </tr>
                                ))}</tbody>
                            </Table>
                        </div>
                    )}
                    {devolucionId && (
                        <Form onSubmit={guardarDevolucion} className="border border-warning rounded-3 p-3 mt-4">
                            <h3 className="h6 fw-bold">Registrar estado de devolución</h3>
                            <div className="row g-3 align-items-end">
                                <Form.Group className="col-md-3">
                                    <Form.Label>Estado</Form.Label>
                                    <Form.Select value={estadoDevolucion} onChange={event => setEstadoDevolucion(event.target.value)} disabled={saving}>
                                        <option value="CONFORME">Sin novedades</option>
                                        <option value="CON_OBSERVACIONES">Con daños o novedades</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="col-md-7">
                                    <Form.Label>Observaciones</Form.Label>
                                    <Form.Control value={observaciones} onChange={event => setObservaciones(event.target.value)} maxLength={2000} required={estadoDevolucion === "CON_OBSERVACIONES"} placeholder="Describe el daño o novedad" disabled={saving} />
                                </Form.Group>
                                <div className="col-md-2"><Button type="submit" className="w-100" disabled={saving}>Guardar</Button></div>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={onHide} disabled={saving}>Cerrar</Button></Modal.Footer>
            </Modal>
            <ConfirmModal show={Boolean(cancelar)} onHide={() => !saving && setCancelar(null)} onConfirm={confirmarCancelacion} loading={saving} title="Cancelar asignación" confirmText="Cancelar asignación">
                ¿Cancelar la asignación de <strong>{cancelar?.referencia}</strong>?
            </ConfirmModal>
        </>
    );
}
