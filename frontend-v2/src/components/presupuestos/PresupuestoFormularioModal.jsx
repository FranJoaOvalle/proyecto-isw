import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { mensajeError } from "../eventos/seguimiento.utils";
import { crearPresupuesto } from "../../services/presupuesto.service";

const MAX_ASISTENTES = 1000000;
const MAX_DESCUENTO = 9999999999.99;

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
    asistentes: 0,
    descuento: "0",
    recursos: []
};

export default function PresupuestoFormularioModal({
    show,
    onHide,
    onGuardado,
    solicitudes,
    recursos,
    cargandoRecursos,
    errorRecursos
}) {
    const [form, setForm] = useState(formularioInicial);
    const [asistentesManual, setAsistentesManual] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [validated, setValidated] = useState(false);

    const solicitudSeleccionada = useMemo(
        () => solicitudes.find((solicitud) => String(solicitud.id) === form.solicitudId),
        [solicitudes, form.solicitudId]
    );
    const minimoAsistentes = Number(
        solicitudSeleccionada?.tipoEvento?.cantidadPersonasBase ?? 1
    );
    const recursosDisponibles = recursos.filter(
        (recurso) => recurso.activo && !form.recursos.some(
            (item) => Number(item.recursoId) === recurso.id
        )
    );
    const totalEstimado = useMemo(() => {
        const subtotalRecursos = form.recursos.reduce((total, item) => {
            const recurso = recursos.find(
                (opcion) => opcion.id === Number(item.recursoId)
            );
            const precio = Number(recurso?.precioUnitario ?? 0);
            const cantidad = Number(item.cantidad ?? 0);
            return total + precio * cantidad;
        }, 0);

        return Math.max(0, subtotalRecursos - (Number(form.descuento) || 0));
    }, [form.recursos, form.descuento, recursos]);
    const formatoMoneda = useMemo(
        () => new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 2
        }),
        []
    );

    useEffect(() => {
        if (show) {
            setForm(formularioInicial);
            setAsistentesManual("");
            setError("");
            setValidated(false);
        }
    }, [show]);

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
        const cantidadesValidas = form.recursos.every((item) =>
            Number.isInteger(Number(item.cantidad)) &&
            Number(item.cantidad) >= 1 &&
            Number(item.cantidad) <= 100000
        );
        const fechasValidas =
            new Date(form.fin) > new Date(form.inicio) &&
            new Date(form.inicio) > new Date();

        if (!formularioValido || !descuentoValido || !cantidadesValidas || !fechasValidas || saving) {
            if (!fechasValidas) {
                setError("El inicio debe ser futuro y el término posterior al inicio.");
            } else if (!descuentoValido || Number(form.descuento) > MAX_DESCUENTO) {
                setError("Ingresa un descuento válido, con máximo dos decimales.");
            } else if (!cantidadesValidas) {
                setError("Cada recurso debe tener una cantidad entera entre 1 y 100000.");
            }
            return;
        }

        setSaving(true);
        try {
            const payload = {
                solicitudId: Number(form.solicitudId),
                inicio: new Date(form.inicio).toISOString(),
                fin: new Date(form.fin).toISOString(),
                lugar: form.lugar.trim(),
                asistentes: Number(form.asistentes),
                descuento: Number(form.descuento),
                recursos: form.recursos.map((item) => ({
                    recursoId: Number(item.recursoId),
                    cantidad: Number(item.cantidad)
                }))
            };
            const presupuesto = await crearPresupuesto(payload);
            onGuardado(presupuesto);
        } catch (err) {
            setError(mensajeError(err, "No fue posible crear el presupuesto."));
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
            <Form noValidate validated={validated} onSubmit={guardar}>
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>Nueva cotización</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="p-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    {error && <Alert variant="danger">{error}</Alert>}
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
                        <Form.Text className="text-muted">
                            Solo se pueden emitir cotizaciones desde solicitudes en estado EN_REVISION.
                        </Form.Text>
                    </Form.Group>

                    {solicitudSeleccionada && (
                        <>
                            <Alert variant="light" className="border">
                                <strong>{nombreCliente}</strong>
                                <span className="d-block text-muted">
                                    {solicitudSeleccionada.tipoEvento?.nombre} · mínimo {minimoAsistentes} asistentes
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

                            <Form.Group controlId="presupuesto-lugar" className="mt-3">
                                <Form.Label>Lugar *</Form.Label>
                                <Form.Control
                                    required
                                    minLength={3}
                                    maxLength={255}
                                    name="lugar"
                                    value={form.lugar}
                                    onChange={cambiarCampo}
                                    disabled={saving}
                                />
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
                                <Form.Text className="text-muted">
                                    El mínimo se ajusta al tipo de evento de la solicitud ({minimoAsistentes}).
                                </Form.Text>
                            </Form.Group>

                            <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                                <div>
                                    <h3 className="h6 mb-0">Recursos adicionales</h3>
                                    <small className="text-muted">Selecciona recursos del catálogo y sus cantidades.</small>
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

                            {cargandoRecursos && <div className="text-muted py-2"><Spinner size="sm" className="me-2" />Cargando catálogo...</div>}
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
                                                {recursos
                                                    .filter((recurso) => recurso.activo && (
                                                        recurso.id === Number(item.recursoId) ||
                                                        !form.recursos.some((otro, otroIndice) =>
                                                            otroIndice !== indice && Number(otro.recursoId) === recurso.id
                                                        )
                                                    ))
                                                    .map((recurso) => (
                                                        <option key={recurso.id} value={recurso.id}>
                                                            {recurso.nombre} · ${Number(recurso.precioUnitario).toLocaleString("es-CL")}
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
                                <p className="small text-muted">No hay recursos activos en el catálogo.</p>
                            )}

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
                    </div>
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column align-items-stretch gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">Total estimado (recursos − descuento)</span>
                        <strong className="fs-5">{formatoMoneda.format(totalEstimado)}</strong>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={onHide} disabled={saving}>
                            Cerrar
                        </Button>
                        <Button type="submit" disabled={saving || !solicitudes.length}>
                            {saving && <Spinner size="sm" className="me-2" />}
                            Crear cotización
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
