import { useEffect, useRef, useState } from "react";
import { Accordion, Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { getEspacios } from "../../services/espacio.service";
import { enviarPresupuesto, previsualizarEnvio } from "../../services/presupuesto.service";
import { mensajeError } from "../eventos/seguimiento.utils";
import PresupuestoResumen from "./PresupuestoResumen";

const fechaLocal = (fecha) => new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function PresupuestoEnvioModal({ presupuesto, onHide, onEnviado }) {
    const [espacios, setEspacios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [revisionEspacios, setRevisionEspacios] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validated, setValidated] = useState(false);
    const [resumen, setResumen] = useState(null);
    const bodyRef = useRef(null);
    const volverArriba = () => requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0 }));
    const [form, setForm] = useState(() => ({
        espacioId: presupuesto.espacioId ? String(presupuesto.espacioId) : "", lugar: presupuesto.lugar,
        direccion: presupuesto.direccion ?? "", comuna: presupuesto.comuna ?? "",
        referenciaDireccion: "", confirmarFactibilidad: false, arriendoIncluido: false,
        venceAt: fechaLocal(new Date(Math.min(Date.now() + 7 * 86400000, new Date(presupuesto.inicio).getTime() - 3600000)))
    }));

    useEffect(() => {
        let activo = true;
        getEspacios({ inicio: presupuesto.inicio, fin: presupuesto.fin })
            .then((datos) => {
                if (!activo) return;
                setEspacios(datos);
                const elegido = datos.find((item) => item.id === presupuesto.espacioId);
                if (elegido) setForm((actual) => ({ ...actual,
                    lugar: elegido.nombre, direccion: elegido.direccion, comuna: elegido.comuna ?? ""
                }));
            })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar los recintos.")); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [presupuesto.inicio, presupuesto.fin, presupuesto.espacioId, revisionEspacios]);

    function cambiar(campo, valor) {
        setResumen(null);
        setForm((actual) => ({ ...actual, [campo]: valor }));
    }

    function seleccionarEspacio(valor) {
        setResumen(null);
        const espacio = espacios.find((item) => item.id === Number(valor));
        setForm((actual) => ({
            ...actual, espacioId: valor, lugar: espacio?.nombre ?? presupuesto.lugar,
            direccion: espacio?.direccion ?? "", comuna: espacio?.comuna ?? "",
            referenciaDireccion: "", confirmarFactibilidad: false
        }));
    }

    async function enviar(event) {
        event.preventDefault();
        setValidated(true);
        if (saving || cargando) return;
        if (!event.currentTarget.checkValidity()) {
            const invalido = event.currentTarget.querySelector(":invalid");
            invalido?.focus();
            invalido?.scrollIntoView({ block: "center" });
            return;
        }
        setSaving(true);
        setError("");
        try {
            const datos = {
                version: presupuesto.version,
                espacioId: form.espacioId ? Number(form.espacioId) : null,
                lugar: form.lugar.trim(), direccion: form.direccion.trim(), comuna: form.comuna.trim(),
                referenciaDireccion: form.referenciaDireccion.trim() || null,
                venceAt: new Date(form.venceAt).toISOString(), confirmarFactibilidad: form.confirmarFactibilidad,
                arriendoIncluido: form.arriendoIncluido
            };
            if (!resumen) {
                setResumen(await previsualizarEnvio(presupuesto.id, datos));
                volverArriba();
                return;
            }
            await enviarPresupuesto(presupuesto.id, { ...datos, totalConfirmado: Number(resumen.total) });
            onEnviado();
        } catch (err) {
            setError(mensajeError(err, "No fue posible enviar la propuesta."));
            volverArriba();
        } finally {
            setSaving(false);
        }
    }

    const registrado = Boolean(form.espacioId);
    return (
        <Modal show onHide={() => !saving && onHide()} centered size="lg" backdrop="static" scrollable>
            <Form noValidate validated={validated} onSubmit={enviar}
                className="d-flex flex-column overflow-hidden" style={{ minHeight: 0 }}>
                <Modal.Header closeButton={!saving}><Modal.Title>{resumen ? "Revisar y enviar" : "Preparar envío"} · Propuesta #{presupuesto.id}</Modal.Title></Modal.Header>
                <Modal.Body ref={bodyRef} style={{ maxHeight: "calc(100dvh - 230px)", overflowY: "auto" }}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {resumen ? <>
                        <Alert variant="info">Revisa las condiciones y el total. Pulsa «Enviar propuesta al cliente» para confirmar el envío.</Alert>
                        <PresupuestoResumen presupuesto={resumen} />
                    </> : <>
                    <p className="text-secondary">Paso 1 de 2 · Completa la ubicación y la vigencia. Después podrás revisar el total antes de enviar.</p>
                    <Accordion className="mb-3">
                        <Accordion.Item eventKey="cotizacion">
                            <Accordion.Header>Ver detalle de la cotización</Accordion.Header>
                            <Accordion.Body><PresupuestoResumen presupuesto={presupuesto} /></Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                    <Form.Group controlId="envio-espacio" className="mb-3">
                        <Form.Label>Ubicación definitiva</Form.Label>
                        <Form.Select required value={form.espacioId} disabled={saving || cargando} onChange={(e) => seleccionarEspacio(e.target.value)}>
                            <option value="">Selecciona un espacio registrado</option>
                            {espacios.filter((item) => item.habilitado && (!presupuesto.espacioId || item.id === presupuesto.espacioId)).map((item) => (
                                <option key={item.id} value={item.id} disabled={item.disponible === false}>
                                    {item.nombre} · {item.capacidad} personas{item.disponible === false ? " · No disponible" : ""}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text>Se utiliza el espacio elegido en el presupuesto. Para cambiarlo, edita el borrador. Sus datos se mantienen en Recursos → Espacios.</Form.Text>
                        <div className="d-flex gap-3 align-items-center mt-2">
                            <a href="/admin/recursos" target="_blank" rel="noreferrer">Administrar espacios</a>
                            <Button variant="link" className="p-0" disabled={saving} onClick={() => {
                                setResumen(null); setRevisionEspacios((v) => v + 1);
                            }}>Actualizar lista</Button>
                        </div>
                    </Form.Group>
                    {registrado && <Form.Check id="envio-arriendo-incluido" className="mb-3"
                        checked={form.arriendoIncluido} disabled={saving}
                        onChange={(e) => cambiar("arriendoIncluido", e.target.checked)}
                        label="El precio base acordado ya incluye el arriendo del recinto." />}
                    <p className="text-secondary small">
                        Si corresponde un arriendo adicional, se calcula según la tarifa del recinto.
                        Por hora se cobra la duración proporcional; por día, bloques de 24 horas iniciados; por evento, una unidad.
                    </p>
                    {[
                        ["lugar", "Nombre del lugar", 3, 255, registrado],
                        ["direccion", "Dirección", 2, 250, registrado],
                        ["comuna", "Comuna", 2, 100, registrado && Boolean(espacios.find((item) => item.id === Number(form.espacioId))?.comuna)]
                    ].map(([campo, etiqueta, minimo, maximo]) => (
                        <Form.Group key={campo} controlId={`envio-${campo}`} className="mb-3">
                            <Form.Label>{etiqueta} *</Form.Label>
                            <Form.Control required value={form[campo]} minLength={minimo} maxLength={maximo}
                                readOnly disabled={saving} onChange={(e) => cambiar(campo, e.target.value)} />
                            <Form.Control.Feedback type="invalid">Completa este campo.</Form.Control.Feedback>
                        </Form.Group>
                    ))}
                    <Form.Group controlId="envio-referencia" className="mb-3">
                        <Form.Label>Referencias de la dirección</Form.Label>
                        <Form.Control value={form.referenciaDireccion} maxLength={500} disabled={saving}
                            onChange={(e) => cambiar("referenciaDireccion", e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="envio-vencimiento" className="mb-3">
                        <Form.Label>Válida hasta *</Form.Label>
                        <Form.Control type="datetime-local" required value={form.venceAt} disabled={saving}
                            max={fechaLocal(new Date(presupuesto.inicio))} onChange={(e) => cambiar("venceAt", e.target.value)} />
                        <Form.Control.Feedback type="invalid">Indica una vigencia anterior al evento.</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Check id="envio-factibilidad" required checked={form.confirmarFactibilidad} disabled={saving}
                        onChange={(e) => cambiar("confirmarFactibilidad", e.target.checked)}
                        label="He revisado las condiciones y la factibilidad del lugar, fecha y horario de esta propuesta." />
                    <p className="text-secondary small mt-3 mb-0">
                        La propuesta quedará disponible en Compra / Contrato del cliente.
                        La disponibilidad se comprobará nuevamente al aceptar. No se exige anticipo para contratar.
                    </p>
                    </>}
                </Modal.Body>
                <Modal.Footer className="flex-shrink-0">
                    {resumen && <Button variant="outline-primary" disabled={saving} onClick={() => {
                        setResumen(null); setError(""); setValidated(false); volverArriba();
                    }}>Editar datos</Button>}
                    <Button variant="secondary" onClick={onHide} disabled={saving}>Cerrar</Button>
                    <Button type="submit" disabled={saving || cargando}>
                        {(saving || cargando) && <Spinner size="sm" className="me-2" />}{resumen ? "Enviar propuesta al cliente" : "Continuar: revisar importe"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
