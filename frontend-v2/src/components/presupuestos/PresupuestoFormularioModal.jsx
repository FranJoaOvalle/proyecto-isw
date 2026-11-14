import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { mensajeError } from "../eventos/seguimiento.utils";
import { getEspacios } from "../../services/espacio.service";
import {
    actualizarPresupuesto,
    crearPresupuesto
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
    inicio: "",
    fin: "",
    lugar: "",
    espacioId: "",
    asistentes: 0,
    precioBaseAcordado: "",
    descuento: "0",
    recursos: []
};

const formularioDePresupuesto = (presupuesto) => presupuesto ? {
    solicitudId: String(presupuesto.solicitudId ?? ""),
    inicio: fechaLocal(presupuesto.inicio),
    fin: fechaLocal(presupuesto.fin),
    lugar: presupuesto.lugar ?? "",
    espacioId: presupuesto.espacioId ? String(presupuesto.espacioId) : "",
    asistentes: Number(presupuesto.asistentes ?? 1),
    precioBaseAcordado: presupuesto.precioBaseAcordado == null ? "" : String(presupuesto.precioBaseAcordado),
    descuento: String(presupuesto.descuento ?? 0),
    recursos: (presupuesto.recursos ?? []).map((item) => ({
        recursoId: String(item.recursoId), cantidad: item.cantidad
    }))
} : { ...formularioInicial, recursos: [] };

export default function PresupuestoFormularioModal({
    show,
    onHide,
    onGuardado,
    presupuesto = null,
    solicitudes,
    recursos,
    cargandoRecursos,
    errorRecursos
}) {
    const [form, setForm] = useState(() => formularioDePresupuesto(presupuesto));
    const [espacios, setEspacios] = useState([]);
    const [cargandoEspacios, setCargandoEspacios] = useState(true);
    const [revisionEspacios, setRevisionEspacios] = useState(0);
    const [error, setError] = useState("");
    useEffect(() => {
        let activo = true;
        getEspacios().then((datos) => { if (activo) setEspacios(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar los espacios.")); })
            .finally(() => { if (activo) setCargandoEspacios(false); });
        return () => { activo = false; };
    }, [revisionEspacios]);
    const [asistentesManual, setAsistentesManual] = useState(() => String(presupuesto?.asistentes ?? ""));
    const [saving, setSaving] = useState(false);
    const [validated, setValidated] = useState(false);

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
    const minimoAsistentes = Number(presupuesto
        ? presupuesto.cantidadPersonasBaseTipoEvento ?? presupuesto.asistentes ?? 1
        : solicitudSeleccionada?.tipoEvento?.cantidadPersonasBase ?? 1);
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
        const tipoEvento = solicitudSeleccionada?.tipoEvento;
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
                costoBase = Number(presupuesto.precioBaseCatalogo ?? presupuesto.precioBaseTipoEvento ?? 0);
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
        if (form.precioBaseAcordado !== "") costoBase = Number(form.precioBaseAcordado);
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
    }, [form.inicio, form.fin, form.recursos, form.descuento, form.precioBaseAcordado, recursos, solicitudSeleccionada, presupuesto, recargoCliente]);
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
        const minimo = Number(solicitud?.tipoEvento?.cantidadPersonasBase ?? 1);
        const asistentes = Math.max(Number(solicitud?.asistentes ?? minimo), minimo);

        setForm({
            ...formularioInicial,
            solicitudId,
            inicio: fechaLocal(solicitud?.inicio),
            fin: fechaLocal(solicitud?.fin),
            lugar: solicitud?.lugar ?? "",
            asistentes
        });
        setAsistentesManual(String(asistentes));
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

    function cambiarAsistentesManual(event) {
        const value = event.target.value;
        setAsistentesManual(value);

        if (value === "") {
            setForm((actual) => ({ ...actual, asistentes: minimoAsistentes }));
            return;
        }

        const numero = Number(value);
        if (Number.isFinite(numero)) {
            setForm((actual) => ({
                ...actual,
                asistentes: Math.min(
                    MAX_ASISTENTES,
                    Math.max(minimoAsistentes, Math.trunc(numero))
                )
            }));
        }
    }

    function finalizarAsistentesManual() {
        const numero = Number(asistentesManual);
        const asistentes = Math.min(
            MAX_ASISTENTES,
            Math.max(minimoAsistentes, Number.isFinite(numero) ? Math.trunc(numero) : minimoAsistentes)
        );
        setForm((actual) => ({ ...actual, asistentes }));
        setAsistentesManual(String(asistentes));
    }

    function cambiarAsistentesSlider(event) {
        const asistentes = Math.min(
            MAX_ASISTENTES,
            Math.max(minimoAsistentes, Number(event.target.value))
        );
        setForm((actual) => ({ ...actual, asistentes }));
        setAsistentesManual(String(asistentes));
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
        setValidated(true);
        setError("");

        const formularioValido = event.currentTarget.checkValidity();
        const descuentoValido = /^\d{1,10}(?:\.\d{1,2})?$/.test(form.descuento);
        const precioValido = form.precioBaseAcordado === "" ||
            (/^\d{1,10}(?:\.\d{1,2})?$/.test(form.precioBaseAcordado) && Number(form.precioBaseAcordado) <= MAX_DESCUENTO);
        const cantidadesValidas = form.recursos.every((item) =>
            Number.isInteger(Number(item.cantidad)) &&
            Number(item.cantidad) >= 1 &&
            Number(item.cantidad) <= 100000
        );
        const fechasValidas =
            new Date(form.fin) > new Date(form.inicio) &&
            new Date(form.inicio) > new Date();

        if (!formularioValido || !descuentoValido || !precioValido || !cantidadesValidas || !fechasValidas || saving) {
            if (!fechasValidas) {
                setError("El inicio debe ser futuro y el término posterior al inicio.");
            } else if (!descuentoValido || Number(form.descuento) > MAX_DESCUENTO) {
                setError("Ingresa un descuento válido, con máximo dos decimales.");
            } else if (!precioValido) {
                setError("Ingresa un precio base acordado válido, con máximo dos decimales, o deja el campo vacío para usar la referencia.");
            } else if (!cantidadesValidas) {
                setError("Cada recurso debe tener una cantidad entera entre 1 y 100000.");
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
                descuento: Number(form.descuento),
                precioBaseAcordado: form.precioBaseAcordado === "" ? null : Number(form.precioBaseAcordado),
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
                    <Modal.Title>{presupuesto ? "Editar cotización" : "Nueva cotización"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="overflow-auto p-3" style={{ minHeight: 0 }}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {presupuesto ? (
                        <Alert variant="light" className="border mb-3">
                            Editando cotización #{presupuesto.id}
                            {presupuesto.solicitudId && ` · Solicitud #${presupuesto.solicitudId}`}
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
                                        #{solicitud.id} · {solicitud.tipoEvento?.nombre ?? "Evento"} · {solicitud.estado}
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
                                <strong>{nombreCliente}</strong>
                                <span className="d-block text-body-secondary">
                                    {solicitudSeleccionada.tipoEvento?.nombre} · mínimo para guardar {minimoAsistentes} asistentes
                                </span>
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
                                <Button variant="link" size="sm" className="p-0 mt-1" disabled={saving}
                                    onClick={() => setRevisionEspacios((v) => v + 1)}>Actualizar lista de espacios</Button>
                            </Form.Group>

                            <Form.Group controlId="presupuesto-asistentes" className="mt-3">
                                <Form.Label>
                                    Cantidad de asistentes: <strong>{form.asistentes}</strong>
                                </Form.Label>
                                <Row className="g-3 align-items-center">
                                    <Col md={9}>
                                        <Form.Range
                                            min={minimoAsistentes}
                                            max={MAX_ASISTENTES}
                                            step={1}
                                            value={form.asistentes}
                                            onChange={cambiarAsistentesSlider}
                                            disabled={saving}
                                            aria-label="Cantidad de asistentes"
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Control
                                            required
                                            type="number"
                                            min={minimoAsistentes}
                                            max={MAX_ASISTENTES}
                                            step={1}
                                            value={asistentesManual}
                                            onChange={cambiarAsistentesManual}
                                            onBlur={finalizarAsistentesManual}
                                            isInvalid={validated && Number(asistentesManual) < minimoAsistentes}
                                            disabled={saving}
                                            aria-label="Cantidad de asistentes manual"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            El mínimo para este evento es {minimoAsistentes} asistentes.
                                        </Form.Control.Feedback>
                                    </Col>
                                </Row>
                                <Form.Text className="text-body-secondary">
                                    {presupuesto
                                        ? `La cotización conserva este mínimo de asistentes (${minimoAsistentes}).`
                                        : `El mínimo se ajusta al tipo de evento de la solicitud (${minimoAsistentes}).`}
                                </Form.Text>
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
                                            <Form.Control
                                                required
                                                type="number"
                                                min={0}
                                                max={100000}
                                                step={1}
                                                value={item.cantidad}
                                                onChange={(event) => cambiarCantidadRecurso(indice, event.target.value)}
                                                isInvalid={validated && (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1 || Number(item.cantidad) > 100000)}
                                                disabled={saving}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                La cantidad debe ser un entero entre 1 y 100000.
                                            </Form.Control.Feedback>
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

                            <Form.Group controlId="presupuesto-precio-acordado" className="mt-4">
                                <Form.Label>Precio base acordado</Form.Label>
                                <Form.Control type="number" name="precioBaseAcordado" min={0} max={MAX_DESCUENTO}
                                    step="0.01" placeholder="Usar referencia del catálogo" value={form.precioBaseAcordado}
                                    disabled={saving} onChange={cambiarCampo}
                                    isInvalid={validated && form.precioBaseAcordado !== "" &&
                                        (!/^\d{1,10}(?:\.\d{1,2})?$/.test(form.precioBaseAcordado) || Number(form.precioBaseAcordado) > MAX_DESCUENTO)} />
                                <Form.Text className="text-body-secondary">
                                    Opcional. Permite acordar un precio para esta propuesta sin cambiar el catálogo.
                                    Si queda vacío, se utiliza el precio de referencia conservado en la cotización.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">Usa un monto válido con máximo dos decimales.</Form.Control.Feedback>
                            </Form.Group>
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
                                    isInvalid={validated && (!/^\d{1,10}(?:\.\d{1,2})?$/.test(form.descuento) || Number(form.descuento) > MAX_DESCUENTO)}
                                    disabled={saving}
                                />
                                <Form.Control.Feedback type="invalid">
                                    Usa un monto válido con máximo dos decimales.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </>
                    )}
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
                        <Button type="submit" disabled={saving || (!presupuesto && !solicitudes.length)}>
                            {saving && <Spinner size="sm" className="me-2" />}
                            {presupuesto ? "Guardar cambios" : "Crear cotización"}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
