import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Form, InputGroup, Modal, Spinner, Table } from "react-bootstrap";

import ConfirmModal from "../ConfirmModal";
import EmptyState from "../EmptyState";
import ReservasVehiculoModal from "./ReservasVehiculoModal";
import { createVehiculo, deleteVehiculo, getVehiculos, updateVehiculo } from "../../services/vehiculo.service";

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

const intervaloDia = value => {
    const [year, month, day] = value.split("-").map(Number);
    return {
        inicio: new Date(year, month - 1, day).toISOString(),
        fin: new Date(year, month - 1, day + 1).toISOString()
    };
};

const intervaloHora = (dia, hora) => {
    const [year, month, day] = dia.split("-").map(Number);
    const [hours, minutes] = hora.split(":").map(Number);
    const inicio = new Date(year, month - 1, day, hours, minutes);
    return {
        inicio: inicio.toISOString(),
        fin: new Date(inicio.getTime() + 60 * 60 * 1000).toISOString()
    };
};

export default function VehiculosPanel() {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [habilitacionFiltro, setHabilitacionFiltro] = useState("TODOS");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(inicial);
    const [validated, setValidated] = useState(false);
    const [reservasVehiculo, setReservasVehiculo] = useState(null);
    const [vehiculoAccion, setVehiculoAccion] = useState(null);
    const [changingId, setChangingId] = useState(null);
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
        if (!rango.inicio) {
            setError("Selecciona el día que quieres consultar.");
            return;
        }
        const intervalo = rango.fin
            ? intervaloHora(rango.inicio, rango.fin)
            : intervaloDia(rango.inicio);
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
            const coincideHabilitacion = habilitacionFiltro === "TODOS" ||
                (habilitacionFiltro === "HABILITADOS" && vehiculo.habilitado) ||
                (habilitacionFiltro === "DESHABILITADOS" && !vehiculo.habilitado);
            return texto && coincideHabilitacion && (estadoFiltro === "TODOS" || vehiculo.estado === estadoFiltro);
        });
    }, [vehiculos, search, estadoFiltro, habilitacionFiltro]);

    const resumenVehiculos = useMemo(() => {
        const total = vehiculos.length;
        const deshabilitados = vehiculos.filter(vehiculo => !vehiculo.habilitado).length;
        const habilitados = vehiculos.filter(vehiculo => vehiculo.habilitado);
        const enMantencion = habilitados.filter(vehiculo => vehiculo.estado === "EN_MANTENCION").length;
        const retirados = habilitados.filter(vehiculo => vehiculo.estado === "RETIRADO").length;
        const reservadas = rangoAplicado
            ? habilitados.filter(vehiculo => vehiculo.estado === "DISPONIBLE" && vehiculo.reservado).length
            : null;
        const disponibles = habilitados.filter(vehiculo =>
            vehiculo.estado === "DISPONIBLE" && (!rangoAplicado || !vehiculo.reservado)
        ).length;
        return { total, deshabilitados, enMantencion, retirados, reservadas, disponibles };
    }, [vehiculos, rangoAplicado]);

    const segmentosFlota = [
        { clave: "reservados", etiqueta: "Reservados", valor: resumenVehiculos.reservadas, color: "var(--bs-primary)" },
        { clave: "mantenimiento", etiqueta: "En mantención", valor: resumenVehiculos.enMantencion, color: "var(--bs-warning)" },
        { clave: "retirados", etiqueta: "Retirados", valor: resumenVehiculos.retirados, color: "var(--bs-secondary)" },
        { clave: "disponibles", etiqueta: rangoAplicado ? "Libres en período" : "Estado disponible", valor: resumenVehiculos.disponibles, color: "var(--bs-success)" },
        { clave: "deshabilitados", etiqueta: "Deshabilitados", valor: resumenVehiculos.deshabilitados, color: "var(--bs-dark-border-subtle)" }
    ].filter(segmento => segmento.valor !== null && segmento.valor > 0);

    const totalSegmentos = segmentosFlota.reduce((suma, segmento) => suma + segmento.valor, 0);
    let acumuladoSegmentos = 0;
    const graficoFlota = segmentosFlota.map(segmento => {
        const inicio = acumuladoSegmentos;
        acumuladoSegmentos += segmento.valor;
        return `${segmento.color} ${totalSegmentos ? (inicio / totalSegmentos) * 100 : 0}% ${totalSegmentos ? (acumuladoSegmentos / totalSegmentos) * 100 : 0}%`;
    }).join(", ");

    const confirmarAccionVehiculo = async () => {
        if (!vehiculoAccion) return;
        const { vehiculo, tipo } = vehiculoAccion;
        setChangingId(vehiculo.id);
        setError("");
        setSuccess("");
        try {
            if (tipo === "eliminar") {
                await deleteVehiculo(vehiculo.id);
                setSuccess(`Vehículo ${vehiculo.patente} eliminado definitivamente.`);
            } else {
                await updateVehiculo(vehiculo.id, { habilitado: tipo !== "deshabilitar" });
                setSuccess(tipo === "deshabilitar"
                    ? `Vehículo ${vehiculo.patente} deshabilitado; su historial se conserva.`
                    : `Vehículo ${vehiculo.patente} habilitado.`);
            }
            setVehiculoAccion(null);
            await cargar(rangoAplicado);
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible completar la acción.");
            setVehiculoAccion(null);
        } finally {
            setChangingId(null);
        }
    };

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
                        {rangoAplicado && <Button type="button" variant="outline-secondary" onClick={limpiarDisponibilidad} disabled={loading}>Ver flota</Button>}
                    </div>
                </div>
                {rangoAplicado && <small className="text-secondary d-block mt-2">Mostrando disponibilidad para {rango.fin ? "el horario seleccionado" : "todo el día"}.</small>}
            </Form>

            <Card className="shadow-sm mb-4">
                <Card.Body className="d-flex align-items-center gap-3">
                    <div
                        role="img"
                        aria-label={resumenVehiculos.total
                            ? "Distribución de la flota: " + segmentosFlota.map(segmento => `${segmento.valor} ${segmento.etiqueta.toLowerCase()}`).join(", ")
                            : "Sin vehículos registrados"}
                        style={{
                            width: 96,
                            height: 96,
                            flex: "0 0 96px",
                            borderRadius: "50%",
                            background: `conic-gradient(${graficoFlota || "var(--bs-tertiary-bg) 0% 100%"})`,
                            display: "grid",
                            placeItems: "center"
                        }}
                    >
                        <span className="d-flex align-items-center justify-content-center rounded-circle fw-bold bg-body" style={{ width: 68, height: 68 }}>
                            {resumenVehiculos.total || "—"}
                        </span>
                    </div>
                    <div className="flex-grow-1">
                        <h3 className="h6 fw-bold mb-2">Distribución de la flota</h3>
                        <div className="d-flex flex-wrap gap-3">
                            {segmentosFlota.map(segmento => (
                                <div key={segmento.clave} className="d-flex align-items-center gap-2 small">
                                    <span className="rounded-circle" aria-hidden="true" style={{ width: 10, height: 10, backgroundColor: segmento.color }} />
                                    <span>{segmento.etiqueta}: <strong>{segmento.valor}</strong></span>
                                </div>
                            ))}
                            {!rangoAplicado && <small className="text-secondary">Vista general de la flota; las reservas aparecen al consultar una fecha.</small>}
                            {rangoAplicado && <small className="text-secondary d-block mt-1">Disponibilidad para {new Date(rangoAplicado.inicio).toLocaleString("es-CL")} – {new Date(rangoAplicado.fin).toLocaleString("es-CL")}.</small>}
                            {rangoAplicado && !resumenVehiculos.reservadas && <small className="text-secondary">No hay vehículos reservados en el período consultado.</small>}
                        </div>
                    </div>
                </Card.Body>
            </Card>

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
                <Form.Select value={habilitacionFiltro} onChange={event => setHabilitacionFiltro(event.target.value)} style={{ maxWidth: 220 }} aria-label="Filtrar por habilitación">
                    <option value="TODOS">Habilitación: todos</option>
                    <option value="HABILITADOS">Habilitados</option>
                    <option value="DESHABILITADOS">Deshabilitados</option>
                </Form.Select>
            </div>

            {loading ? <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div> : filtrados.length === 0 ? (
                <EmptyState icon="bi-truck" title={vehiculos.length ? "No se encontraron vehículos" : "Aún no hay vehículos"} description={vehiculos.length ? "Prueba con otros términos o filtros." : "Registra los vehículos de la empresa para coordinar sus salidas."} />
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle">
                        <caption className="caption-top text-secondary">{filtrados.length} vehículos</caption>
                        <thead><tr><th>Vehículo</th><th>Tipo</th><th>Capacidad</th><th>Estado operativo</th><th>Habilitación</th><th>Disponibilidad</th><th className="text-end">Acciones</th></tr></thead>
                        <tbody>{filtrados.map(vehiculo => {
                            const [texto, variant] = etiquetasEstado[vehiculo.estado] ?? etiquetasEstado.RETIRADO;
                            return (
                                <tr key={vehiculo.id}>
                                    <td><div className="fw-semibold">{vehiculo.patente}</div><small className="text-secondary">{vehiculo.marca} {vehiculo.modelo}{vehiculo.anio ? ` · ${vehiculo.anio}` : ""}</small></td>
                                    <td>{vehiculo.tipo}</td>
                                    <td>{vehiculo.capacidadPasajeros ? `${vehiculo.capacidadPasajeros} pasajeros` : "No informada"}</td>
                                    <td><Badge bg={variant} text={variant === "warning" ? "dark" : undefined}>{texto}</Badge></td>
                                    <td><Badge bg={vehiculo.habilitado ? "success" : "secondary"}>{vehiculo.habilitado ? "Habilitado" : "Deshabilitado"}</Badge></td>
                                    <td>{!vehiculo.habilitado || vehiculo.estado !== "DISPONIBLE" ? <span className="text-secondary">No asignable</span> : rangoAplicado ? <Badge bg={vehiculo.disponible ? "success" : "warning"} text={vehiculo.disponible ? undefined : "dark"}>{vehiculo.disponible ? "Disponible" : "Ocupado"}</Badge> : <span className="text-secondary">Consulta un horario</span>}</td>
                                    <td className="text-end text-nowrap">
                                        <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                                        <Button size="sm" variant="outline-secondary" onClick={() => setReservasVehiculo(vehiculo)}><i className="bi bi-calendar2-week me-1" />Agenda</Button>
                                        <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(vehiculo)}><i className="bi bi-pencil me-1" />Editar</Button>
                                        <Button
                                            size="sm"
                                            variant={vehiculo.habilitado ? "outline-warning" : "outline-success"}
                                            disabled={changingId === vehiculo.id}
                                            onClick={() => setVehiculoAccion({ vehiculo, tipo: vehiculo.habilitado ? "deshabilitar" : "habilitar" })}
                                        >
                                            {vehiculo.habilitado ? "Deshabilitar" : "Habilitar"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            disabled={changingId === vehiculo.id}
                                            onClick={() => setVehiculoAccion({ vehiculo, tipo: "eliminar" })}
                                        >
                                            <i className="bi bi-trash me-1" />Eliminar
                                        </Button>
                                        </div>
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

            <ConfirmModal
                show={Boolean(vehiculoAccion)}
                onHide={() => changingId === null && setVehiculoAccion(null)}
                onConfirm={vehiculoAccion?.tipo === "eliminar" && vehiculoAccion.vehiculo._count?.reservas
                    ? () => setVehiculoAccion(null)
                    : confirmarAccionVehiculo}
                loading={Boolean(vehiculoAccion && changingId === vehiculoAccion.vehiculo.id)}
                title={vehiculoAccion?.tipo === "eliminar"
                    ? "Eliminar vehículo definitivamente"
                    : vehiculoAccion?.tipo === "deshabilitar" ? "Deshabilitar vehículo" : "Habilitar vehículo"}
                confirmText={vehiculoAccion?.tipo === "eliminar"
                    ? vehiculoAccion.vehiculo._count?.reservas ? "Entendido" : "Eliminar definitivamente"
                    : vehiculoAccion?.tipo === "deshabilitar" ? "Deshabilitar" : "Habilitar"}
                variant={vehiculoAccion?.tipo === "habilitar" ? "success" : vehiculoAccion?.tipo === "eliminar" && vehiculoAccion.vehiculo._count?.reservas ? "secondary" : "danger"}
            >
                {vehiculoAccion?.tipo === "eliminar"
                    ? vehiculoAccion.vehiculo._count?.reservas
                        ? <><strong>{vehiculoAccion.vehiculo.patente}</strong> no se puede eliminar porque tiene {vehiculoAccion.vehiculo._count.reservas} {vehiculoAccion.vehiculo._count.reservas === 1 ? "reserva" : "reservas"} asociadas. Deshabilítalo para conservar el historial.</>
                        : <>¿Eliminar <strong>{vehiculoAccion.vehiculo.patente}</strong> definitivamente? Esta acción no se puede deshacer.</>
                    : vehiculoAccion?.tipo === "deshabilitar"
                        ? <>¿Deshabilitar <strong>{vehiculoAccion?.vehiculo.patente}</strong>? No podrá recibir nuevas reservas y conservará su estado operativo e historial.</>
                        : <>¿Habilitar <strong>{vehiculoAccion?.vehiculo.patente}</strong>? Podrá volver a reservarse si su estado operativo es disponible.</>}
            </ConfirmModal>
        </>
    );
}
