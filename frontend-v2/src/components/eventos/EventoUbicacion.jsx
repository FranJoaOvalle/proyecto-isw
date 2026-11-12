import { useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { getEspacios } from "../../services/espacio.service";
import { editarEvento } from "../../services/seguimiento.service";
import { mensajeError } from "./seguimiento.utils";

export default function EventoUbicacion({ evento, onCambio }) {
    const [show, setShow] = useState(false);
    const [espacios, setEspacios] = useState([]);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validated, setValidated] = useState(false);
    const completo = Boolean(evento.direccion && evento.comuna);
    const espaciosPermitidos = espacios.filter((espacio) =>
        (espacio.habilitado || espacio.id === evento.espacioId) &&
        (!evento.solicitudId || !evento.espacioId || espacio.id === evento.espacioId)
    );
    let textoBoton = "Definir ubicación";
    if (completo) {
        textoBoton = evento.solicitudId ? "Editar referencias de acceso" : "Editar ubicación";
    }

    const abrir = async () => {
        setError("");
        setValidated(false);
        setLoading(true);
        setShow(true);
        setForm({
            espacioId: evento.espacioId ? String(evento.espacioId) : "",
            lugar: evento.lugar,
            direccion: evento.direccion ?? "",
            comuna: evento.comuna ?? "",
            referenciaDireccion: evento.referenciaDireccion ?? ""
        });
        try {
            const datos = await getEspacios();
            setEspacios(datos);
            const actual = datos.find(
                (espacio) => espacio.id === evento.espacioId
            );
            if (actual && !evento.direccion)
                setForm((current) => ({
                    ...current,
                    lugar: actual.nombre,
                    direccion: actual.direccion,
                    comuna: actual.comuna ?? current.comuna
                }));
        } catch (err) {
            setError(
                mensajeError(
                    err,
                    "No fue posible cargar los recintos. Cierra el formulario para reintentar."
                )
            );
        } finally {
            setLoading(false);
        }
    };
    const seleccionar = (valor) => {
        const espacio = espacios.find((item) => item.id === Number(valor));
        setForm((current) => ({
            ...current,
            espacioId: valor,
            lugar: espacio?.nombre ?? "",
            direccion: espacio?.direccion ?? "",
            comuna: espacio?.comuna ?? "",
            referenciaDireccion: ""
        }));
    };
    const guardar = async (e) => {
        e.preventDefault();
        setValidated(true);
        if (!e.currentTarget.checkValidity() || saving || loading) return;
        setSaving(true);
        setError("");
        try {
            await editarEvento(evento.id, {
                espacioId: Number(form.espacioId),
                lugar: form.lugar.trim(),
                direccion: form.direccion.trim(),
                comuna: form.comuna.trim(),
                referenciaDireccion: form.referenciaDireccion.trim() || null
            });
            await onCambio();
            setShow(false);
        } catch (err) {
            setError(mensajeError(err, "No fue posible guardar la ubicación."));
        } finally {
            setSaving(false);
        }
    };
    const elegido = espacios.find((item) => item.id === Number(form.espacioId));
    const datosRecintoDifieren = elegido && (
        form.lugar !== elegido.nombre ||
        form.direccion !== elegido.direccion ||
        (elegido.comuna && form.comuna !== elegido.comuna)
    );
    return (
        <>
            {!["CANCELADO", "COMPLETADO"].includes(evento.estado) && (
                <Button
                    variant="outline-primary"
                    onClick={abrir}
                >
                    {textoBoton}
                </Button>
            )}
            <Modal
                show={show}
                onHide={() => !saving && setShow(false)}
                centered
                backdrop="static"
            >
                <Form noValidate validated={validated} onSubmit={guardar}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>Ubicación del evento</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {loading && (
                            <p>
                                <Spinner size="sm" /> Cargando recintos...
                            </p>
                        )}
                        <p className="text-secondary">La ubicación se obtiene de Recursos → Espacios. En eventos contratados se conserva el recinto de la propuesta aceptada.</p>
                        <Form.Group
                            controlId="ubicacion-espacio"
                            className="mb-3"
                        >
                            <Form.Label>Recinto</Form.Label>
                            <Form.Select
                                value={form.espacioId ?? ""}
                                required
                                disabled={saving || loading}
                                onChange={(e) =>
                                    seleccionar(e.target.value)
                                }
                            >
                                <option value="">
                                    Selecciona un recinto
                                </option>
                                {espaciosPermitidos.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nombre} · {item.capacidad} personas
                                        {!item.habilitado && " · Deshabilitado"}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text>
                                Al guardar, se comprueba la disponibilidad y se
                                registra la reserva del recinto si aún falta.
                            </Form.Text>
                            {datosRecintoDifieren && (
                                <div className="mt-2">
                                    <Form.Text>Se conservan los datos confirmados del evento.</Form.Text>
                                    <Button variant="link" className="p-0 d-block" disabled={saving || loading} onClick={() => seleccionar(form.espacioId)}>Usar datos actuales del recinto</Button>
                                </div>
                            )}
                        </Form.Group>
                        {[
                            ["lugar", "Nombre del lugar", 250],
                            ["direccion", "Dirección", 250],
                            ["comuna", "Comuna", 100]
                        ].map(([campo, label, max]) => (
                            <Form.Group
                                key={campo}
                                controlId={`ubicacion-${campo}`}
                                className="mb-3"
                            >
                                <Form.Label>{label}</Form.Label>
                                <Form.Control
                                    value={form[campo] ?? ""}
                                    required
                                    minLength={2}
                                    maxLength={max}
                                    disabled={saving || loading}
                                    readOnly
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            [campo]: e.target.value
                                        }))
                                    }
                                />
                                <Form.Control.Feedback type="invalid">
                                    Ingresa {label.toLowerCase()}.
                                </Form.Control.Feedback>
                            </Form.Group>
                        ))}
                        <Form.Group controlId="ubicacion-referencias">
                            <Form.Label>
                                Referencias de acceso (opcional)
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                maxLength={500}
                                value={form.referenciaDireccion ?? ""}
                                disabled={saving || loading}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        referenciaDireccion: e.target.value
                                    }))
                                }
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            disabled={saving}
                            onClick={() => setShow(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || loading || !form.espacioId}
                        >
                            {saving ? "Guardando..." : "Guardar ubicación"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}
