import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { getProductores } from "../../services/productor.service";
import { editarEvento } from "../../services/seguimiento.service";
import { mensajeError } from "./seguimiento.utils";

export default function AsignarProductor({ evento, onCambio }) {
    const [mostrar, setMostrar] = useState(false);
    const [lista, setLista] = useState([]);
    const [id, setId] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    async function abrir() {
        setMostrar(true);
        setError("");
        setId(evento.productorId ?? "");
        setCargando(true);
        try {
            const productores = await getProductores();
            setLista(productores.filter((productor) => productor.usuario?.activo));
        } catch (err) {
            setError(mensajeError(err, "No fue posible cargar productores."));
        } finally {
            setCargando(false);
        }
    }
    async function guardar(e) {
        e.preventDefault();
        if (!id || saving) return;
        setSaving(true);
        setError("");
        try {
            await editarEvento(evento.id, { productorId: Number(id) });
            setMostrar(false);
            setMensaje("Productor asignado correctamente.");
            onCambio();
        } catch (err) {
            setError(mensajeError(err, "No fue posible asignar el productor."));
        } finally {
            setSaving(false);
        }
    }
    if (["CANCELADO", "COMPLETADO"].includes(evento.estado)) return null;
    return (
        <div className="mt-3">
            {mensaje && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setMensaje("")}
                >
                    {mensaje}
                </Alert>
            )}
            <Button
                variant="outline-primary"
                onClick={abrir}
            >
                {evento.productorId
                    ? "Reasignar productor"
                    : "Asignar productor"}
            </Button>
            <Modal
                show={mostrar}
                onHide={() => !saving && setMostrar(false)}
                centered
            >
                <Form onSubmit={guardar}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>Asignar productor</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group controlId="evento-productor">
                            <Form.Label>Productor activo</Form.Label>
                            <Form.Select
                                required
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                disabled={saving || cargando}
                            >
                                <option value="">
                                    Selecciona un productor
                                </option>
                                {lista.map((p) => (
                                    <option
                                        key={p.id}
                                        value={p.id}
                                    >
                                        {p.nombres} {p.apellidos}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            disabled={saving}
                            onClick={() => setMostrar(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || cargando || !id}
                        >
                            {saving ? "Guardando..." : "Guardar asignación"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
