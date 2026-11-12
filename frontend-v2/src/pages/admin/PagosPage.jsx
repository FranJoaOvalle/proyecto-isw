import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from "react-bootstrap";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { listarPagos } from "../../services/pago.service.js";

const etiquetasEstado = {
    PENDIENTE: "Pendiente",
    PAGADO: "Pagado",
    FALLIDO: "Fallido",
    REEMBOLSADO: "Reembolsado"
};

const coloresEstado = {
    PENDIENTE: "warning",
    PAGADO: "success",
    FALLIDO: "danger",
    REEMBOLSADO: "secondary"
};

const formatearMonto = (monto) =>
    Number(monto ?? 0).toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    });

const formatearFecha = (valor) =>
    valor
        ? new Date(valor).toLocaleString("es-CL", {
              dateStyle: "short",
              timeStyle: "short"
          })
        : "—";

const contextoPago = (pago) => {
    const presupuesto = pago.presupuesto;
    const tipoEvento = presupuesto?.nombreTipoEvento ?? "Evento";

    if (presupuesto?.evento?.id) {
        return `${tipoEvento} · Evento #${presupuesto.evento.id}`;
    }
    if (presupuesto?.solicitudId) {
        return `${tipoEvento} · Solicitud #${presupuesto.solicitudId}`;
    }
    return `${tipoEvento} · Presupuesto #${pago.presupuestoId}`;
};

const mensajeError = (error) =>
    error.response?.data?.error?.message ??
    error.message ??
    "No fue posible cargar el historial de pagos.";

export default function PagosPage() {
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("TODOS");

    const cargarPagos = useCallback(async () => {
        try {
            const resultado = await listarPagos();
            if (!Array.isArray(resultado)) {
                throw new Error("El servidor devolvió un formato de pagos inválido.");
            }
            setPagos(resultado);
        } catch (err) {
            setPagos([]);
            setError(mensajeError(err));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let vigente = true;
        listarPagos()
            .then((resultado) => {
                if (!Array.isArray(resultado)) {
                    throw new Error("El servidor devolvió un formato de pagos inválido.");
                }
                if (vigente) setPagos(resultado);
            })
            .catch((err) => {
                if (vigente) {
                    setPagos([]);
                    setError(mensajeError(err));
                }
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });
        return () => {
            vigente = false;
        };
    }, []);

    const reintentarCarga = () => {
        setCargando(true);
        setError("");
        cargarPagos();
    };

    const pagosVisibles = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase("es-CL");
        return pagos.filter((pago) => {
            const coincideEstado = estado === "TODOS" || pago.estado === estado;
            const texto = [
                pago.id,
                pago.presupuestoId,
                pago.tipo,
                pago.referencia,
                contextoPago(pago)
            ].join(" ").toLocaleLowerCase("es-CL");
            return coincideEstado && (!termino || texto.includes(termino));
        });
    }, [pagos, busqueda, estado]);

    return (
        <Container className="py-4">
            <PageHeader
                title="Historial de pagos"
                description="Consulta los pagos asociados a presupuestos, eventos y solicitudes."
            />

            <Alert variant="info" className="d-flex gap-2 align-items-start">
                <i className="bi bi-info-circle-fill mt-1" aria-hidden="true" />
                <span>
                    Módulo de historial financiero en modo visualización. La integración transaccional con pasarelas de pago estará disponible próximamente.
                </span>
            </Alert>

            {error && (
                <Alert variant="danger">
                    {error}{" "}
                    <Button variant="link" className="p-0" onClick={reintentarCarga}>
                        Reintentar
                    </Button>
                </Alert>
            )}

            <Card className="shadow-sm">
                <Card.Body>
                    <div className="d-flex flex-column flex-md-row gap-3 mb-3">
                        <Form.Group className="flex-grow-1">
                            <Form.Label className="visually-hidden">Buscar pagos</Form.Label>
                            <Form.Control
                                type="search"
                                placeholder="Buscar por pago, presupuesto, evento o solicitud"
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                            />
                        </Form.Group>
                        <Form.Group style={{ minWidth: "12rem" }}>
                            <Form.Label className="visually-hidden">Filtrar por estado</Form.Label>
                            <Form.Select
                                aria-label="Filtrar por estado"
                                value={estado}
                                onChange={(event) => setEstado(event.target.value)}
                            >
                                <option value="TODOS">Todos los estados</option>
                                {Object.entries(etiquetasEstado).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </div>

                    {cargando ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status" />
                            <p className="text-muted mt-2 mb-0">Cargando pagos...</p>
                        </div>
                    ) : error ? null : pagosVisibles.length ? (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Pago</th>
                                        <th scope="col">Fecha</th>
                                        <th scope="col">Monto</th>
                                        <th scope="col">Tipo</th>
                                        <th scope="col">Estado</th>
                                        <th scope="col">Evento / solicitud</th>
                                        <th scope="col">Presupuesto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagosVisibles.map((pago) => (
                                        <tr key={pago.id}>
                                            <td className="fw-semibold">#{pago.id}</td>
                                            <td>{formatearFecha(pago.fechaPago ?? pago.createdAt)}</td>
                                            <td className="text-nowrap">{formatearMonto(pago.monto)}</td>
                                            <td>{pago.tipo === "ANTICIPO" ? "Anticipo" : pago.tipo}</td>
                                            <td>
                                                <Badge bg={coloresEstado[pago.estado] ?? "secondary"}>
                                                    {etiquetasEstado[pago.estado] ?? pago.estado}
                                                </Badge>
                                            </td>
                                            <td>{contextoPago(pago)}</td>
                                            <td>#{pago.presupuestoId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : pagos.length ? (
                        <EmptyState
                            icon="bi-search"
                            title="No hay pagos coincidentes"
                            description="Prueba con otro texto o selecciona un estado distinto."
                        />
                    ) : (
                        <EmptyState
                            icon="bi-cash-stack"
                            title="Aún no hay pagos registrados"
                            description="Los pagos existentes aparecerán aquí cuando estén asociados a un presupuesto."
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
