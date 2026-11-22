import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Modal, Spinner, Table } from "react-bootstrap";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { confirmarPago, enviarEncuestaPago, listarPagos, registrarPago } from "../../services/pago.service.js";

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

const etiquetaCuota = (pago) => {
    const porcentajeAnticipo = pago.presupuesto?.porcentajeAnticipo;
    if (pago.tipo === "ANTICIPO") {
        return porcentajeAnticipo == null ? "Anticipo" : `Anticipo ${Number(porcentajeAnticipo)} %`;
    }
    return porcentajeAnticipo == null ? "Saldo" : `Saldo ${100 - Number(porcentajeAnticipo)} %`;
};

const pagoNetoCompleto = (pago) => {
    const pagos = pago.presupuesto?.pagos ?? [];
    const totalNeto = pagos.reduce((suma, item) => {
        if (item.estado === "PAGADO") return suma + Number(item.monto ?? 0);
        if (item.estado === "REEMBOLSADO") return suma - Number(item.monto ?? 0);
        return suma;
    }, 0);
    return totalNeto >= Number(pago.presupuesto?.total ?? Infinity);
};

const contextoPago = (pago) => {
    const presupuesto = pago.presupuesto;
    const tipoEvento = presupuesto?.nombreTipoEvento ?? "Evento";
    const cliente = presupuesto?.cliente?.empresa?.razonSocial ||
        [presupuesto?.cliente?.persona?.nombres, presupuesto?.cliente?.persona?.apellidos].filter(Boolean).join(" ") ||
        presupuesto?.cliente?.usuario?.email || "Cliente";
    const inicio = presupuesto?.evento?.inicio ?? presupuesto?.inicio;
    const fechaEvento = inicio ? new Date(inicio).toLocaleDateString("es-CL") : "Sin evento formalizado";
    return `${tipoEvento} · ${cliente} · ${fechaEvento}`;
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
    const [tipo, setTipo] = useState("TODOS");
    const [soloAlertas, setSoloAlertas] = useState(false);
    const [procesando, setProcesando] = useState("");
    const [exito, setExito] = useState("");
    const [ahora, setAhora] = useState(() => Date.now());
    const [confirmacion, setConfirmacion] = useState(null);
    const [referencia, setReferencia] = useState("");

    const cargarPagos = useCallback(async () => {
        try {
            const resultado = await listarPagos({ estado, tipo });
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
    }, [estado, tipo]);

    useEffect(() => {
        let vigente = true;
        listarPagos({ estado, tipo })
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
    }, [estado, tipo]);

    useEffect(() => {
        const timer = window.setInterval(() => setAhora(Date.now()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    const diasEntre = (desde, hasta) => Math.ceil((new Date(hasta).setHours(0, 0, 0, 0) - new Date(desde).setHours(0, 0, 0, 0)) / 86400000);
    const alertasPago = useCallback((pago) => {
        const alertas = [];
        const reglas = pago.reglasAlertas ?? { diasCompromiso: 3, diasEvento: 7 };
        if (pago.estado !== "PAGADO" && pago.fechaVencimiento) {
            const dias = diasEntre(ahora, pago.fechaVencimiento);
            if (dias < 0) alertas.push({ tipo: "danger", texto: `Plazo vencido hace ${Math.abs(dias)} día(s)` });
            else if (dias <= reglas.diasCompromiso) alertas.push({ tipo: "warning", texto: dias === 0 ? "Plazo vence hoy" : `Plazo vence en ${dias} día(s)` });
        }
        const inicioEvento = pago.presupuesto?.evento?.inicio ?? pago.presupuesto?.inicio;
        if (pago.estado !== "PAGADO" && inicioEvento) {
            const dias = diasEntre(ahora, inicioEvento);
            if (dias >= 0 && dias <= reglas.diasEvento) alertas.push({ tipo: "info", texto: dias === 0 ? "Evento hoy" : `Evento en ${dias} día(s)` });
        }
        return alertas;
    }, [ahora]);

    const ejecutarAccion = async (clave, accion, mensaje) => {
        setProcesando(clave); setError(""); setExito("");
        try { await accion(); await cargarPagos(); setExito(mensaje); }
        catch (err) { setError(mensajeError(err)); }
        finally { setProcesando(""); }
    };

    const reintentarCarga = () => {
        setCargando(true);
        setError("");
        cargarPagos();
    };

    const pagosVisibles = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase("es-CL");
        return pagos.filter((pago) => {
            const coincideEstado = estado === "TODOS" || pago.estado === estado;
            const coincideAlerta = !soloAlertas || alertasPago(pago).length > 0;
            const texto = [
                pago.tipo,
                pago.referencia,
                contextoPago(pago)
            ].join(" ").toLocaleLowerCase("es-CL");
            return coincideEstado && coincideAlerta && (!termino || texto.includes(termino));
        });
    }, [pagos, busqueda, estado, soloAlertas, alertasPago]);

    return (
        <Container className="py-4">
            <PageHeader
                title="Historial de pagos"
                description="Consulta los pagos asociados a presupuestos, eventos y solicitudes."
            />

            <Alert variant="info">Los compromisos nacen al aceptar un presupuesto. Registrar una cuota crea un pendiente; solo ADMIN puede confirmar la recepción. No se procesa una pasarela de pago.</Alert>

            {error && (
                <Alert variant="danger">
                    {error}{" "}
                    <Button variant="link" className="p-0" onClick={reintentarCarga}>
                        Reintentar
                    </Button>
                </Alert>
            )}
            {exito && <Alert variant="success" dismissible onClose={() => setExito("")}>{exito}</Alert>}

            <Card className="shadow-sm">
                <Card.Body>
                    <div className="d-flex flex-column flex-md-row gap-3 mb-3">
                        <Form.Group className="flex-grow-1">
                            <Form.Label className="visually-hidden">Buscar pagos</Form.Label>
                            <Form.Control
                                type="search"
                                placeholder="Buscar por cliente, evento o tipo de cuota"
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                            />
                        </Form.Group>
                        <Form.Group style={{ minWidth: "11rem" }}>
                            <Form.Label className="visually-hidden">Filtrar por cuota</Form.Label>
                            <Form.Select aria-label="Filtrar por cuota" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                                <option value="TODOS">Todas las cuotas</option>
                                <option value="ANTICIPO">Anticipo</option>
                                <option value="SALDO">Saldo</option>
                            </Form.Select>
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
                        <Form.Check type="switch" id="solo-alertas-pago" label="Solo alertas" checked={soloAlertas} onChange={(event) => setSoloAlertas(event.target.checked)} className="align-self-center text-nowrap" />
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
                                        <th scope="col">Cuota</th>
                                        <th scope="col">Fecha</th>
                                        <th scope="col">Monto</th>
                                        <th scope="col">Estado</th>
                                        <th scope="col">Cliente / evento</th>
                                        <th scope="col">Confirmado por</th>
                                        <th scope="col">Encuesta</th>
                                        <th scope="col">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                        {pagosVisibles.map((pago) => {
                                            const fechaFin = pago.fechaFinEvento ? new Date(pago.fechaFinEvento) : null;
                                            const finValido = fechaFin && Number.isFinite(fechaFin.getTime());
                                            const saldoPendiente = pago.tipo === "SALDO" && pago.estado === "PENDIENTE";
                                            const anticipoPendiente = saldoPendiente && !pago.anticipoPagado;
                                            const eventoNoFinalizado = saldoPendiente && pago.anticipoPagado && finValido && ahora < fechaFin.getTime();
                                            const finNoDisponible = saldoPendiente && pago.anticipoPagado && !finValido;
                                            const anticipoVencido = pago.tipo === "ANTICIPO" && pago.estado === "PENDIENTE" && pago.fechaVencimiento && ahora > new Date(pago.fechaVencimiento).getTime();
                                            const bloqueaConfirmacionSaldo = anticipoPendiente || eventoNoFinalizado || finNoDisponible;
                                            return (
                                        <tr key={pago.id}>
                                            <td className="fw-semibold">{etiquetaCuota(pago)}</td>
                                            <td>
                                                {pago.fechaPago ? formatearFecha(pago.fechaPago) : pago.fechaVencimiento ? `Vence ${formatearFecha(pago.fechaVencimiento)}` : formatearFecha(pago.createdAt)}
                                                {anticipoVencido && <Badge bg="danger" className="d-block mt-1 text-start">Vencido</Badge>}
                                                {anticipoVencido && <small className="d-block text-danger mt-1">Plazo de 14 días vencido · Evento sujeto a cancelación por falta de abono</small>}
                                                {alertasPago(pago).map((alerta, indice) => <Badge key={indice} bg={alerta.tipo} className="d-block mt-1 text-start">{alerta.texto}</Badge>)}
                                                {anticipoPendiente && <small className="d-block text-warning mt-1">Pendiente de pago de anticipo</small>}
                                                {eventoNoFinalizado && <small className="d-block text-muted mt-1">Se habilita al finalizar el evento</small>}
                                                {finNoDisponible && <small className="d-block text-danger mt-1">No se puede determinar la fecha de término del evento ni del presupuesto; no es posible confirmar el saldo.</small>}
                                                {saldoPendiente && pago.anticipoPagado && finValido && ahora >= fechaFin.getTime() && <small className="d-block text-success mt-1">Disponible para confirmar saldo</small>}
                                            </td>
                                            <td className="text-nowrap">{formatearMonto(pago.monto)}</td>
                                            <td>
                                                <Badge bg={coloresEstado[pago.estado] ?? "secondary"}>
                                                    {etiquetasEstado[pago.estado] ?? pago.estado}
                                                </Badge>
                                            </td>
                                            <td>{contextoPago(pago)}</td>
                                            <td>{pago.confirmadoPor?.email ?? (pago.estado === "PAGADO" ? "Sin confirmador registrado" : "—")}</td>
                                            <td>
                                                {pago.encuesta ? <><Badge bg={pago.encuesta.estado === "ENVIADO" ? "success" : pago.encuesta.estado === "FALLIDO" ? "danger" : "secondary"}>{pago.encuesta.estado.replaceAll("_", " ")}</Badge>{pago.encuesta.motivo && <small className="d-block text-muted">{pago.encuesta.motivo}</small>}</> : "—"}
                                            </td>
                                            <td><div className="d-flex flex-column gap-1">
                                                {pago.esObligacion && <Button size="sm" variant="outline-primary" disabled={Boolean(procesando)} onClick={() => ejecutarAccion(`crear-${pago.id}`, () => registrarPago(pago.presupuestoId, pago.tipo), "Cuota registrada como pendiente.")}>{procesando === `crear-${pago.id}` ? <Spinner size="sm" /> : "Registrar cuota"}</Button>}
                                                {!pago.esObligacion && pago.estado === "PENDIENTE" && <Button size="sm" variant="success" disabled={Boolean(procesando) || bloqueaConfirmacionSaldo} onClick={() => { setConfirmacion(pago); setReferencia(""); }}>Confirmar pago</Button>}
                                                {!pago.esObligacion && pago.tipo === "SALDO" && pago.estado === "PAGADO" && pagoNetoCompleto(pago) && pago.presupuesto?.evento?.estado === "COMPLETADO" && !["ENVIADO", "SIMULADO", "ENVIANDO"].includes(pago.encuesta?.estado) && <Button size="sm" variant="outline-secondary" disabled={Boolean(procesando)} onClick={() => ejecutarAccion(`encuesta-${pago.id}`, () => enviarEncuestaPago(pago.id), "Estado del envío de encuesta actualizado.")}>{procesando === `encuesta-${pago.id}` ? <Spinner size="sm" /> : pago.encuesta?.estado === "FALLIDO" ? "Reintentar encuesta" : "Enviar encuesta"}</Button>}
                                            </div></td>
                                        </tr>
                                            );
                                        })}
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
            <Modal show={Boolean(confirmacion)} onHide={() => setConfirmacion(null)} centered>
                <Modal.Header closeButton><Modal.Title>Confirmar pago recibido</Modal.Title></Modal.Header>
                <Modal.Body>
                    {confirmacion && <>
                        <p>¿Confirmas la recepción de <strong>{formatearMonto(confirmacion.monto)}</strong> para {contextoPago(confirmacion)}?</p>
                        <Form.Label htmlFor="referencia-pago">Referencia (opcional)</Form.Label>
                        <Form.Control id="referencia-pago" maxLength={255} placeholder="Ej.: N.º de transferencia, comprobante o pago en efectivo" value={referencia} onChange={(event) => setReferencia(event.target.value)} />
                    </>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmacion(null)}>Volver</Button>
                    <Button variant="success" disabled={Boolean(procesando)} onClick={async () => {
                        await ejecutarAccion(`confirmar-${confirmacion.id}`, () => confirmarPago(confirmacion.id, referencia.trim() || undefined), "Pago confirmado correctamente.");
                        setConfirmacion(null);
                    }}>{procesando ? <Spinner size="sm" /> : "Confirmar"}</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
