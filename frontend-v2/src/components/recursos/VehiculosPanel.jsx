import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, InputGroup, Modal, Spinner, Table } from "react-bootstrap";

import EmptyState from "../EmptyState";
import ReservasVehiculoModal from "./ReservasVehiculoModal";
import { createVehiculo, getVehiculos, updateVehiculo } from "../../services/vehiculo.service";

const inicial = {
    patente: "",
    tipo: "Furgón",
    marca: "",
    modelo: "",
    anio: "",
    capacidadPasajeros: "",
    estado: "DISPONIBLE",
    observaciones: ""
};

const etiquetasEstado = {
    DISPONIBLE: ["Disponible", "success"],
    EN_MANTENCION: ["En mantención", "warning"],
    RETIRADO: ["Retirado", "secondary"]
};

export default function VehiculosPanel() {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(inicial);
    const [validated, setValidated] = useState(false);
    const [reservasVehiculo, setReservasVehiculo] = useState(null);
    const [rango, setRango] = useState({ inicio: "", fin: "" });
    const [rangoAplicado, setRangoAplicado] = useState(null);

    const cargar = useCallback(async (intervalo = null) => {
        try {
            const data = await getVehiculos(intervalo, true);
            setVehiculos(data);
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible cargar los vehículos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // La lista inicial se sincroniza con la API al montar el panel.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void cargar();
    }, [cargar]);

    const buscarDisponibilidad = async event => {
        event.preventDefault();
        setError("");
        if (!rango.inicio || !rango.fin) {
            setError("Indica el inicio y término del período.");
            return;
        }
        const inicio = new Date(rango.inicio);
        const fin = new Date(rango.fin);
        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
            setError("La fecha de término debe ser posterior al inicio.");
            return;
        }
        const intervalo = { inicio: inicio.toISOString(), fin: fin.toISOString() };
        setRangoAplicado(intervalo);
        setLoading(true);
        await cargar(intervalo);
    };

    const limpiarDisponibilidad = async () => {
        setRangoAplicado(null);
        setRango({ inicio: "", fin: "" });
        setLoading(true);
        await cargar(null);
    };

    const abrirCrear = () => {
        setEditing(null);
        setForm({ ...inicial });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const abrirEditar = vehiculo => {
        setEditing(vehiculo);
        setForm({
            patente: vehiculo.patente,
            tipo: vehiculo.tipo,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio: vehiculo.anio == null ? "" : String(vehiculo.anio),
            capacidadPasajeros: vehiculo.capacidadPasajeros == null ? "" : String(vehiculo.capacidadPasajeros),
            estado: vehiculo.estado,
            observaciones: vehiculo.observaciones ?? ""
        });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const cerrarModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
    };

    const guardar = async event => {
        event.preventDefault();
        const element = event.currentTarget;
        if (!element.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }
        setSaving(true);
        setError("");
        setSuccess("");
        const data = {
            patente: form.patente.trim().toUpperCase(),
            tipo: form.tipo.trim(),
            marca: form.marca.trim(),
            modelo: form.modelo.trim(),
            anio: form.anio === "" ? null : Number(form.anio),
            capacidadPasajeros: form.capacidadPasajeros === "" ? null : Number(form.capacidadPasajeros),
            estado: form.estado,
            observaciones: form.observaciones.trim() || null
        };
        try {
            if (editing) await updateVehiculo(editing.id, data);
            else await createVehiculo(data);
            setShowModal(false);
            setEditing(null);
            setSuccess(editing ? "Vehículo actualizado correctamente." : "Vehículo registrado correctamente.");
            await cargar();
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible guardar el vehículo.");
        } finally {
            setSaving(false);
        }
    };

    const filtrados = useMemo(() => {
        const termino = search.trim().toLowerCase();
        return vehiculos.filter(vehiculo => {
            const texto = [vehiculo.patente, vehiculo.tipo, vehiculo.marca, vehiculo.modelo]
                .some(valor => valor.toLowerCase().includes(termino));
            return texto && (estadoFiltro === "TODOS" || vehiculo.estado === estadoFiltro);
        });
    }, [vehiculos, search, estadoFiltro]);

    return (
        <>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="h4 fw-bold mb-1">Flota de vehículos</h2>
                    <p className="text-secondary mb-0">Registra los vehículos, su mantención y las asignaciones a eventos.</p>
                </div>
                <Button onClick={abrirCrear}><i className="bi bi-plus-lg me-2" />Nuevo vehículo</Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

            <Form onSubmit={buscarDisponibilidad} className="border rounded-3 p-3 mb-4 bg-body-tertiary">
                <div className="d-flex align-items-center gap-2 mb-3"><i className="bi bi-calendar2-check text-primary" /><strong>Consultar vehículos disponibles</strong></div>
                <div className="row align-items-end g-3">
                    <Form.Group className="col-md-4">
                        <Form.Label>Desde</Form.Label>
                        <Form.Control type="datetime-local" value={rango.inicio} onChange={event => setRango(current => ({ ...current, inicio: event.target.value }))} required />
                    </Form.Group>
                    <Form.Group className="col-md-4">
                        <Form.Label>Hasta</Form.Label>
                        <Form.Control type="datetime-local" value={rango.fin} onChange={event => setRango(current => ({ ...current, fin: event.target.value }))} required />
                    </Form.Group>
                    <div className="col-md-4 d-flex gap-2">
                        <Button type="submit" disabled={loading}><i className="bi bi-search me-2" />Consultar</Button>
                        {rangoAplicado && <Button type="button" variant="outline-secondary" onClick={limpiarDisponibilidad} disabled={loading}>Ver flota</Button>}
                    </div>
                </div>
                {rangoAplicado && <small className="text-secondary d-block mt-2">Mostrando disponibilidad para el horario seleccionado.</small>}
            </Form>

            <div className="d-flex flex-column flex-lg-row gap-3 mb-4">
                <InputGroup className="flex-grow-1">
                    <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                    <Form.Control value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por patente, tipo, marca o modelo..." />
                </InputGroup>
                <Form.Select value={estadoFiltro} onChange={event => setEstadoFiltro(event.target.value)} style={{ maxWidth: 220 }}>
                    <option value="TODOS">Todos los estados</option>
                    <option value="DISPONIBLE">Disponibles</option>
                    <option value="EN_MANTENCION">En mantención</option>
                    <option value="RETIRADO">Retirados</option>
                </Form.Select>
            </div>

            {loading ? <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div> : filtrados.length === 0 ? (
                <EmptyState icon="bi-truck" title={vehiculos.length ? "No se encontraron vehículos" : "Aún no hay vehículos"} description={vehiculos.length ? "Prueba con otros términos o filtros." : "Registra los vehículos de la empresa para coordinar sus salidas."} />
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle">
                        <caption className="caption-top text-secondary">{filtrados.length} vehículos</caption>
                        <thead><tr><th>Vehículo</th><th>Tipo</th><th>Capacidad</th><th>Estado operativo</th><th>Disponibilidad</th><th className="text-end">Acciones</th></tr></thead>
                        <tbody>{filtrados.map(vehiculo => {
                            const [texto, variant] = etiquetasEstado[vehiculo.estado] ?? etiquetasEstado.RETIRADO;
                            return (
                                <tr key={vehiculo.id}>
                                    <td><div className="fw-semibold">{vehiculo.patente}</div><small className="text-secondary">{vehiculo.marca} {vehiculo.modelo}{vehiculo.anio ? ` · ${vehiculo.anio}` : ""}</small></td>
                                    <td>{vehiculo.tipo}</td>
                                    <td>{vehiculo.capacidadPasajeros ? `${vehiculo.capacidadPasajeros} pasajeros` : "No informada"}</td>
                                    <td><Badge bg={variant} text={variant === "warning" ? "dark" : undefined}>{texto}</Badge></td>
                                    <td>{vehiculo.estado !== "DISPONIBLE" ? <span className="text-secondary">No asignable</span> : rangoAplicado ? <Badge bg={vehiculo.disponible ? "success" : "warning"} text={vehiculo.disponible ? undefined : "dark"}>{vehiculo.disponible ? "Disponible" : "Ocupado"}</Badge> : <span className="text-secondary">Consulta un horario</span>}</td>
                                    <td className="text-end text-nowrap">
                                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => setReservasVehiculo(vehiculo)}><i className="bi bi-calendar2-week me-1" />Agenda</Button>
                                        <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(vehiculo)}><i className="bi bi-pencil me-1" />Editar</Button>
                                    </td>
                                </tr>
                            );
                        })}</tbody>
                    </Table>
                </div>
            )}

            <Modal show={showModal} onHide={cerrarModal} centered>
                <Form noValidate validated={validated} onSubmit={guardar}>
                    <Modal.Header closeButton={!saving}><Modal.Title>{editing ? "Editar vehículo" : "Registrar vehículo"}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Patente</Form.Label>
                                <Form.Control value={form.patente} onChange={event => setForm(current => ({ ...current, patente: event.target.value.toUpperCase() }))} minLength={5} maxLength={15} pattern="[A-Za-z0-9-]{5,15}" required disabled={saving} placeholder="Ej. AB1234" />
                                <Form.Control.Feedback type="invalid">Ingresa una patente válida.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Tipo de vehículo</Form.Label>
                                <Form.Control value={form.tipo} onChange={event => setForm(current => ({ ...current, tipo: event.target.value }))} minLength={2} maxLength={60} required disabled={saving} placeholder="Furgón, camioneta..." />
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Marca</Form.Label>
                                <Form.Control value={form.marca} onChange={event => setForm(current => ({ ...current, marca: event.target.value }))} minLength={2} maxLength={60} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Modelo</Form.Label>
                                <Form.Control value={form.modelo} onChange={event => setForm(current => ({ ...current, modelo: event.target.value }))} maxLength={80} required disabled={saving} />
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Año</Form.Label>
                                <Form.Control type="number" value={form.anio} onChange={event => setForm(current => ({ ...current, anio: event.target.value }))} min={1900} max={2200} step={1} disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Capacidad de pasajeros</Form.Label>
                                <Form.Control type="number" value={form.capacidadPasajeros} onChange={event => setForm(current => ({ ...current, capacidadPasajeros: event.target.value }))} min={1} max={2147483647} step={1} disabled={saving} />
                            </Form.Group>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Estado operativo</Form.Label>
                            <Form.Select value={form.estado} onChange={event => setForm(current => ({ ...current, estado: event.target.value }))} disabled={saving}>
                                <option value="DISPONIBLE">Disponible</option>
                                <option value="EN_MANTENCION">En mantención</option>
                                <option value="RETIRADO">Retirado</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Observaciones</Form.Label>
                            <Form.Control as="textarea" rows={3} value={form.observaciones} onChange={event => setForm(current => ({ ...current, observaciones: event.target.value }))} maxLength={2000} disabled={saving} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>{saving && <Spinner size="sm" className="me-2" />}{editing ? "Guardar cambios" : "Registrar vehículo"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ReservasVehiculoModal
                vehiculo={reservasVehiculo}
                show={Boolean(reservasVehiculo)}
                onHide={() => setReservasVehiculo(null)}
                onChanged={cargar}
            />
        </>
    );
}
