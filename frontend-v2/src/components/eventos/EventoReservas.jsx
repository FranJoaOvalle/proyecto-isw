import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import ReservasRecursoModal from "../recursos/ReservasRecursoModal";
import ReservasVehiculoModal from "../recursos/ReservasVehiculoModal";
import { getRecursos } from "../../services/recurso.service";
import { getVehiculos } from "../../services/vehiculo.service";
import { direccionConComuna, fechaSeguimiento, mensajeError } from "./seguimiento.utils";

function estadoReserva(reserva) {
    if (reserva.cancelada) return { texto: "Cancelada", variante: "secondary" };
    if (reserva.estadoDevolucion === "PENDIENTE") return { texto: "Pendiente de devolución", variante: "warning" };
    if (reserva.estadoDevolucion) return { texto: "Devuelta", variante: "success" };
    return { texto: "Vigente", variante: "primary" };
}

export default function EventoReservas({ evento, administrar, onCambio }) {
    const [recursos, setRecursos] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [recursoId, setRecursoId] = useState("");
    const [vehiculoId, setVehiculoId] = useState("");
    const [recursoAbierto, setRecursoAbierto] = useState(null);
    const [vehiculoAbierto, setVehiculoAbierto] = useState(null);
    const [error, setError] = useState("");
    const puedeGestionar = administrar && !["CANCELADO", "COMPLETADO"].includes(evento.estado) &&
        new Date(evento.inicio) > new Date();
    const cargarOpciones = useCallback(() => {
        const intervalo = { inicio: evento.inicio, fin: evento.fin };
        return Promise.all([
            getRecursos(true, intervalo),
            getVehiculos(intervalo, true)
        ]);
    }, [evento.inicio, evento.fin]);

    useEffect(() => {
        if (!puedeGestionar) return;
        let activo = true;
        cargarOpciones()
            .then(([equipos, transporte]) => {
                if (activo) {
                    setRecursos(equipos);
                    setVehiculos(transporte);
                }
            })
            .catch(err => {
                if (activo) setError(mensajeError(err, "No fue posible cargar los equipos y vehículos."));
            });
        return () => { activo = false; };
    }, [puedeGestionar, cargarOpciones]);

    const actualizarReservas = async () => {
        await onCambio();
        const [equipos, transporte] = await cargarOpciones();
        setRecursos(equipos);
        setVehiculos(transporte);
    };
    const reservas = [
        ...(evento.reservasEspacio ?? []).map((r) => ({
            ...r,
            tipo: "Espacio",
            nombre: r.espacio.nombre
        })),
        ...(evento.reservasRecurso ?? []).map((r) => ({
            ...r,
            tipo: "Equipo",
            nombre: `${r.recurso.nombre} · ${r.cantidad} ${r.cantidad === 1 ? "unidad" : "unidades"}`,
            recursoId: r.recursoId
        })),
        ...(evento.reservasVehiculo ?? []).map((r) => ({
            ...r,
            tipo: "Vehículo",
            nombre: r.vehiculo.patente,
            vehiculoId: r.vehiculoId
        }))
    ];
    return (
        <>
        <Card className="shadow-sm mb-4">
            <Card.Body className="p-4">
                <h2 className="h5 mb-3">Recinto y reservas</h2>
                {evento.espacio && (
                    <p className="text-body-secondary mb-3">
                        {evento.lugar} · {direccionConComuna(evento.direccion || evento.espacio.direccion, evento.comuna)}
                    </p>
                )}
                {evento.espacioId && !["CANCELADO", "COMPLETADO"].includes(evento.estado) &&
                    !evento.reservasEspacio?.some(reserva => !reserva.cancelada && reserva.espacioId === evento.espacioId) &&
                    <p className="text-warning">
                        El recinto aún no tiene una reserva activa.
                        {administrar && " Guarda la ubicación para registrarla automáticamente."}
                    </p>}
                {reservas.length ? (
                    <div className="table-responsive">
                        <Table hover size="sm" className="align-middle mb-0" style={{ minWidth: 650 }}>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Recurso</th>
                                    <th>Inicio</th>
                                    <th>Término</th>
                                    <th>Estado</th>
                                    {puedeGestionar && <th className="text-end">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {reservas.map((reserva) => {
                                    const estado = estadoReserva(reserva);
                                    return (
                                        <tr key={`${reserva.tipo}-${reserva.id}`}>
                                            <td>{reserva.tipo}</td>
                                            <td>{reserva.nombre}</td>
                                            <td>{fechaSeguimiento(reserva.inicio)}</td>
                                            <td>{fechaSeguimiento(reserva.fin)}</td>
                                            <td><Badge bg={estado.variante}>{estado.texto}</Badge></td>
                                            {puedeGestionar && <td className="text-end">
                                                {!reserva.cancelada && new Date(reserva.inicio) > new Date() && reserva.tipo === "Equipo" &&
                                                    reserva.referencia !== `Contrato evento #${evento.id}` && recursos.some(item => item.id === reserva.recursoId) &&
                                                    <Button size="sm" variant="outline-primary" onClick={() => setRecursoAbierto(recursos.find(item => item.id === reserva.recursoId))}>Gestionar</Button>}
                                                {!reserva.cancelada && new Date(reserva.inicio) > new Date() && reserva.tipo === "Vehículo" && vehiculos.some(item => item.id === reserva.vehiculoId) &&
                                                    <Button size="sm" variant="outline-primary" onClick={() => setVehiculoAbierto(vehiculos.find(item => item.id === reserva.vehiculoId))}>Gestionar</Button>}
                                            </td>}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-body-secondary">
                        El evento todavía no tiene reservas vinculadas.
                    </p>
                )}
                {puedeGestionar && <div className="border-top mt-4 pt-3">
                    <h3 className="h6">Asignaciones adicionales</h3>
                    <p className="small text-body-secondary">
                        {evento.solicitudId
                            ? "El recinto y los equipos cotizados se reservan al contratar. Añade aquí asignaciones operativas adicionales; estas no modifican la propuesta económica."
                            : "El recinto se reserva al guardar la ubicación. Añade aquí equipos o vehículos para este evento."}
                    </p>
                    {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
                    <div className="d-flex flex-wrap gap-3">
                        <Form.Group>
                            <Form.Label>Equipo</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Select value={recursoId} onChange={e => setRecursoId(e.target.value)} aria-label="Equipo para el evento">
                                    <option value="">Selecciona un equipo</option>
                                    {recursos.filter(item => item.activo && item.cantidadDisponible > 0 &&
                                        !(evento.solicitudId && evento.recursos?.some(cotizado => cotizado.recursoId === item.id))).map(item =>
                                        <option key={item.id} value={item.id}>{item.nombre}</option>)}
                                </Form.Select>
                                <Button variant="outline-primary" disabled={!recursoId} onClick={() => setRecursoAbierto(recursos.find(item => item.id === Number(recursoId)))}>Asignar</Button>
                            </div>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Vehículo</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Select value={vehiculoId} onChange={e => setVehiculoId(e.target.value)} aria-label="Vehículo para el evento">
                                    <option value="">Selecciona un vehículo</option>
                                    {vehiculos.filter(item => item.disponible).map(item =>
                                        <option key={item.id} value={item.id}>{item.patente}</option>)}
                                </Form.Select>
                                <Button variant="outline-primary" disabled={!vehiculoId} onClick={() => setVehiculoAbierto(vehiculos.find(item => item.id === Number(vehiculoId)))}>Asignar</Button>
                            </div>
                        </Form.Group>
                    </div>
                    <p className="small text-body-secondary mt-3 mb-0">Las devoluciones y los bloqueos independientes se gestionan en <Link to="/admin/recursos">Recursos y espacios</Link>.</p>
                </div>}
                {administrar && !puedeGestionar && !["CANCELADO", "COMPLETADO"].includes(evento.estado) &&
                    <p className="small text-body-secondary mt-3 mb-0">Las nuevas asignaciones se registran antes del inicio del evento. Consulta las reservas y registra devoluciones en <Link to="/admin/recursos">Recursos y espacios</Link>.</p>}
            </Card.Body>
        </Card>
        <ReservasRecursoModal key={`${evento.id}-${recursoAbierto?.id ?? "cerrado"}`} eventoInicial={evento} recurso={recursoAbierto} show={Boolean(recursoAbierto)} onHide={() => setRecursoAbierto(null)} onChanged={actualizarReservas} />
        <ReservasVehiculoModal key={`${evento.id}-${vehiculoAbierto?.id ?? "cerrado"}`} eventoInicial={evento} vehiculo={vehiculoAbierto} show={Boolean(vehiculoAbierto)} onHide={() => setVehiculoAbierto(null)} onChanged={actualizarReservas} />
        </>
    );
}
