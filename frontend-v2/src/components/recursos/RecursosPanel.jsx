import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
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
    deleteRecurso,
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

const intervaloDia = value => {
    const [year, month, day] = value.split("-").map(Number);
    return {
        inicio: new Date(year, month - 1, day).toISOString(),
        fin: new Date(year, month - 1, day + 1).toISOString()
    };
};

const intervaloHora = (dia, hora) => {
    const [year, month, day] = dia.split("-").map(Number);
    const [hours, minutes] = hora.split(":").map(Number);
    const inicio = new Date(year, month - 1, day, hours, minutes);
    return {
        inicio: inicio.toISOString(),
        fin: new Date(inicio.getTime() + 60 * 60 * 1000).toISOString()
    };
};

export default function RecursosPanel() {
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
    const [recursoEliminar, setRecursoEliminar] = useState(null);
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
            if (!rango.inicio) throw new Error("Selecciona el día que quieres consultar.");
            const intervalo = rango.fin
                ? intervaloHora(rango.inicio, rango.fin)
                : intervaloDia(rango.inicio);
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

    const confirmarEliminacion = async () => {
        if (!recursoEliminar) return;
        setChangingId(recursoEliminar.id);
        setError("");
        setSuccess("");
        try {
            await deleteRecurso(recursoEliminar.id);
            setSuccess(`Recurso ${recursoEliminar.nombre} eliminado definitivamente.`);
            setRecursoEliminar(null);
            await loadRecursos(rangoAplicado);
        } catch (err) {
            setError(err.response?.data?.error?.message ?? "No fue posible eliminar el recurso.");
            setRecursoEliminar(null);
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

    const resumenStock = useMemo(() => {
        const total = recursos.reduce((suma, recurso) => suma + Number(recurso.stockTotal || 0), 0);
        const enMantencion = recursos.reduce(
            (suma, recurso) => suma + Number(recurso.cantidadEnMantencion || 0),
            0
        );
        const perdidas = recursos.reduce(
            (suma, recurso) => suma + Number(recurso.cantidadPerdida || 0),
            0
        );
        const disponibles = recursos.reduce(
            (suma, recurso) => suma + Number(recurso.cantidadDisponible ?? (
                recurso.stockTotal - recurso.cantidadEnMantencion - recurso.cantidadPerdida
            )),
            0
        );
        const reservadas = rangoAplicado
            ? Math.max(0, total - enMantencion - perdidas - disponibles)
            : null;
        return { total, enMantencion, perdidas, disponibles, reservadas };
    }, [recursos, rangoAplicado]);

    const segmentosStock = [
        { clave: "reservadas", etiqueta: "Reservadas", valor: resumenStock.reservadas, color: "var(--bs-primary)" },
        { clave: "perdidas", etiqueta: "Perdidas", valor: resumenStock.perdidas, color: "var(--bs-danger)" },
        { clave: "mantenimiento", etiqueta: "En mantención", valor: resumenStock.enMantencion, color: "var(--bs-warning)" },
        { clave: "disponibles", etiqueta: rangoAplicado ? "Disponibles en período" : "Stock operativo (sin reservas)", valor: resumenStock.disponibles, color: "var(--bs-success)" }
    ].filter(segmento => segmento.valor !== null && segmento.valor > 0);

    const totalSegmentos = segmentosStock.reduce((suma, segmento) => suma + segmento.valor, 0);
    let acumuladoSegmentos = 0;
    const graficoStock = segmentosStock.map(segmento => {
        const inicio = acumuladoSegmentos;
        acumuladoSegmentos += segmento.valor;
        return `${segmento.color} ${totalSegmentos ? (inicio / totalSegmentos) * 100 : 0}% ${totalSegmentos ? (acumuladoSegmentos / totalSegmentos) * 100 : 0}%`;
    }).join(", ");

    const relacionesRecursoEliminar = recursoEliminar
        ? [
            recursoEliminar._count?.reservas > 0 && `${recursoEliminar._count.reservas} ${recursoEliminar._count.reservas === 1 ? "reserva" : "reservas"}`,
            recursoEliminar._count?.eventos > 0 && `${recursoEliminar._count.eventos} ${recursoEliminar._count.eventos === 1 ? "evento" : "eventos"}`,
            recursoEliminar._count?.presupuestos > 0 && `${recursoEliminar._count.presupuestos} ${recursoEliminar._count.presupuestos === 1 ? "presupuesto" : "presupuestos"}`
        ].filter(Boolean)
        : [];

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
                <div className="row align-items-start g-3">
                    <Form.Group className="col-md-4">
                        <Form.Label>Día del evento</Form.Label>
                        <Form.Control type="date" value={rango.inicio} onChange={event => setRango(current => ({ ...current, inicio: event.target.value }))} required />
                    </Form.Group>
                    <Form.Group className="col-md-4">
                        <Form.Label>Hora (opcional)</Form.Label>
                        <Form.Control type="time" value={rango.fin} onChange={event => setRango(current => ({ ...current, fin: event.target.value }))} disabled={!rango.inicio} />
                        <Form.Text className="text-secondary">Una hora consulta ese bloque; sin hora se revisa el día completo.</Form.Text>
                    </Form.Group>
                    <div className="col-md-4 d-flex flex-wrap gap-2 pt-md-4">
                        <Button type="submit" disabled={loading}><i className="bi bi-search me-2" />Consultar</Button>
                        {rangoAplicado && <Button type="button" variant="outline-secondary" onClick={limpiarDisponibilidad} disabled={loading}>Ver stock operativo</Button>}
                    </div>
                </div>
                {rangoAplicado && <small className="text-secondary d-block mt-2">Las cantidades consideran reservas activas en {rango.fin ? "el horario seleccionado" : "todo el día"}.</small>}
            </Form>

            <Card className="shadow-sm mb-4">
                <Card.Body className="d-flex align-items-center gap-3">
                    <div
                        role="img"
                        aria-label={resumenStock.total
                            ? "Distribución del stock: " + segmentosStock.map(segmento => `${segmento.valor} ${segmento.etiqueta.toLowerCase()}`).join(", ")
                            : "Sin unidades registradas"}
                        style={{
                            width: 96,
                            height: 96,
                            flex: "0 0 96px",
                            borderRadius: "50%",
                            background: `conic-gradient(${graficoStock || "var(--bs-tertiary-bg) 0% 100%"})`,
                            display: "grid",
                            placeItems: "center"
                        }}
                    >
                        <span className="d-flex align-items-center justify-content-center rounded-circle fw-bold bg-body" style={{ width: 68, height: 68 }}>
                            {resumenStock.total || "—"}
                        </span>
                    </div>
                    <div className="flex-grow-1">
                        <h3 className="h6 fw-bold mb-1">Distribución del stock</h3>
                        <small className="text-secondary d-block mb-2">
                            {rangoAplicado
                                ? `Disponibilidad para ${new Date(rangoAplicado.inicio).toLocaleString("es-CL")} – ${new Date(rangoAplicado.fin).toLocaleString("es-CL")}.`
                                : "Inventario general; las reservas no se descuentan hasta consultar un período."}
                        </small>
                        <div className="d-flex flex-wrap gap-3">
                            {segmentosStock.map(segmento => (
                                <div key={segmento.clave} className="d-flex align-items-center gap-2 small">
                                    <span className="rounded-circle" aria-hidden="true" style={{ width: 10, height: 10, backgroundColor: segmento.color }} />
                                    <span>{segmento.etiqueta}: <strong>{segmento.valor}</strong></span>
                                </div>
                            ))}
                            {rangoAplicado && !resumenStock.reservadas && <small className="text-secondary">No hay unidades reservadas en el período consultado.</small>}
                        </div>
                    </div>
                </Card.Body>
            </Card>

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
                                <th>Equipo o material</th><th className="text-center">Stock</th><th>Estado operativo</th>
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
                                    <td className="text-center">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="d-flex align-items-baseline gap-2 text-nowrap">
                                                <span className="fw-semibold fs-5">{recurso.stockTotal}</span>
                                                <span className="text-secondary">{recurso.material?.unidad || "unidades"}</span>
                                            </div>
                                            <small className="text-secondary">
                                                {recurso.cantidadDisponible ?? (recurso.stockTotal - recurso.cantidadEnMantencion - recurso.cantidadPerdida)} disponibles
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        {recurso.cantidadEnMantencion > 0 && <Badge bg="warning" text="dark" className="me-1">{recurso.cantidadEnMantencion} en mantención</Badge>}
                                        {recurso.cantidadPerdida > 0 && <Badge bg="danger">{recurso.cantidadPerdida} perdidas</Badge>}
                                        {recurso.cantidadEnMantencion === 0 && recurso.cantidadPerdida === 0 && <Badge bg="success">Operativo</Badge>}
                                    </td>
                                    <td>{moneda.format(Number(recurso.precioUnitario))}</td>
                                    <td><Badge bg={recurso.activo ? "success" : "secondary"}>{recurso.activo ? "Activo" : "Inactivo"}</Badge></td>
                                    <td className="text-end text-nowrap">
                                        <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                                        <Button size="sm" variant="outline-secondary" onClick={() => setRecursoReservado(recurso)}>
                                            <i className="bi bi-calendar2-week me-1" />Agenda
                                        </Button>
                                        <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(recurso)}>
                                            <i className="bi bi-pencil me-1" />Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={recurso.activo ? "outline-warning" : "outline-success"}
                                            disabled={changingId === recurso.id}
                                            onClick={() => setRecursoEstado(recurso)}
                                        >
                                            {recurso.activo ? "Deshabilitar" : "Habilitar"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            disabled={changingId === recurso.id}
                                            onClick={() => setRecursoEliminar(recurso)}
                                        >
                                            <i className="bi bi-trash me-1" />Eliminar
                                        </Button>
                                        </div>
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
                title={recursoEstado?.activo ? "Deshabilitar recurso" : "Habilitar recurso"}
                confirmText={recursoEstado?.activo ? "Deshabilitar" : "Habilitar"}
                variant={recursoEstado?.activo ? "danger" : "success"}
            >
                {recursoEstado?.activo
                    ? <>¿Deshabilitar <strong>{recursoEstado.nombre}</strong>? Se conservará en presupuestos y eventos existentes.</>
                    : <>¿Habilitar <strong>{recursoEstado?.nombre}</strong> para nuevos presupuestos y eventos?</>}
            </ConfirmModal>

            <ConfirmModal
                show={Boolean(recursoEliminar)}
                onHide={() => setRecursoEliminar(null)}
                onConfirm={relacionesRecursoEliminar.length ? () => setRecursoEliminar(null) : confirmarEliminacion}
                title="Eliminar recurso definitivamente"
                confirmText={relacionesRecursoEliminar.length ? "Entendido" : "Eliminar definitivamente"}
                variant={relacionesRecursoEliminar.length ? "secondary" : "danger"}
                loading={Boolean(recursoEliminar && changingId === recursoEliminar.id)}
            >
                {relacionesRecursoEliminar.length
                    ? <><strong>{recursoEliminar?.nombre}</strong> no se puede eliminar porque tiene {relacionesRecursoEliminar.join(", ")} vinculados. Desactívalo para conservar el historial.</>
                    : <>¿Eliminar <strong>{recursoEliminar?.nombre}</strong> definitivamente? Esta acción no se puede deshacer.</>}
            </ConfirmModal>

            <ReservasRecursoModal
                recurso={recursoReservado}
                show={Boolean(recursoReservado)}
                onHide={() => setRecursoReservado(null)}
                onChanged={loadRecursos}
            />
        </>
    );
}
