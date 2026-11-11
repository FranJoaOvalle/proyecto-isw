import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { getEspacios } from "../../services/espacio.service";
import { enviarPresupuesto } from "../../services/presupuesto.service";
import { mensajeError } from "../eventos/seguimiento.utils";
import PresupuestoResumen from "./PresupuestoResumen";

const fechaLocal = (fecha) => new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function PresupuestoEnvioModal({ presupuesto, onHide, onEnviado }) {
    const [espacios, setEspacios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validated, setValidated] = useState(false);
    const [form, setForm] = useState(() => ({
        espacioId: "", lugar: presupuesto.lugar, direccion: "", comuna: "",
        referenciaDireccion: "", confirmarFactibilidad: false,
        venceAt: fechaLocal(new Date(Math.min(Date.now() + 7 * 86400000, new Date(presupuesto.inicio).getTime() - 3600000)))
    }));

    useEffect(() => {
        let activo = true;
        getEspacios({ inicio: presupuesto.inicio, fin: presupuesto.fin })
            .then((datos) => { if (activo) setEspacios(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar los recintos.")); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [presupuesto.inicio, presupuesto.fin]);

    function cambiar(campo, valor) {
        setForm((actual) => ({ ...actual, [campo]: valor }));
    }

    function seleccionarEspacio(valor) {
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
        if (!event.currentTarget.checkValidity() || saving || cargando) return;
        setSaving(true);
        setError("");
        try {
            await enviarPresupuesto(presupuesto.id, {
                version: presupuesto.version,
                espacioId: form.espacioId ? Number(form.espacioId) : null,
                lugar: form.lugar.trim(), direccion: form.direccion.trim(), comuna: form.comuna.trim(),
                referenciaDireccion: form.referenciaDireccion.trim() || null,
                venceAt: new Date(form.venceAt).toISOString(), confirmarFactibilidad: form.confirmarFactibilidad
            });
            onEnviado();
        } catch (err) {
            setError(mensajeError(err, "No fue posible enviar la propuesta."));
        } finally {
            setSaving(false);
        }
    }

    const registrado = Boolean(form.espacioId);
    return (
        <Modal show onHide={() => !saving && onHide()} centered size="lg" backdrop="static" scrollable>
            <Form noValidate validated={validated} onSubmit={enviar}>
                <Modal.Header closeButton={!saving}><Modal.Title>Enviar propuesta #{presupuesto.id}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <PresupuestoResumen presupuesto={presupuesto} />
                    <Form.Group controlId="envio-espacio" className="mb-3">
                        <Form.Label>Ubicación definitiva</Form.Label>
                        <Form.Select value={form.espacioId} disabled={saving || cargando} onChange={(e) => seleccionarEspacio(e.target.value)}>
                            <option value="">Otra ubicación</option>
                            {espacios.filter((item) => item.habilitado).map((item) => (
                                <option key={item.id} value={item.id} disabled={item.disponible === false}>
                                    {item.nombre} · {item.capacidad} personas{item.disponible === false ? " · No disponible" : ""}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    {[
                        ["lugar", "Nombre del lugar", 3, 255, registrado],
                        ["direccion", "Dirección", 2, 250, registrado],
                        ["comuna", "Comuna", 2, 100, registrado && Boolean(espacios.find((item) => item.id === Number(form.espacioId))?.comuna)]
                    ].map(([campo, etiqueta, minimo, maximo, soloLectura]) => (
                        <Form.Group key={campo} controlId={`envio-${campo}`} className="mb-3">
                            <Form.Label>{etiqueta} *</Form.Label>
                            <Form.Control required value={form[campo]} minLength={minimo} maxLength={maximo}
                                readOnly={soloLectura} disabled={saving} onChange={(e) => cambiar(campo, e.target.value)} />
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={saving}>Cerrar</Button>
                    <Button type="submit" disabled={saving || cargando}>
                        {(saving || cargando) && <Spinner size="sm" className="me-2" />}Enviar propuesta
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
