import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { mensajeError } from "../eventos/seguimiento.utils";
import { getEspacios } from "../../services/espacio.service";
import { getTiposEvento } from "../../services/tipoEvento.service";
import {
    actualizarPresupuesto,
    crearPresupuesto,
    consultarFrecuenciaCliente
} from "../../services/presupuesto.service";

const MAX_ASISTENTES = 1000000;
const MAX_DESCUENTO = 9999999999.99;
const redondearMoneda = (valor) =>
    Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

const fechaLocal = (valor) => {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

const formularioInicial = {
    solicitudId: "",
    tipoEventoId: "",
    inicio: "",
    fin: "",
    lugar: "",
    espacioId: "",
    asistentes: 0,
    descuento: "",
    recursos: []
};

const formularioDePresupuesto = (presupuesto) => presupuesto ? {
    solicitudId: String(presupuesto.solicitudId ?? ""),
    tipoEventoId: String(presupuesto.tipoEventoId ?? presupuesto.tipoEvento?.id ?? ""),
    inicio: fechaLocal(presupuesto.inicio),
    fin: fechaLocal(presupuesto.fin),
    lugar: presupuesto.lugar ?? "",
    espacioId: presupuesto.espacioId ? String(presupuesto.espacioId) : "",
    asistentes: Number(presupuesto.asistentes ?? 1),
    descuento: String(presupuesto.descuento ?? 0),
    recursos: (presupuesto.recursos ?? []).map((item) => ({
        recursoId: String(item.recursoId), cantidad: item.cantidad
    }))
} : { ...formularioInicial, recursos: [] };

const nombreClienteSolicitud = (solicitud) =>
    solicitud?.cliente?.empresa?.razonSocial ||
    [solicitud?.cliente?.persona?.nombres, solicitud?.cliente?.persona?.apellidos].filter(Boolean).join(" ") ||
    solicitud?.cliente?.usuario?.email || "Cliente";

export default function PresupuestoFormularioModal({
    show,
    onHide,
    onGuardado,
    presupuesto = null,
    modoConsulta = false,
    esAdmin = false,
    solicitudes,
    recursos,
    cargandoRecursos,
    errorRecursos
}) {
    const [form, setForm] = useState(() => formularioDePresupuesto(presupuesto));
    const [espacios, setEspacios] = useState([]);
    const [cargandoEspacios, setCargandoEspacios] = useState(true);
    const [error, setError] = useState("");
    const [tiposEvento, setTiposEvento] = useState([]);
    const [cargandoTiposEvento, setCargandoTiposEvento] = useState(true);
    const [frecuenciaCliente, setFrecuenciaCliente] = useState(null);
    const [errorFrecuencia, setErrorFrecuencia] = useState(null);
    useEffect(() => {
        let activo = true;
        getEspacios().then((datos) => { if (activo) setEspacios(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar los espacios.")); })
            .finally(() => { if (activo) setCargandoEspacios(false); });
        return () => { activo = false; };
    }, []);
    useEffect(() => {
        if (!show) return undefined;
        let activo = true;
        getTiposEvento(false)
            .then((datos) => {
                if (activo) setTiposEvento(Array.isArray(datos) ? datos : []);
            })
            .catch((err) => {
                if (activo) setError(mensajeError(err, "No fue posible cargar los tipos de evento activos."));
            })
            .finally(() => { if (activo) setCargandoTiposEvento(false); });
        return () => { activo = false; };
    }, [show]);
    const [saving, setSaving] = useState(false);
    const [validated, setValidated] = useState(false);
    const editable = esAdmin && !modoConsulta && (!presupuesto || presupuesto.estado === "BORRADOR");

    const solicitudSeleccionada = useMemo(() => {
        if (presupuesto) {
            return {
                ...(presupuesto.solicitud ?? {}),
                id: presupuesto.solicitudId ?? presupuesto.solicitud?.id ?? "",
                cliente: presupuesto.cliente ?? presupuesto.solicitud?.cliente,
                tipoEvento: presupuesto.tipoEvento,
                inicio: presupuesto.inicio,
                fin: presupuesto.fin,
                lugar: presupuesto.lugar,
                asistentes: presupuesto.asistentes
            };
        }
        return solicitudes.find((solicitud) => String(solicitud.id) === form.solicitudId);
    }, [presupuesto, solicitudes, form.solicitudId]);
    const tipoEventoSolicitudId = String(
        solicitudSeleccionada?.tipoEventoId ??
        solicitudSeleccionada?.tipoEvento?.id ??
        presupuesto?.tipoEventoId ?? ""
    );
    const tipoEventoCatalogo = tiposEvento.find(
        (tipo) => String(tipo.id) === tipoEventoSolicitudId && tipo.activo
    );
    const tipoEventoHistorico = presupuesto?.tipoEvento &&
        String(presupuesto.tipoEvento.id) === tipoEventoSolicitudId
        ? presupuesto.tipoEvento
        : null;
    const tipoEventoSeleccionado = tipoEventoCatalogo ?? tipoEventoHistorico ?? solicitudSeleccionada?.tipoEvento;
    const tipoEventoOpciones = tipoEventoCatalogo
        ? [tipoEventoCatalogo]
        : tipoEventoHistorico
            ? [{ ...tipoEventoHistorico, activo: false }]
            : [];
    const frecuenciaActual = frecuenciaCliente?.solicitudId === String(solicitudSeleccionada?.id)
        ? frecuenciaCliente
        : null;
    const errorFrecuenciaActual = errorFrecuencia?.solicitudId === String(solicitudSeleccionada?.id)
        ? errorFrecuencia.mensaje
        : "";
    const cargandoFrecuencia = Boolean(solicitudSeleccionada?.id) && !frecuenciaActual && !errorFrecuenciaActual;
    useEffect(() => {
        let activo = true;
        const solicitudId = solicitudSeleccionada?.id;
        if (!show || !solicitudId) return undefined;
        consultarFrecuenciaCliente(solicitudId)
            .then((resultado) => { if (activo) setFrecuenciaCliente({ ...resultado, solicitudId: String(solicitudId) }); })
            .catch((err) => {
                if (activo) {
                    setErrorFrecuencia({
                        solicitudId: String(solicitudId),
                        mensaje: mensajeError(err, "No se pudo verificar la frecuencia del cliente.")
                    });
                }
            });
        return () => { activo = false; };
    }, [show, solicitudSeleccionada?.id]);
    const tieneDescuentoHistorico = Boolean(presupuesto && Number(presupuesto.descuento ?? 0) > 0);
    const mostrarDescuento = frecuenciaActual?.esFrecuente === true || tieneDescuentoHistorico;
    const puedeEditarDescuento = editable && frecuenciaActual?.esFrecuente === true;
    const recargoCliente = redondearMoneda(presupuesto?.recargoCliente ?? 0);
    const recursosFormulario = useMemo(() => {
        const catalogo = new Map(recursos.map((recurso) => [recurso.id, recurso]));
        for (const snapshot of presupuesto?.recursos ?? []) {
            const id = snapshot.recursoId;
            catalogo.set(id, {
                ...(catalogo.get(id) ?? snapshot.recurso ?? {}),
                id,
                nombre: snapshot.nombreRecurso,
                tipo: snapshot.tipoRecurso,
                precioUnitario: snapshot.precioUnitario,
                activo: snapshot.recurso?.activo ?? catalogo.get(id)?.activo ?? false,
                esSnapshot: true
            });
        }
        return [...catalogo.values()];
    }, [recursos, presupuesto]);
    const recursosDisponibles = recursos.filter(
        (recurso) => recurso.activo && !form.recursos.some(
            (item) => Number(item.recursoId) === recurso.id
        )
    );
    const totalEstimado = useMemo(() => {
        const tipoEvento = tipoEventoSeleccionado;
        const inicio = new Date(form.inicio);
        const fin = new Date(form.fin);
        let costoBase = 0;
        if (presupuesto) {
            if (
                presupuesto.modalidadPrecioTipoEvento === "POR_HORA" &&
                presupuesto.tarifaHoraTipoEvento != null
            ) {
                costoBase = Number(presupuesto.tarifaHoraTipoEvento) *
                    ((fin.getTime() - inicio.getTime()) / 3600000);
            } else {
                costoBase = Number(presupuesto.precioBaseTipoEvento ?? 0);
            }
        } else if (tipoEvento?.modalidadPrecio === "FIJO") {
            costoBase = Number(tipoEvento.precioBase ?? 0);
        } else if (
            tipoEvento?.modalidadPrecio === "POR_HORA" &&
            Number.isFinite(inicio.getTime()) &&
            Number.isFinite(fin.getTime()) &&
            fin > inicio
        ) {
            costoBase = Number(tipoEvento.tarifaHora ?? 0) *
                ((fin.getTime() - inicio.getTime()) / 3600000);
        }
        const subtotalRecursos = form.recursos.reduce((total, item) => {
            const snapshot = presupuesto?.recursos?.find(
                (recurso) => recurso.recursoId === Number(item.recursoId)
            );
            const recurso = snapshot ?? recursos.find(
                (opcion) => opcion.id === Number(item.recursoId)
            );
            const precio = Number(recurso?.precioUnitario ?? 0);
            const cantidad = Number(item.cantidad ?? 0);
            return redondearMoneda(total + redondearMoneda(precio * cantidad));
        }, 0);

        const subtotal = redondearMoneda(redondearMoneda(costoBase) + subtotalRecursos);
        const descuento = redondearMoneda(Number(form.descuento) || 0);
        return redondearMoneda(subtotal - descuento + recargoCliente);
    }, [form.inicio, form.fin, form.recursos, form.descuento, recursos, tipoEventoSeleccionado, presupuesto, recargoCliente]);
    const formatoMoneda = useMemo(
        () => new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 2
        }),
        []
    );

    function seleccionarSolicitud(event) {
        const solicitudId = event.target.value;
        const solicitud = solicitudes.find((item) => String(item.id) === solicitudId);
        const asistentes = Number(solicitud?.asistentes ?? 0);

        setForm({
            ...formularioInicial,
            solicitudId,
            tipoEventoId: String(solicitud?.tipoEventoId ?? solicitud?.tipoEvento?.id ?? ""),
            inicio: fechaLocal(solicitud?.inicio),
            fin: fechaLocal(solicitud?.fin),
            lugar: solicitud?.lugar ?? "",
            asistentes
        });
        setError("");
    }

    function cambiarCampo(event) {
        const { name, value } = event.target;
        setForm((actual) => ({ ...actual, [name]: value }));
    }

    function cambiarDescuento(event) {
        const { value } = event.target;
        const descuento = value === "" ? "" : String(Math.max(0, Number(value) || 0));
        setForm((actual) => ({ ...actual, descuento }));
    }

    function agregarRecurso() {
        if (!recursosDisponibles.length) return;
        setForm((actual) => ({
            ...actual,
            recursos: [
                ...actual.recursos,
                { recursoId: String(recursosDisponibles[0].id), cantidad: 1 }
            ]
        }));
    }

    function cambiarRecurso(indice, campo, valor) {
        setForm((actual) => ({
            ...actual,
            recursos: actual.recursos.map((item, i) =>
                i === indice ? { ...item, [campo]: valor } : item
            )
        }));
    }

    function cambiarCantidadRecurso(indice, valor) {
        const cantidad = valor === "" ? "" : String(Math.max(0, Number(valor) || 0));
        cambiarRecurso(indice, "cantidad", cantidad);
    }

    function quitarRecurso(indice) {
        setForm((actual) => ({
            ...actual,
            recursos: actual.recursos.filter((_, i) => i !== indice)
        }));
    }

    async function guardar(event) {
        event.preventDefault();
        if (!editable) return;
        setValidated(true);
        setError("");

        const formularioValido = event.currentTarget.checkValidity();
        const descuentoValido = form.descuento === "" ||
            (/^\d{1,10}(?:\.\d{1,2})?$/.test(form.descuento) && Number(form.descuento) <= MAX_DESCUENTO);
        const descuentoActual = Number(presupuesto?.descuento ?? 0);
        const descuentoEnviado = form.descuento === "" ? 0 : Number(form.descuento);
        const conservaDescuentoHistorico = Boolean(
            presupuesto && descuentoEnviado === descuentoActual
        );
        const descuentoFrecuenciaValida = descuentoEnviado <= 0 ||
            frecuenciaActual?.esFrecuente === true || conservaDescuentoHistorico;
        const tipoEventoValido = Boolean(
            solicitudSeleccionada &&
            form.tipoEventoId === tipoEventoSolicitudId &&
            tipoEventoOpciones.some((tipo) => String(tipo.id) === form.tipoEventoId) &&
            (presupuesto || tipoEventoCatalogo?.activo)
        );
        const cantidadesValidas = form.recursos.every((item) =>
            (() => {
                const cantidad = Number(item.cantidad);
                const snapshot = presupuesto?.recursos?.find((recurso) => recurso.recursoId === Number(item.recursoId));
                const conservaExcesoHistorico = snapshot &&
                    cantidad === Number(snapshot.cantidad) && cantidad > Number(form.asistentes);
                return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= 100000 &&
                    (cantidad <= Number(form.asistentes) || conservaExcesoHistorico);
            })()
        );
        const fechasValidas =
            new Date(form.fin) > new Date(form.inicio) &&
            new Date(form.inicio) > new Date();
        const asistentesValidos = Number.isInteger(Number(form.asistentes)) &&
            Number(form.asistentes) > 0 && Number(form.asistentes) <= MAX_ASISTENTES;

        if (!formularioValido || !asistentesValidos || !descuentoValido || !descuentoFrecuenciaValida || !tipoEventoValido || !cantidadesValidas || !fechasValidas || saving) {
            if (!fechasValidas) {
                setError("El inicio debe ser futuro y el término posterior al inicio.");
            } else if (!descuentoValido || Number(form.descuento) > MAX_DESCUENTO) {
                setError("Ingresa un descuento válido, con máximo dos decimales.");
            } else if (!descuentoFrecuenciaValida) {
                setError("El descuento solo está disponible para clientes frecuentes.");
            } else if (!tipoEventoValido) {
                setError("El tipo de evento debe coincidir con el tipo activo de la solicitud.");
            } else if (!asistentesValidos) {
                setError("La Solicitud o el presupuesto no tiene una cantidad válida de asistentes.");
            } else if (!cantidadesValidas) {
                setError(`Cada recurso debe tener una cantidad entera entre 1 y ${form.asistentes} asistentes.`);
            }
            return;
        }

        setSaving(true);
        try {
            // El total no se envía: el backend lo recalcula con Decimal y conserva el recargo del snapshot al editar.
            const payload = {
                inicio: new Date(form.inicio).toISOString(),
                fin: new Date(form.fin).toISOString(),
                espacioId: Number(form.espacioId),
                asistentes: Number(form.asistentes),
                descuento: form.descuento === ""
                    ? (presupuesto ? null : 0)
                    : Number(form.descuento),
                recursos: form.recursos.map((item) => ({
                    recursoId: Number(item.recursoId),
                    cantidad: Number(item.cantidad)
                }))
            };
            const guardado = presupuesto
                ? await actualizarPresupuesto(presupuesto.id, { ...payload, version: presupuesto.version })
                : await crearPresupuesto({
                    ...payload,
                    solicitudId: Number(form.solicitudId)
                });
            onGuardado(guardado);
        } catch (err) {
            setError(mensajeError(
                err,
                presupuesto
                    ? "No fue posible actualizar la cotización."
                    : "No fue posible crear el presupuesto."
            ));
        } finally {
            setSaving(false);
        }
    }

    const nombreCliente = solicitudSeleccionada?.cliente?.empresa?.razonSocial ||
        [solicitudSeleccionada?.cliente?.persona?.nombres,
            solicitudSeleccionada?.cliente?.persona?.apellidos]
            .filter(Boolean)
            .join(" ") || "Cliente";

    return (
        <Modal
            show={show}
            onHide={() => !saving && onHide()}
            centered
            size="lg"
            scrollable
            backdrop="static"
        >
            <Form noValidate validated={validated} onSubmit={guardar}
                className="d-flex flex-column overflow-hidden" style={{ maxHeight: "calc(100dvh - 3.5rem)" }}>
                <Modal.Header closeButton={!saving}>
                <Modal.Title>{modoConsulta ? "Detalle de cotización" : presupuesto ? "Editar cotización" : "Nueva cotización"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="overflow-auto p-3" style={{ minHeight: 0 }}>
                    <fieldset disabled={!editable || saving} className="border-0 p-0 m-0">
                    {error && <Alert variant="danger">{error}</Alert>}
                    {presupuesto ? (
                        <Alert variant="light" className="border mb-3">
                            {modoConsulta ? "Revisando una cotización ya procesada." : "Editando una cotización en borrador."}
                        </Alert>
                    ) : (
                        <Form.Group controlId="presupuesto-solicitud" className="mb-3">
                            <Form.Label>Solicitud en revisión *</Form.Label>
                            <Form.Select
                                required
                                value={form.solicitudId}
                                onChange={seleccionarSolicitud}
                                disabled={saving}
                            >
                                <option value="">Selecciona una solicitud</option>
                                {solicitudes.map((solicitud) => (
                                    <option key={solicitud.id} value={solicitud.id}>
                                        {solicitud.tipoEvento?.nombre ?? "Evento"} · {nombreClienteSolicitud(solicitud)} · {fechaLocal(solicitud.inicio).replace("T", " ")} · {solicitud.estado}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-body-secondary">
                                Solo se pueden emitir cotizaciones desde solicitudes en estado EN_REVISION.
                            </Form.Text>
                        </Form.Group>
                    )}

                    {solicitudSeleccionada && (
                        <>
                            <Alert variant="light" className="border">
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                    <div>
                                        <strong>{nombreCliente}</strong>
                                        <span className="d-block text-body-secondary">{solicitudSeleccionada.tipoEvento?.nombre}</span>
                                    </div>
                                    <Badge bg="secondary" className="fs-6 fw-normal">
                                        {form.asistentes || "Sin cantidad informada"} asistentes
                                    </Badge>
                                </div>
                            </Alert>

                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group controlId="presupuesto-inicio">
                                        <Form.Label>Inicio *</Form.Label>
                                        <Form.Control
                                            required
                                            type="datetime-local"
                                            name="inicio"
                                            value={form.inicio}
                                            onChange={cambiarCampo}
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="presupuesto-fin">
                                        <Form.Label>Término *</Form.Label>
                                        <Form.Control
                                            required
                                            type="datetime-local"
                                            name="fin"
                                            value={form.fin}
                                            onChange={cambiarCampo}
                                            isInvalid={validated && Boolean(form.inicio && form.fin) && new Date(form.fin) <= new Date(form.inicio)}
                                            disabled={saving}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            El término debe ser posterior al inicio.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group controlId="presupuesto-espacio" className="mt-3">
                                <Form.Label>Espacio registrado *</Form.Label>
                                <Form.Select
                                    required
                                    name="espacioId"
                                    value={form.espacioId}
                                    onChange={cambiarCampo}
                                    disabled={saving || cargandoEspacios}
                                >
                                    <option value="">Selecciona un espacio de Recursos</option>
                                    {espacios.filter((e) => e.habilitado).map((e) => <option key={e.id} value={e.id}>
                                        {e.nombre} · {e.capacidad} personas · {e.comuna ?? "Comuna pendiente"}
                                    </option>)}
                                </Form.Select>
                                <Form.Text>Los espacios se crean y mantienen en Recursos → Espacios. El lugar preferido de la solicitud es solo un antecedente.</Form.Text>
                                <a className="d-block small mt-1" href="/admin/recursos" target="_blank" rel="noreferrer">Administrar espacios</a>
                            </Form.Group>

                            <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                                <div>
                                    <h3 className="h6 mb-0">Recursos adicionales</h3>
                                    <small className="text-body-secondary">Selecciona recursos del catálogo y sus cantidades.</small>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={agregarRecurso}
                                    disabled={saving || cargandoRecursos || !recursosDisponibles.length}
                                >
                                    <i className="bi bi-plus-lg me-1" /> Añadir recurso
                                </Button>
                            </div>

                            {cargandoRecursos && <div className="text-body-secondary py-2"><Spinner size="sm" className="me-2" />Cargando catálogo...</div>}
                            {errorRecursos && <Alert variant="warning" className="py-2">{errorRecursos}</Alert>}
                            {form.recursos.map((item, indice) => (
                                <Row className="g-2 align-items-end mb-2" key={`${indice}-${item.recursoId}`}>
                                    <Col md={8}>
                                        <Form.Group controlId={`presupuesto-recurso-${indice}`}>
                                            <Form.Label>Recurso</Form.Label>
                                            <Form.Select
                                                required
                                                value={item.recursoId}
                                                onChange={(event) => cambiarRecurso(indice, "recursoId", event.target.value)}
                                                disabled={saving}
                                            >
                                                {recursosFormulario
                                                    .filter((recurso) => (recurso.activo || recurso.id === Number(item.recursoId)) && (
                                                        recurso.id === Number(item.recursoId) ||
                                                        !form.recursos.some((otro, otroIndice) =>
                                                            otroIndice !== indice && Number(otro.recursoId) === recurso.id
                                                        )
                                                    ))
                                                    .map((recurso) => (
                                                        <option key={recurso.id} value={recurso.id}>
                                                            {recurso.nombre} · ${Number(recurso.precioUnitario).toLocaleString("es-CL")}{recurso.esSnapshot ? " (precio cotizado)" : ""}
                                                        </option>
                                                    ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group controlId={`presupuesto-cantidad-recurso-${indice}`}>
                                            <Form.Label>Cantidad</Form.Label>
                                            {presupuesto?.recursos?.some((recurso) =>
                                                recurso.recursoId === Number(item.recursoId) &&
                                                Number(recurso.cantidad) > Number(form.asistentes) &&
                                                Number(item.cantidad) === Number(recurso.cantidad)
                                            ) ? (
                                                <Form.Control plaintext readOnly value={item.cantidad} aria-label="Cantidad histórica de recurso" />
                                            ) : (
                                                <Form.Control
                                                    required
                                                    type="number"
                                                    min={1}
                                                    max={Number(form.asistentes)}
                                                    step={1}
                                                    value={item.cantidad}
                                                    onChange={(event) => cambiarCantidadRecurso(indice, event.target.value)}
                                                    isInvalid={validated && (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1 || Number(item.cantidad) > Number(form.asistentes) || Number(item.cantidad) > 100000)}
                                                    disabled={saving}
                                                />
                                            )}
                                            {Number(item.cantidad) > Number(form.asistentes) ? (
                                                <Form.Text className="text-warning">Cantidad histórica superior a los asistentes; se conserva sin cambios.</Form.Text>
                                            ) : (
                                                <Form.Control.Feedback type="invalid">
                                                    Usa una cantidad entera entre 1 y {form.asistentes} asistentes.
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={1}>
                                        <Button
                                            type="button"
                                            variant="outline-danger"
                                            aria-label="Quitar recurso"
                                            onClick={() => quitarRecurso(indice)}
                                            disabled={saving}
                                        >
                                            <i className="bi bi-trash" />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            {!cargandoRecursos && !errorRecursos && !recursos.length && (
                                <p className="small text-body-secondary">No hay recursos activos en el catálogo.</p>
                            )}

                            <Form.Group controlId="presupuesto-tipo-evento-precio" className="mt-4">
                                <Form.Label>Tipo de evento y precio base *</Form.Label>
                                <Form.Select
                                    required
                                    value={form.tipoEventoId}
                                    onChange={(event) => setForm((actual) => ({
                                        ...actual,
                                        tipoEventoId: event.target.value
                                    }))}
                                    disabled={saving || cargandoTiposEvento || !solicitudSeleccionada}
                                >
                                    <option value="">Selecciona una solicitud para cargar su tipo de evento</option>
                                    {tipoEventoOpciones.map((tipo) => {
                                        const modalidad = tipo.modalidadPrecio ?? presupuesto?.modalidadPrecioTipoEvento;
                                        const tarifa = presupuesto?.precioBaseAcordado != null
                                            ? `Precio pactado histórico ${formatoMoneda.format(Number(presupuesto.precioBaseAcordado))}`
                                            : modalidad === "POR_HORA"
                                                ? `Tarifa ${formatoMoneda.format(Number(presupuesto?.tarifaHoraTipoEvento ?? tipo.tarifaHora ?? 0))}/hora`
                                                : `Precio fijo ${formatoMoneda.format(Number(presupuesto?.precioBaseCatalogo ?? tipo.precioBase ?? presupuesto?.precioBaseTipoEvento ?? 0))}`;
                                        return (
                                            <option key={tipo.id} value={String(tipo.id)}>
                                                {tipo.nombre} · {modalidad} · {tarifa}{tipo.activo ? "" : " · snapshot histórico"}
                                            </option>
                                        );
                                    })}
                                </Form.Select>
                                <Form.Text className="text-body-secondary">
                                    El tipo debe coincidir con la Solicitud. El precio se calcula en el servidor desde el catálogo y se conserva como snapshot en la cotización.
                                </Form.Text>
                            </Form.Group>
                            {cargandoFrecuencia && <p className="small text-body-secondary mt-3 mb-0">Verificando historial del cliente…</p>}
                            {errorFrecuenciaActual && <Alert variant="warning" className="mt-3 mb-0">{errorFrecuenciaActual} El servidor volverá a validar cualquier descuento al guardar.</Alert>}
                            {!cargandoFrecuencia && frecuenciaActual && (
                                <Alert variant={frecuenciaActual.esFrecuente ? "success" : "secondary"} className="mt-3 mb-0">
                                    Cliente {frecuenciaActual.esFrecuente ? "frecuente" : "no frecuente"}: {frecuenciaActual.eventosCompletados} de {frecuenciaActual.minimoEventos} eventos completados.
                                </Alert>
                            )}
                            {mostrarDescuento ? (
                                <Form.Group controlId="presupuesto-descuento" className="mt-4">
                                    <Form.Label>Descuento</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="descuento"
                                        min={0}
                                        max={MAX_DESCUENTO}
                                        step="0.01"
                                        value={form.descuento}
                                        onChange={cambiarDescuento}
                                        readOnly={!puedeEditarDescuento}
                                        isInvalid={validated && form.descuento !== "" && (!/^\d{1,10}(?:\.\d{1,2})?$/.test(form.descuento) || Number(form.descuento) > MAX_DESCUENTO)}
                                        disabled={saving || (editable && cargandoFrecuencia)}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Usa un monto válido con máximo dos decimales.
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-body-secondary">
                                        {puedeEditarDescuento
                                            ? "Beneficio disponible para este cliente frecuente."
                                            : tieneDescuentoHistorico
                                                ? "Descuento histórico de solo lectura; se conserva al guardar."
                                                : "Descuento visible en modo consulta."}
                                    </Form.Text>
                                </Form.Group>
                            ) : null}
                        </>
                    )}
                    </fieldset>
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column align-items-stretch gap-2">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 w-100">
                        <span className="fw-semibold">Total estimado sin arriendo</span>
                        <strong className="fs-5">{formatoMoneda.format(totalEstimado)}</strong>
                    </div>
                    <small className="text-body-secondary w-100">
                        Incluye recursos, descuento y recargo ({formatoMoneda.format(recargoCliente)}).
                        El arriendo y el total final se revisan antes de enviar.
                    </small>
                    <div className="d-flex justify-content-end gap-2 w-100">
                        <Button variant="secondary" onClick={onHide} disabled={saving}>
                            Cerrar
                        </Button>
                        {!editable ? <span className="small text-body-secondary align-self-center">Solo lectura</span> : (
                            <Button type="submit" disabled={saving || (!presupuesto && !solicitudes.length) || cargandoTiposEvento}>
                                {saving && <Spinner size="sm" className="me-2" />}
                                {presupuesto ? "Guardar cambios" : "Crear cotización"}
                            </Button>
                        )}
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
