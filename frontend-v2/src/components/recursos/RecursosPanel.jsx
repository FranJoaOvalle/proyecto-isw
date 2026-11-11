import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Form,
    Modal,
    Spinner,
    Table
} from "react-bootstrap";

import ConfirmModal from "../ConfirmModal";
import EmptyState from "../EmptyState";
import TableToolbar from "../admin/TableToolbar";
import {
    createRecurso,
    getRecursos,
    updateRecurso,
    updateRecursoEstado
} from "../../services/recurso.service";
import ReservasRecursoModal from "./ReservasRecursoModal";

const initialForm = {
    nombre: "",
    descripcion: "",
    precioUnitario: "",
    stockTotal: "",
    cantidadEnMantencion: "0",
    cantidadPerdida: "0",
    unidad: "unidad"
};

const moneda = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
});

const fechaIso = value => {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) throw new Error("La fecha indicada no es válida.");
    return fecha.toISOString();
};

export default function RecursosPanel({ eventoInicial }) {
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingId, setChangingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [validated, setValidated] = useState(false);
    const [recursoEstado, setRecursoEstado] = useState(null);
    const [recursoReservado, setRecursoReservado] = useState(null);
    const [rango, setRango] = useState({ inicio: "", fin: "" });
    const [rangoAplicado, setRangoAplicado] = useState(null);

    const loadRecursos = useCallback(async (intervalo = null) => {
        try {
            const data = await getRecursos(true, intervalo);
            setRecursos(data);
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cargar los recursos."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial data loading belongs to an effect; state updates happen after the request resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadRecursos();
    }, [loadRecursos]);

    const buscarDisponibilidad = async event => {
        event.preventDefault();
        setError("");
        try {
            if (!rango.inicio || !rango.fin) throw new Error("Indica el inicio y término del período.");
            const intervalo = { inicio: fechaIso(rango.inicio), fin: fechaIso(rango.fin) };
            if (new Date(intervalo.fin) <= new Date(intervalo.inicio)) throw new Error("El término debe ser posterior al inicio.");
            setRangoAplicado(intervalo);
            setLoading(true);
            await loadRecursos(intervalo);
        } catch (err) {
            setError(err.message || "No fue posible consultar disponibilidad.");
        }
    };

    const limpiarDisponibilidad = async () => {
        setRangoAplicado(null);
        setRango({ inicio: "", fin: "" });
        setLoading(true);
        await loadRecursos(null);
    };

    const abrirCrear = () => {
        setEditing(null);
        setForm({ ...initialForm });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const abrirEditar = recurso => {
        setEditing(recurso);
        setForm({
            nombre: recurso.nombre,
            descripcion: recurso.descripcion ?? "",
            precioUnitario: String(recurso.precioUnitario),
            stockTotal: String(recurso.stockTotal),
            cantidadEnMantencion: String(recurso.cantidadEnMantencion),
            cantidadPerdida: String(recurso.cantidadPerdida),
            unidad: recurso.material?.unidad ?? ""
        });
        setValidated(false);
        setError("");
        setShowModal(true);
    };

    const cerrarModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setValidated(false);
    };

    const handleChange = event => {
        const { name, value } = event.target;
        setForm(current => ({ ...current, [name]: value }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        const element = event.currentTarget;
        if (!element.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        const data = {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            precioUnitario: Number(form.precioUnitario),
            stockTotal: Number(form.stockTotal),
            cantidadEnMantencion: Number(form.cantidadEnMantencion),
            cantidadPerdida: Number(form.cantidadPerdida),
            unidad: form.unidad.trim() || null
        };

        try {
            if (editing) {
                await updateRecurso(editing.id, data);
            } else {
                await createRecurso({ ...data, tipo: "MATERIAL" });
            }
            setShowModal(false);
            setEditing(null);
            setSuccess(editing
                ? "Recurso actualizado correctamente."
                : "Recurso registrado correctamente.");
            await loadRecursos();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible guardar el recurso."
            );
        } finally {
            setSaving(false);
        }
    };

    const confirmarEstado = async () => {
        if (!recursoEstado) return;
        setChangingId(recursoEstado.id);
        setError("");
        setSuccess("");
        try {
            await updateRecursoEstado(recursoEstado.id, !recursoEstado.activo);
            setRecursoEstado(null);
            setSuccess(recursoEstado.activo
                ? "Recurso desactivado. Se conserva en los presupuestos y eventos existentes."
                : "Recurso activado correctamente.");
            await loadRecursos();
        } catch (err) {
            setError(
                err.response?.data?.error?.message ??
                "No fue posible cambiar el estado del recurso."
            );
        } finally {
            setChangingId(null);
        }
    };

    const filtrados = useMemo(() => {
        const termino = search.trim().toLowerCase();
        return recursos.filter(recurso => {
            const coincideTexto = !termino || [
                recurso.nombre,
                recurso.descripcion ?? "",
                recurso.material?.unidad ?? ""
            ].some(valor => valor.toLowerCase().includes(termino));
            const coincideEstado = estado === "TODOS" ||
                (estado === "ACTIVOS" && recurso.activo) ||
                (estado === "INACTIVOS" && !recurso.activo);
            return coincideTexto && coincideEstado;
        });
    }, [recursos, search, estado]);

    return (
        <>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="h4 fw-bold mb-1">Inventario de recursos</h2>
                    <p className="text-secondary mb-0">
                        Administra equipos y materiales, su estado de mantención y las reservas por evento.
                    </p>
                </div>
                <Button onClick={abrirCrear}>
                    <i className="bi bi-plus-lg me-2" />Nuevo recurso
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

            <Form onSubmit={buscarDisponibilidad} className="border rounded-3 p-3 mb-4 bg-body-tertiary">
                <div className="d-flex align-items-center gap-2 mb-3"><i className="bi bi-calendar2-check text-primary" /><strong>Consultar disponibilidad de equipos</strong></div>
                <div className="row align-items-end g-3">
                    <Form.Group className="col-md-4">
                        <Form.Label>Desde</Form.Label>
                        <Form.Control type="datetime-local" value={rango.inicio} onChange={event => setRango(current => ({ ...current, inicio: event.target.value }))} required />
                    </Form.Group>
                    <Form.Group className="col-md-4">
                        <Form.Label>Hasta</Form.Label>
                        <Form.Control type="datetime-local" value={rango.fin} onChange={event => setRango(current => ({ ...current, fin: event.target.value }))} required />
                    </Form.Group>
                    <div className="col-md-4 d-flex gap-2">
                        <Button type="submit" disabled={loading}><i className="bi bi-search me-2" />Consultar</Button>
                        {rangoAplicado && <Button type="button" variant="outline-secondary" onClick={limpiarDisponibilidad} disabled={loading}>Ver stock operativo</Button>}
                    </div>
                </div>
                {rangoAplicado && <small className="text-secondary d-block mt-2">Las cantidades consideran reservas activas en el período consultado.</small>}
            </Form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre, descripción o unidad..."
                estado={estado}
                onEstadoChange={setEstado}
            />

            {loading ? (
                <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
            ) : filtrados.length === 0 ? (
                <EmptyState
                    icon="bi-box-seam"
                    title={recursos.length ? "No se encontraron recursos" : "Aún no hay recursos"}
                    description={recursos.length
                        ? "Prueba con otros términos o filtros."
                        : "Registra equipos, mobiliario u otros materiales para comenzar el inventario."}
                />
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle">
                        <caption className="caption-top text-secondary">{filtrados.length} recursos</caption>
                        <thead>
                            <tr>
                                <th>Equipo o material</th><th>Stock</th><th>Estado operativo</th>
                                <th>Precio unitario</th><th>Estado</th><th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map(recurso => (
                                <tr key={recurso.id}>
                                    <td>
                                        <div className="fw-semibold">{recurso.nombre}</div>
                                        <small className="text-secondary">{recurso.descripcion || "Sin descripción"}</small>
                                    </td>
                                    <td>
                                        {recurso.stockTotal} {recurso.material?.unidad || "unidades"}
                                        <small className="d-block text-secondary">
                                            {recurso.cantidadDisponible ?? (recurso.stockTotal - recurso.cantidadEnMantencion - recurso.cantidadPerdida)} {rangoAplicado ? "disponibles en el período" : "operativas antes de reservas"}
                                        </small>
                                    </td>
                                    <td>
                                        {recurso.cantidadEnMantencion > 0 && <Badge bg="warning" text="dark" className="me-1">{recurso.cantidadEnMantencion} en mantención</Badge>}
                                        {recurso.cantidadPerdida > 0 && <Badge bg="danger">{recurso.cantidadPerdida} perdidas</Badge>}
                                        {recurso.cantidadEnMantencion === 0 && recurso.cantidadPerdida === 0 && <Badge bg="success">Operativo</Badge>}
                                    </td>
                                    <td>{moneda.format(Number(recurso.precioUnitario))}</td>
                                    <td><Badge bg={recurso.activo ? "success" : "secondary"}>{recurso.activo ? "Activo" : "Inactivo"}</Badge></td>
                                    <td className="text-end text-nowrap">
                                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => setRecursoReservado(recurso)}>
                                            <i className="bi bi-calendar2-week me-1" />Reservas
                                        </Button>
                                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => abrirEditar(recurso)}>
                                            <i className="bi bi-pencil me-1" />Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={recurso.activo ? "outline-danger" : "outline-success"}
                                            disabled={changingId === recurso.id}
                                            onClick={() => setRecursoEstado(recurso)}
                                        >
                                            {recurso.activo ? "Desactivar" : "Activar"}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            <Modal show={showModal} onHide={cerrarModal} centered>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{editing ? "Editar recurso" : "Nuevo recurso"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control name="nombre" value={form.nombre} onChange={handleChange} minLength={2} maxLength={120} required disabled={saving} />
                            <Form.Control.Feedback type="invalid">Ingresa un nombre de al menos 2 caracteres.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control as="textarea" rows={3} name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={2000} disabled={saving} />
                        </Form.Group>
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Precio unitario (CLP)</Form.Label>
                                <Form.Control type="number" name="precioUnitario" value={form.precioUnitario} onChange={handleChange} min={0} max={9999999999.99} step="0.01" required disabled={saving} />
                                <Form.Control.Feedback type="invalid">Ingresa un valor igual o mayor que cero.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Stock total</Form.Label>
                                <Form.Control type="number" name="stockTotal" value={form.stockTotal} onChange={handleChange} min={0} max={2147483647} step={1} required disabled={saving} />
                                <Form.Control.Feedback type="invalid">Ingresa una cantidad entera igual o mayor que cero.</Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Unidad</Form.Label>
                            <Form.Control name="unidad" value={form.unidad} onChange={handleChange} maxLength={50} placeholder="Ej. unidad, equipo, kit" disabled={saving} />
                        </Form.Group>
                        <div className="row">
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Unidades en mantención</Form.Label>
                                <Form.Control type="number" name="cantidadEnMantencion" value={form.cantidadEnMantencion} onChange={handleChange} min={0} max={form.stockTotal || 0} step={1} required disabled={saving} />
                            </Form.Group>
                            <Form.Group className="col-md-6 mb-3">
                                <Form.Label>Unidades perdidas</Form.Label>
                                <Form.Control type="number" name="cantidadPerdida" value={form.cantidadPerdida} onChange={handleChange} min={0} max={form.stockTotal || 0} step={1} required disabled={saving} />
                            </Form.Group>
                        </div>
                        <Form.Text className="text-secondary">Las unidades en mantención y perdidas se descuentan de la disponibilidad.</Form.Text>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Spinner size="sm" className="me-2" />}
                            {editing ? "Guardar cambios" : "Crear recurso"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ConfirmModal
                show={Boolean(recursoEstado)}
                onHide={() => changingId === null && setRecursoEstado(null)}
                onConfirm={confirmarEstado}
                loading={changingId !== null}
                title={recursoEstado?.activo ? "Desactivar recurso" : "Activar recurso"}
                confirmText={recursoEstado?.activo ? "Desactivar" : "Activar"}
                variant={recursoEstado?.activo ? "danger" : "success"}
            >
                {recursoEstado?.activo
                    ? <>¿Desactivar <strong>{recursoEstado.nombre}</strong>? Se conservará en presupuestos y eventos existentes.</>
                    : <>¿Activar <strong>{recursoEstado?.nombre}</strong> para nuevos presupuestos y eventos?</>}
            </ConfirmModal>

            <ReservasRecursoModal
                eventoInicial={eventoInicial}
                recurso={recursoReservado}
                show={Boolean(recursoReservado)}
                onHide={() => setRecursoReservado(null)}
                onChanged={loadRecursos}
            />
        </>
    );
}
