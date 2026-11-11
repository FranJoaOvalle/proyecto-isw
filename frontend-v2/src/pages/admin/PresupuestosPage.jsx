import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Spinner,
    Table
} from "react-bootstrap";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import TableToolbar from "../../components/admin/TableToolbar";
import PresupuestoFormularioModal from "../../components/presupuestos/PresupuestoFormularioModal";
import { listarSolicitudes } from "../../services/solicitud.service";
import { getTiposEvento } from "../../services/tipoEvento.service";
import { listarRecursos } from "../../services/recurso.service";
import {
    cancelarPresupuesto,
    listarPresupuestos
} from "../../services/presupuesto.service";
import { mensajeError } from "../../components/eventos/seguimiento.utils";

const nombresEstado = {
    BORRADOR: "Borrador",
    PENDIENTE_PAGO: "Pendiente de pago",
    ACEPTADO: "Aceptado",
    CANCELADO: "Cancelado",
    VENCIDO: "Vencido"
};

const varianteEstado = {
    BORRADOR: "secondary",
    PENDIENTE_PAGO: "warning",
    ACEPTADO: "success",
    CANCELADO: "danger",
    VENCIDO: "dark"
};

const moneda = (valor) =>
    Number(valor ?? 0).toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    });

const fecha = (valor) =>
    valor ? new Date(valor).toLocaleString("es-CL") : "—";

const nombreCliente = (cliente) =>
    cliente?.empresa?.razonSocial ||
    [cliente?.persona?.nombres, cliente?.persona?.apellidos]
        .filter(Boolean)
        .join(" ") || (cliente?.id ? `Cliente #${cliente.id}` : "Cliente");

const comoLista = (resultado) =>
    Array.isArray(resultado) ? resultado : resultado?.items ?? [];

async function listarSolicitudesRevision() {
    const limite = 100;
    const primera = await listarSolicitudes({
        estado: "EN_REVISION",
        pagina: 1,
        limite
    });
    const paginas = Math.ceil((primera?.total ?? primera?.items?.length ?? 0) / limite);
    if (paginas <= 1) return comoLista(primera);
    const restantes = await Promise.all(
        Array.from({ length: paginas - 1 }, (_, indice) =>
            listarSolicitudes({ estado: "EN_REVISION", pagina: indice + 2, limite })
        )
    );
    return [...comoLista(primera), ...restantes.flatMap(comoLista)];
}

export default function PresupuestosPage() {
    const [presupuestos, setPresupuestos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [recursos, setRecursos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoRecursos, setCargandoRecursos] = useState(false);
    const [error, setError] = useState("");
    const [errorRecursos, setErrorRecursos] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [presupuestoCancelar, setPresupuestoCancelar] = useState(null);
    const [cancelando, setCancelando] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            const [listaPresupuestos, solicitudesRevision, tiposEvento] = await Promise.all([
                listarPresupuestos(),
                listarSolicitudesRevision(),
                getTiposEvento(true)
            ]);
            setPresupuestos(comoLista(listaPresupuestos));
            const tiposPorId = new Map(tiposEvento.map((tipo) => [tipo.id, tipo]));
            const solicitudesConTipo = solicitudesRevision
                .map((solicitud) => ({
                    ...solicitud,
                    tipoEvento: tiposPorId.get(solicitud.tipoEventoId) ?? solicitud.tipoEvento
                }))
                .filter((solicitud) => solicitud.tipoEvento?.activo);
            setSolicitudes(solicitudesConTipo);
        } catch (err) {
            setError(mensajeError(err, "No fue posible cargar los presupuestos."));
        } finally {
            setCargando(false);
        }

        setCargandoRecursos(true);
        setErrorRecursos("");
        try {
            setRecursos(comoLista(await listarRecursos()));
        } catch (err) {
            setRecursos([]);
            setErrorRecursos(
                mensajeError(err, "No fue posible cargar el catálogo de recursos.")
            );
        } finally {
            setCargandoRecursos(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const presupuestosVisibles = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase("es-CL");
        return presupuestos.filter((presupuesto) => {
            const coincideEstado = filtroEstado === "TODOS" || presupuesto.estado === filtroEstado;
            const texto = [
                presupuesto.id,
                presupuesto.solicitudId,
                presupuesto.tipoEvento?.nombre,
                nombreCliente(presupuesto.cliente)
            ].join(" ").toLocaleLowerCase("es-CL");
            return coincideEstado && (!termino || texto.includes(termino));
        });
    }, [presupuestos, busqueda, filtroEstado]);

    async function confirmarCancelacion() {
        if (!presupuestoCancelar || cancelando) return;
        setCancelando(true);
        setError("");
        try {
            await cancelarPresupuesto(presupuestoCancelar.id);
            setPresupuestoCancelar(null);
            setMensaje("Presupuesto cancelado correctamente.");
            await cargarDatos();
        } catch (err) {
            setError(mensajeError(err, "No fue posible cancelar el presupuesto."));
        } finally {
            setCancelando(false);
        }
    }

    function presupuestoGuardado() {
        setMostrarFormulario(false);
        setMensaje("Cotización creada correctamente.");
        cargarDatos();
    }

    return (
        <Container className="py-5">
            <PageHeader
                title="Presupuestos"
                description="Prepara cotizaciones a partir de solicitudes que están en revisión."
            >
                <Button
                    onClick={() => setMostrarFormulario(true)}
                    disabled={cargando || !solicitudes.length}
                >
                    <i className="bi bi-plus-lg me-2" />Nueva cotización
                </Button>
            </PageHeader>

            {mensaje && (
                <Alert variant="success" dismissible onClose={() => setMensaje("")}>
                    {mensaje}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError("")}>
                    {error}
                    <Button variant="link" className="p-0 ms-2" onClick={cargarDatos}>
                        Reintentar
                    </Button>
                </Alert>
            )}
            <Alert variant="info">
                Las cotizaciones solo se pueden emitir desde solicitudes en estado <strong>EN_REVISION</strong>.
                Si una solicitud está pendiente, primero debe pasar a revisión.
            </Alert>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <TableToolbar
                        search={busqueda}
                        onSearchChange={setBusqueda}
                        searchPlaceholder="Buscar por cliente, tipo o folio..."
                        estado={filtroEstado}
                        onEstadoChange={setFiltroEstado}
                        opcionesEstado={{
                            TODOS: "Todos los estados",
                            BORRADOR: "Borrador",
                            PENDIENTE_PAGO: "Pendiente de pago",
                            ACEPTADO: "Aceptado",
                            CANCELADO: "Cancelado",
                            VENCIDO: "Vencido"
                        }}
                    />

                    {cargando ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status" />
                            <p className="text-muted mt-2 mb-0">Cargando presupuestos...</p>
                        </div>
                    ) : presupuestosVisibles.length === 0 ? (
                        <EmptyState
                            icon="bi-receipt"
                            title={presupuestos.length ? "No hay resultados" : "Aún no hay presupuestos"}
                            description={presupuestos.length
                                ? "Prueba con otro texto o estado."
                                : "Cuando emitas una cotización desde una solicitud en revisión, aparecerá aquí."}
                        />
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Cliente / Evento</th>
                                        <th>Fecha</th>
                                        <th className="text-end">Subtotal</th>
                                        <th className="text-end">Descuento</th>
                                        <th className="text-end">Total</th>
                                        <th>Estado</th>
                                        <th aria-label="Acciones" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {presupuestosVisibles.map((presupuesto) => (
                                        <tr key={presupuesto.id}>
                                            <td>
                                                <strong>#{presupuesto.id}</strong>
                                                {presupuesto.solicitudId && (
                                                    <small className="d-block text-muted">
                                                        Solicitud #{presupuesto.solicitudId}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <strong>{nombreCliente(presupuesto.cliente)}</strong>
                                                <small className="d-block text-muted">
                                                    {presupuesto.tipoEvento?.nombre ?? presupuesto.nombreTipoEvento}
                                                </small>
                                            </td>
                                            <td>{fecha(presupuesto.inicio)}</td>
                                            <td className="text-end">{moneda(presupuesto.subtotal)}</td>
                                            <td className="text-end">{moneda(presupuesto.descuento)}</td>
                                            <td className="text-end fw-semibold">{moneda(presupuesto.total)}</td>
                                            <td>
                                                <Badge bg={varianteEstado[presupuesto.estado] ?? "secondary"}>
                                                    {nombresEstado[presupuesto.estado] ?? presupuesto.estado}
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                {presupuesto.estado === "BORRADOR" && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => setPresupuestoCancelar(presupuesto)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <PresupuestoFormularioModal
                show={mostrarFormulario}
                onHide={() => setMostrarFormulario(false)}
                onGuardado={presupuestoGuardado}
                solicitudes={solicitudes}
                recursos={recursos}
                cargandoRecursos={cargandoRecursos}
                errorRecursos={errorRecursos}
            />

            <ConfirmModal
                show={Boolean(presupuestoCancelar)}
                onHide={() => !cancelando && setPresupuestoCancelar(null)}
                onConfirm={confirmarCancelacion}
                title="Cancelar presupuesto"
                confirmText="Cancelar presupuesto"
                loading={cancelando}
            >
                ¿Quieres cancelar el presupuesto #{presupuestoCancelar?.id}? Esta acción no elimina su historial.
            </ConfirmModal>
        </Container>
    );
}
