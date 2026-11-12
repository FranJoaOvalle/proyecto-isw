import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { getTiposEvento } from "../../services/tipoEvento.service";
import { getClientes } from "../../services/cliente.service";
import {
    crearSolicitud,
    editarSolicitud
} from "../../services/solicitud.service";
import { mensajeError } from "../eventos/seguimiento.utils";

const local = (v) =>
    v
        ? new Date(
              new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000
          )
              .toISOString()
              .slice(0, 16)
        : "";
export default function SolicitudFormulario({
    solicitud,
    tipoEventoIdInicial,
    esAdmin,
    onHide,
    onGuardado
}) {
    const [form, setForm] = useState(() => ({
        tipoEventoId: solicitud?.tipoEventoId ?? tipoEventoIdInicial ?? "",
        clienteId: "",
        inicio: local(solicitud?.inicio),
        fin: local(solicitud?.fin),
        asistentes: solicitud?.asistentes ?? "",
        lugar: solicitud?.lugar ?? "",
        observaciones: solicitud?.observaciones ?? ""
    }));
    const [tipos, setTipos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validated, setValidated] = useState(false);
    const [invalidarBorradores, setInvalidarBorradores] = useState(false);
    const tieneBorradores = esAdmin && solicitud?.presupuestos?.some((p) => p.estado === "BORRADOR");
    useEffect(() => {
        let activo = true;
        async function cargar() {
            try {
                const [lista, clientesDisponibles] = await Promise.all([
                    getTiposEvento(),
                    esAdmin && !solicitud ? getClientes() : []
                ]);
                if (activo) {
                    setTipos(lista);
                    setClientes(clientesDisponibles);
                }
            } catch (err) {
                if (activo)
                    setError(
                        mensajeError(err, "No fue posible cargar las opciones.")
                    );
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => {
            activo = false;
        };
    }, [esAdmin, solicitud]);
    const cambiar = (e) =>
        setForm((v) => ({ ...v, [e.target.name]: e.target.value }));
    async function guardar(e) {
        e.preventDefault();
        setValidated(true);
        if (
            !e.currentTarget.checkValidity() ||
            new Date(form.fin) <= new Date(form.inicio) ||
            saving
        )
            return;
        setSaving(true);
        setError("");
        const datos = {
            inicio: new Date(form.inicio).toISOString(),
            fin: new Date(form.fin).toISOString(),
            asistentes: Number(form.asistentes),
            lugar: form.lugar.trim() || null,
            observaciones: form.observaciones.trim() || null
        };
        if (!solicitud || esAdmin)
            datos.tipoEventoId = Number(form.tipoEventoId);
        if (!solicitud && esAdmin) datos.clienteId = Number(form.clienteId);
        if (tieneBorradores) datos.invalidarBorradores = invalidarBorradores;
        try {
            const resultado = solicitud
                ? await editarSolicitud(solicitud.id, datos)
                : await crearSolicitud(datos);
            onGuardado(resultado);
        } catch (err) {
            setError(mensajeError(err, "No fue posible guardar la solicitud."));
        } finally {
            setSaving(false);
        }
    }
    return (
        <Modal
            show
            onHide={() => !saving && onHide()}
            centered
            backdrop="static"
        >
            <Form
                noValidate
                validated={validated}
                onSubmit={guardar}
            >
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>
                        {solicitud ? "Editar solicitud" : "Nueva solicitud"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {tieneBorradores && (
                        <Alert variant="warning">
                            Cambiar esta solicitud dejará sus borradores anteriores cancelados. Después podrás preparar una cotización con las nuevas condiciones.
                            <Form.Check id="solicitud-invalidar-borradores" className="mt-2" required
                                checked={invalidarBorradores} disabled={saving}
                                onChange={(e) => setInvalidarBorradores(e.target.checked)}
                                label="Confirmo la cancelación de los borradores anteriores al guardar." />
                        </Alert>
                    )}
                    <Form.Group
                        controlId="solicitud-tipo"
                        className="mb-3"
                    >
                        <Form.Label>Tipo de evento</Form.Label>
                        <Form.Select
                            required
                            name="tipoEventoId"
                            value={form.tipoEventoId}
                            onChange={cambiar}
                            disabled={saving || Boolean(solicitud && !esAdmin)}
                        >
                            <option value="">Selecciona un tipo</option>
                            {tipos.map((t) => (
                                <option
                                    key={t.id}
                                    value={t.id}
                                >
                                    {t.nombre}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    {esAdmin && !solicitud && (
                        <Form.Group
                            controlId="solicitud-cliente"
                            className="mb-3"
                        >
                            <Form.Label>Cliente</Form.Label>
                            <Form.Select
                                required
                                name="clienteId"
                                value={form.clienteId}
                                onChange={cambiar}
                                disabled={saving}
                            >
                                <option value="">Selecciona un cliente</option>
                                {clientes
                                    .filter((c) => c.usuario?.activo)
                                    .map((c) => (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                        >
                                            {c.empresa?.razonSocial ||
                                                `${c.persona?.nombres} ${c.persona?.apellidos}`}
                                        </option>
                                    ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                    {[
                        ["inicio", "Inicio propuesto", "datetime-local"],
                        ["fin", "Término propuesto", "datetime-local"],
                        ["asistentes", "Asistentes estimados", "number"],
                        ["lugar", "Lugar preferido (opcional)", "text"]
                    ].map(([name, label, type]) => (
                        <Form.Group
                            controlId={`solicitud-${name}`}
                            key={name}
                            className="mb-3 position-relative"
                        >
                            <Form.Label>{label}</Form.Label>
                            <Form.Control
                                name={name}
                                type={type}
                                value={form[name]}
                                onChange={cambiar}
                                disabled={saving}
                                required={name !== "lugar"}
                                min={type === "number" ? 1 : undefined}
                                max={type === "number" ? 1000000 : undefined}
                                maxLength={name === "lugar" ? 200 : undefined}
                                isInvalid={
                                    validated &&
                                    name === "fin" &&
                                    new Date(form.fin) <= new Date(form.inicio)
                                }
                            />
                            <Form.Control.Feedback
                                type="invalid"
                                tooltip
                            >
                                Ingresa un valor válido; el término debe ser
                                posterior al inicio.
                            </Form.Control.Feedback>
                        </Form.Group>
                    ))}
                    <Form.Group controlId="solicitud-observaciones">
                        <Form.Label>Observaciones (opcional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="observaciones"
                            value={form.observaciones}
                            onChange={cambiar}
                            maxLength={5000}
                            disabled={saving}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={onHide}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving || cargando}
                    >
                        {saving ? "Guardando..." : "Guardar solicitud"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
