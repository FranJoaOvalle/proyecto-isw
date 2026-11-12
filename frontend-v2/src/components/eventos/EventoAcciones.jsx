import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import ConfirmModal from "../ConfirmModal";
import {
    editarEvento,
    cancelarEvento,
    eliminarEvento,
    cambiarEstadoEvento
} from "../../services/seguimiento.service";
import { mensajeError } from "./seguimiento.utils";

const fechaLocal = (valor) => {
    const fecha = new Date(valor);
    return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

const estadosSiguientes = {
    CONFIRMADO: { POSPUESTO: "Pospuesto", EN_CURSO: "En curso" },
    POSPUESTO: { CONFIRMADO: "Confirmado", EN_CURSO: "En curso" },
    EN_CURSO: { COMPLETADO: "Completado" }
};

export default function EventoAcciones({ evento, onCambio }) {
    const [accion, setAccion] = useState("");
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [validated, setValidated] = useState(false);
    const [imagenError, setImagenError] = useState(false);
    const [imagenPersonalizada, setImagenPersonalizada] = useState(false);
    const abrirEditar = () => {
        setImagenPersonalizada(Boolean(evento.imagen_url));
        setForm({
            inicio: fechaLocal(evento.inicio),
            fin: fechaLocal(evento.fin),
            lugar: evento.lugar,
            asistentes: evento.asistentes,
            observaciones: evento.observaciones ?? "",
            imagen_url: evento.imagen_url ?? ""
        });
        setValidated(false);
        setError("");
        setImagenError(false);
        setAccion("editar");
    };
    const cerrar = () => {
        if (!saving) setAccion("");
    };
    async function ejecutar(datos) {
        if (saving) return;
        setSaving(true);
        setError("");
        setMensaje("");
        try {
            if (accion === "editar") await editarEvento(evento.id, datos);
            else if (accion === "estado") await cambiarEstadoEvento(evento.id, datos);
            else if (accion === "cancelar") await cancelarEvento(evento.id);
            else await eliminarEvento(evento.id);
            setAccion("");
            setMensaje(
                accion === "editar"
                    ? "Evento actualizado correctamente."
                    : accion === "estado"
                      ? "Estado del evento actualizado correctamente."
                    : "Evento cancelado correctamente."
            );
            onCambio();
        } catch (err) {
            setError(mensajeError(err, "No fue posible completar la acción."));
        } finally {
            setSaving(false);
        }
    }
    const cambiar = (e) => {
        setForm((v) => ({ ...v, [e.target.name]: e.target.value }));
        if (e.target.name === "imagen_url") setImagenError(false);
    };
    return (
        <>
            {mensaje && (
                <Alert
                    variant="success"
                    className="mt-3"
                    dismissible
                    onClose={() => setMensaje("")}
                >
                    {mensaje}
                </Alert>
            )}
            {error && (
                <Alert
                    variant="danger"
                    className="mt-3"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
                {estadosSiguientes[evento.estado] && (
                    <Button variant="outline-primary" onClick={() => {
                        setForm({ estado: Object.keys(estadosSiguientes[evento.estado])[0], motivo: "" });
                        setValidated(false);
                        setError("");
                        setAccion("estado");
                    }}>
                        Cambiar estado
                    </Button>
                )}
                {!["CANCELADO", "COMPLETADO"].includes(evento.estado) && (
                    <Button
                        variant="outline-primary"
                        onClick={abrirEditar}
                    >
                        <i className="bi bi-pencil me-2" />
                        Editar
                    </Button>
                )}
                {["CONFIRMADO", "POSPUESTO"].includes(evento.estado) && (
                    <Button
                        variant="outline-danger"
                        onClick={() => {
                            setError("");
                            setAccion("cancelar");
                        }}
                    >
                        Cancelar evento
                    </Button>
                )}
                {evento.estado === "CANCELADO" && (
                    <div>
                        <Button
                            variant="outline-danger"
                            disabled
                        >
                            Eliminar definitivamente
                        </Button>
                        <small className="d-block text-secondary mt-1">
                            Conserva un presupuesto contratado e historial
                            protegido.
                        </small>
                    </div>
                )}
            </div>
            <Modal show={accion === "estado"} onHide={cerrar} centered backdrop="static">
                <Form noValidate validated={validated} onSubmit={(e) => {
                    e.preventDefault();
                    setValidated(true);
                    if (!e.currentTarget.checkValidity() || form.motivo.trim().length < 3) return;
                    ejecutar({ estado: form.estado, motivo: form.motivo.trim() });
                }}>
                    <Modal.Header closeButton={!saving}><Modal.Title>Cambiar estado del evento</Modal.Title></Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group controlId="evento-estado" className="mb-3">
                            <Form.Label>Nuevo estado</Form.Label>
                            <Form.Select required value={form.estado ?? ""} disabled={saving}
                                onChange={(e) => setForm((actual) => ({ ...actual, estado: e.target.value }))}>
                                {Object.entries(estadosSiguientes[evento.estado] ?? {}).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="evento-motivo-estado">
                            <Form.Label>Motivo *</Form.Label>
                            <Form.Control as="textarea" required minLength={3} maxLength={1000} value={form.motivo ?? ""}
                                disabled={saving} onChange={(e) => setForm((actual) => ({ ...actual, motivo: e.target.value }))} />
                            <Form.Control.Feedback type="invalid">Indica un motivo de al menos tres caracteres.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Text className="d-block mt-3">
                            El inicio y el cierre se habilitan según el horario confirmado. Las devoluciones de equipos y vehículos se registran por separado.
                        </Form.Text>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" disabled={saving} onClick={cerrar}>Cerrar</Button>
                        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Actualizar estado"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <Modal
                show={accion === "editar"}
                onHide={cerrar}
                centered
                backdrop="static"
            >
                <Form
                    noValidate
                    validated={validated}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setValidated(true);
                        if (
                            !e.currentTarget.checkValidity() ||
                            !form.lugar.trim() ||
                            new Date(form.fin) <= new Date(form.inicio)
                        )
                            return;
                        const datos = {
                            ...form,
                            inicio: new Date(form.inicio).toISOString(),
                            fin: new Date(form.fin).toISOString(),
                            asistentes: Number(form.asistentes),
                            observaciones: form.observaciones.trim() || null,
                            imagen_url: imagenPersonalizada
                                ? form.imagen_url.trim()
                                : null
                        };
                        if (form.inicio === fechaLocal(evento.inicio)) delete datos.inicio;
                        if (form.fin === fechaLocal(evento.fin)) delete datos.fin;
                        for (const campo of ["lugar", "asistentes", "observaciones", "imagen_url"]) {
                            if (datos[campo] === (evento[campo] ?? null)) delete datos[campo];
                        }
                        if (!Object.keys(datos).length) {
                            setError("No hay cambios para guardar.");
                            return;
                        }
                        ejecutar(datos);
                    }}
                >
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>Editar evento</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {[
                            ["inicio", "Inicio", "datetime-local"],
                            ["fin", "Término", "datetime-local"],
                            ["asistentes", "Asistentes", "number"]
                        ].map(([name, label, type]) => (
                            <Form.Group
                                key={name}
                                controlId={`evento-${name}`}
                                className="mb-3 position-relative"
                            >
                                <Form.Label>{label}</Form.Label>
                                <Form.Control
                                    name={name}
                                    type={type}
                                    readOnly={name === "lugar"}
                                    value={form[name] ?? ""}
                                    onChange={cambiar}
                                    required
                                    disabled={saving}
                                    min={type === "number" ? 1 : undefined}
                                    step={type === "number" ? 1 : undefined}
                                    maxLength={
                                        name === "lugar" ? 250 : undefined
                                    }
                                    isInvalid={
                                        validated &&
                                        name === "fin" &&
                                        new Date(form.fin) <=
                                            new Date(form.inicio)
                                    }
                                />
                                <Form.Control.Feedback
                                    type="invalid"
                                    tooltip
                                >
                                    {name === "fin"
                                        ? "El término debe ser posterior al inicio."
                                        : "Ingresa un valor válido."}
                                </Form.Control.Feedback>
                            </Form.Group>
                        ))}
                        <Form.Group
                            controlId="evento-observaciones"
                            className="mb-3"
                        >
                            <Form.Label>Observaciones</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="observaciones"
                                maxLength={5000}
                                value={form.observaciones ?? ""}
                                onChange={cambiar}
                                disabled={saving}
                            />
                        </Form.Group>
                        <fieldset>
                            <legend className="fs-6">Imagen del evento</legend>
                            <Form.Check
                                id="evento-imagen-heredada"
                                type="radio"
                                name="modoImagen"
                                label="Utilizar imagen del tipo de evento"
                                checked={!imagenPersonalizada}
                                disabled={saving}
                                onChange={() => {
                                    setImagenPersonalizada(false);
                                    setImagenError(false);
                                }}
                            />
                            <Form.Check
                                id="evento-imagen-personalizada"
                                type="radio"
                                name="modoImagen"
                                label="Utilizar URL de imagen personalizada"
                                checked={imagenPersonalizada}
                                disabled={saving}
                                onChange={() => {
                                    setImagenPersonalizada(true);
                                    setImagenError(false);
                                }}
                            />
                            {imagenPersonalizada && (
                                <Form.Group
                                    controlId="evento-imagen"
                                    className="mt-3"
                                >
                                    <Form.Label>
                                        URL de imagen personalizada
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="imagen_url"
                                        maxLength={2048}
                                        pattern="https://.*"
                                        required
                                        value={form.imagen_url ?? ""}
                                        onChange={cambiar}
                                        disabled={saving}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Ingresa una URL HTTPS válida.
                                    </Form.Control.Feedback>
                                </Form.Group>
                            )}
                            {((imagenPersonalizada &&
                                /^https:\/\//i.test(form.imagen_url)) ||
                                (!imagenPersonalizada &&
                                    evento.tipoEvento?.imagen_url)) &&
                                (imagenError ? (
                                    <Alert
                                        variant="warning"
                                        className="mt-3"
                                    >
                                        No fue posible cargar la vista previa.
                                        Se mostrará una alternativa si la imagen
                                        no está disponible.
                                    </Alert>
                                ) : (
                                    <img
                                        src={
                                            imagenPersonalizada
                                                ? form.imagen_url
                                                : evento.tipoEvento.imagen_url
                                        }
                                        alt="Vista previa del evento"
                                        className="img-fluid rounded mt-3"
                                        onError={() => setImagenError(true)}
                                    />
                                ))}
                        </fieldset>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            disabled={saving}
                            onClick={cerrar}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <ConfirmModal
                show={accion === "cancelar"}
                onHide={cerrar}
                onConfirm={() => ejecutar()}
                loading={saving}
                title="Cancelar evento"
                confirmText="Sí, cancelar evento"
            >
                <p>
                    El evento pasará a CANCELADO. Se conservarán su presupuesto,
                    pagos, recursos y todo su historial. Cancelar no elimina el
                    evento.
                </p>
                {error && <Alert variant="danger">{error}</Alert>}
            </ConfirmModal>
        </>
    );
}
