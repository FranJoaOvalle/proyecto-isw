import { Button, Card, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { fechaSeguimiento } from "./seguimiento.utils";

export default function EventoReservas({ evento, administrar }) {
    const reservas = [
        ...(evento.reservasEspacio ?? []).map((r) => ({
            ...r,
            tipo: "Espacio",
            nombre: r.espacio.nombre
        })),
        ...(evento.reservasRecurso ?? []).map((r) => ({
            ...r,
            tipo: "Equipo",
            nombre: `${r.recurso.nombre} · ${r.cantidad} unidades`
        })),
        ...(evento.reservasVehiculo ?? []).map((r) => ({
            ...r,
            tipo: "Vehículo",
            nombre: r.vehiculo.patente
        }))
    ];
    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <h2 className="h5">Recinto y reservas</h2>
                {evento.espacio && (
                    <p>
                        {evento.lugar} · {evento.direccion || evento.espacio.direccion}{evento.comuna ? `, ${evento.comuna}` : ""}
                    </p>
                )}
                {evento.espacioId && !evento.reservasEspacio?.some(reserva => !reserva.cancelada && reserva.espacioId === evento.espacioId) && <p className="text-warning">Recinto seleccionado · Sin reserva de espacio.</p>}
                {reservas.length ? (
                    <div className="table-responsive">
                        <Table size="sm">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Recurso</th>
                                    <th>Inicio</th>
                                    <th>Término</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservas.map((reserva) => (
                                    <tr key={`${reserva.tipo}-${reserva.id}`}>
                                        <td>{reserva.tipo}</td>
                                        <td>{reserva.nombre}</td>
                                        <td>
                                            {fechaSeguimiento(reserva.inicio)}
                                        </td>
                                        <td>{fechaSeguimiento(reserva.fin)}</td>
                                        <td>
                                            {reserva.cancelada
                                                ? "Cancelada"
                                                : reserva.estadoDevolucion ===
                                                    "PENDIENTE"
                                                  ? "Pendiente de devolución"
                                                  : reserva.estadoDevolucion
                                                    ? "Devuelta"
                                                    : "Vigente"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-secondary">
                        El evento todavía no tiene reservas vinculadas.
                    </p>
                )}
                {administrar &&
                    !["CANCELADO", "COMPLETADO"].includes(evento.estado) && (
                        <Button
                            as={Link}
                            to={`/admin/recursos?eventoId=${evento.id}`}
                        >
                            Gestionar reservas
                        </Button>
                    )}
            </Card.Body>
        </Card>
    );
}
