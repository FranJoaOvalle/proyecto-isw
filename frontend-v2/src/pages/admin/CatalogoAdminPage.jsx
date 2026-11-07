import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Alert,
    Button,
    Col, Container,
    Form,
    Modal,
    Row,
    Spinner,
    Toast,
    ToastContainer
} from "react-bootstrap";

import CatalogoCard from "../../components/catalogo/CatalogoCard";
import TableToolbar from "../../components/admin/TableToolbar";
import ConfirmModal from "../../components/ConfirmModal";

import {
    createTipoEvento,
    deleteTipoEvento,
    getTiposEvento,
    updateTipoEvento,
    updateTipoEventoEstado
} from "../../services/tipoEvento.service";

const initialFormData = {
    nombre: "",
    descripcion: "",
    modalidadPrecio: "FIJO",
    precioBase: "",
    tarifaHora: "",
    incluye: "",
    cantidadPersonasBase: "",
    imagen_url: ""
};

export default function CatalogoAdminPage() {
    const [tiposEvento, setTiposEvento] = useState([]);

    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("TODOS");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [selectedTipoEvento, setSelectedTipoEvento] =
        useState(null);

    const [formData, setFormData] =
        useState(initialFormData);

    const [validated, setValidated] = useState(false);

    const [tipoEventoEstado, setTipoEventoEstado] =
        useState(null);

    const [cambiandoEstado, setCambiandoEstado] =
        useState(false);

    const [tipoEventoEliminar, setTipoEventoEliminar] =
        useState(null);
    const [eliminando, setEliminando] = useState(false);

    const cargarCatalogo = async () => {
        try {
            setLoading(true);

            const data = await getTiposEvento(true);

            setTiposEvento(data);
            setError("");
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar el catálogo."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCatalogo();
    }, []);

    const tiposFiltrados = useMemo(() => {
        const texto = busqueda
            .trim()
            .toLowerCase();

        return tiposEvento.filter((tipoEvento) => {
            const nombre =
                tipoEvento.nombre?.toLowerCase() ?? "";

            const descripcion =
                tipoEvento.descripcion?.toLowerCase() ?? "";

            const incluye =
                tipoEvento.incluye?.toLowerCase() ?? "";

            const coincideBusqueda =
                !texto ||
                nombre.includes(texto) ||
                descripcion.includes(texto) ||
                incluye.includes(texto);

            const coincideEstado =
                estado === "TODOS" ||
                (
                    estado === "ACTIVOS" &&
                    tipoEvento.activo
                ) ||
                (
                    estado === "INACTIVOS" &&
                    !tipoEvento.activo
                );

            return (
                coincideBusqueda &&
                coincideEstado
            );
        });
    }, [
        tiposEvento,
        busqueda,
        estado
    ]);

    const abrirCrear = () => {
        setSelectedTipoEvento(null);
        setFormData(initialFormData);
        setValidated(false);
        setError("");
        setShowForm(true);
    };

    const abrirEditar = (tipoEvento) => {
        setSelectedTipoEvento(tipoEvento);

        setFormData({
            nombre: tipoEvento.nombre ?? "",
            descripcion: tipoEvento.descripcion ?? "",
            modalidadPrecio: tipoEvento.modalidadPrecio ?? "FIJO",
            precioBase: tipoEvento.precioBase ?? "",
            tarifaHora: tipoEvento.tarifaHora ?? "",
            incluye: tipoEvento.incluye ?? "",
            cantidadPersonasBase:
                tipoEvento.cantidadPersonasBase ?? "",
            imagen_url: tipoEvento.imagen_url ?? ""
        });

        setValidated(false);
        setError("");
        setShowForm(true);
    };

    const cerrarFormulario = () => {
        if (saving)
            return;

        setShowForm(false);
        setSelectedTipoEvento(null);
        setValidated(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formElement = e.currentTarget;

        if (!formElement.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setValidated(true);
        setSaving(true);

        try {
            const data = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                modalidadPrecio: formData.modalidadPrecio,
                precioBase: formData.modalidadPrecio === "FIJO"
                    ? Number(formData.precioBase)
                    : null,
                tarifaHora: formData.modalidadPrecio === "POR_HORA"
                    ? Number(formData.tarifaHora)
                    : null,
                incluye: formData.incluye.trim() || null,
                cantidadPersonasBase: Number(formData.cantidadPersonasBase),
                imagen_url: formData.imagen_url.trim() || null
            };

            if (!selectedTipoEvento) {
                data.activo = true;
            }

            const estabaEditando = Boolean(selectedTipoEvento);

            if (estabaEditando) {
                await updateTipoEvento(
                    selectedTipoEvento.id,
                    data
                );
            } else {
                await createTipoEvento(data);
            }

            setMensaje(estabaEditando
                ? "Tipo de evento actualizado correctamente."
                : "Tipo de evento creado correctamente.");

            setShowForm(false);
            setSelectedTipoEvento(null);

            await cargarCatalogo();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible guardar el evento."
            );
        } finally {
            setSaving(false);
        }
    };

    const abrirCambioEstado = (tipoEvento) => {
        setTipoEventoEstado(tipoEvento);
    };

    const cerrarCambioEstado = () => {
        if (cambiandoEstado)
            return;

        setTipoEventoEstado(null);
    };

    const handleCambiarEstado = async () => {
        if (!tipoEventoEstado)
            return;

        try {
            setCambiandoEstado(true);

            const activar = !tipoEventoEstado.activo;
            await updateTipoEventoEstado(tipoEventoEstado.id, activar);

            setTipoEventoEstado(null);
            setMensaje(activar
                ? "Tipo de evento activado correctamente."
                : "Tipo de evento desactivado correctamente.");

            await cargarCatalogo();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cambiar el estado del evento."
            );
        } finally {
            setCambiandoEstado(false);
        }
    };

    const handleEliminarFisico = async () => {
        if (!tipoEventoEliminar) return;

        try {
            setEliminando(true);
            await deleteTipoEvento(tipoEventoEliminar.id);
            setTipoEventoEliminar(null);
            setMensaje("Tipo de evento eliminado correctamente.");
            await cargarCatalogo();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible eliminar el tipo de evento."
            );
            setTipoEventoEliminar(null);
        } finally {
            setEliminando(false);
        }
    };

    return (
        <Container className="py-5">
            <ToastContainer
                position="bottom-end"
                className="position-fixed p-3"
                style={{ zIndex: 1080 }}
            >
                {mensaje && (
                    <Toast
                        key={mensaje}
                        bg="success"
                        onClose={() => setMensaje("")}
                        delay={4500}
                        autohide
                        role="status"
                        aria-live="polite"
                    >
                        <Toast.Header className="text-bg-success border-0">
                            <i className="bi bi-check-circle-fill me-2" />
                            <strong className="me-auto">Listo</strong>
                        </Toast.Header>
                        <Toast.Body className="text-white">{mensaje}</Toast.Body>
                    </Toast>
                )}
            </ToastContainer>

            <div className="mb-4 d-flex flex-column flex-md-row justify-content-between gap-3">
                <div>
                    <h1 className="fw-bold mb-2">
                        Catálogo de eventos
                    </h1>

                    <p className="text-secondary mb-0">
                        Administra los tipos de eventos
                        disponibles para los clientes.
                    </p>
                </div>

                <div className="align-self-md-end">
                    <Button onClick={abrirCrear}>
                        <i className="bi bi-plus-lg me-2" />
                        Nuevo evento
                    </Button>
                </div>
            </div>

            <TableToolbar
                search={busqueda}
                onSearchChange={setBusqueda}
                searchPlaceholder="Buscar evento..."
                estado={estado}
                onEstadoChange={setEstado}
            />

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />

                    <p className="text-secondary mt-3 mb-0">
                        Cargando catálogo...
                    </p>
                </div>
            ) : tiposFiltrados.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-calendar-x fs-1 text-secondary" />

                    <h2 className="fs-5 fw-bold mt-3">
                        No se encontraron eventos
                    </h2>

                    <p className="text-secondary mb-0">
                        No hay eventos que coincidan
                        con los filtros seleccionados.
                    </p>
                </div>
            ) : (
                <Row className="g-4">
                    {tiposFiltrados.map((tipoEvento) => (
                        <Col
                            key={tipoEvento.id}
                            md={6}
                            xl={4}
                        >
                            <CatalogoCard
                                tipoEvento={tipoEvento}
                                admin
                                onEditar={() =>
                                    abrirEditar(tipoEvento)
                                }
                                onCambiarEstado={() =>
                                    abrirCambioEstado(
                                        tipoEvento
                                    )
                                }
                                onEliminarFisico={() =>
                                    setTipoEventoEliminar(tipoEvento)
                                }
                            />
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                show={showForm}
                onHide={cerrarFormulario}
                centered
            >
                <Form
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>
                            {selectedTipoEvento
                                ? "Editar evento"
                                : "Nuevo evento"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3 position-relative">
                            <Form.Label htmlFor="nombre">
                                Nombre
                            </Form.Label>

                            <Form.Control
                                id="nombre"
                                name="nombre"
                                type="text"
                                value={formData.nombre}
                                onChange={handleChange}
                                minLength={2}
                                maxLength={100}
                                required
                                disabled={saving}
                                placeholder="Ej. Matrimonio"
                            />

                            <Form.Control.Feedback type="invalid" tooltip>
                                Ingresa un nombre de al menos 2 caracteres.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="modalidadPrecio">
                                Modalidad de precio
                            </Form.Label>

                            <Form.Select
                                id="modalidadPrecio"
                                name="modalidadPrecio"
                                value={formData.modalidadPrecio}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="FIJO">Precio fijo</option>
                                <option value="POR_HORA">Tarifa por hora</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="descripcion">
                                Descripción
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={4}
                                minLength={10}
                                maxLength={500}
                                required
                                disabled={saving}
                                placeholder="Descripción del tipo de evento..."
                            />

                            <Form.Control.Feedback type="invalid">
                                Ingresa una descripción de al menos 10 caracteres.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="incluye">
                                Incluye habitualmente (opcional)
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                id="incluye"
                                name="incluye"
                                value={formData.incluye}
                                onChange={handleChange}
                                rows={3}
                                maxLength={2000}
                                disabled={saving}
                                placeholder="Ej. sonido básico, iluminación y apoyo técnico"
                            />

                            <Form.Text className="text-muted">
                                Información referencial; los elementos finales se confirman en el presupuesto.
                            </Form.Text>
                        </Form.Group>

                        {formData.modalidadPrecio === "FIJO" && (
                            <Form.Group className="mb-3">
                                <Form.Label htmlFor="precioBase">
                                    Precio base
                                </Form.Label>

                                <Form.Control
                                    id="precioBase"
                                    name="precioBase"
                                    type="number"
                                    value={formData.precioBase}
                                    onChange={handleChange}
                                    min={0.01}
                                    step="any"
                                    required
                                    disabled={saving}
                                    placeholder="500000"
                                />

                                <Form.Control.Feedback type="invalid">
                                    Ingresa un precio mayor que cero.
                                </Form.Control.Feedback>
                            </Form.Group>
                        )}

                        {formData.modalidadPrecio === "POR_HORA" && (
                            <Form.Group className="mb-3">
                                <Form.Label htmlFor="tarifaHora">
                                    Tarifa por hora
                                </Form.Label>

                                <Form.Control
                                    id="tarifaHora"
                                    name="tarifaHora"
                                    type="number"
                                    value={formData.tarifaHora}
                                    onChange={handleChange}
                                    min={0.01}
                                    step="0.01"
                                    required
                                    disabled={saving}
                                    placeholder="Ej. 25000"
                                />

                                <Form.Text className="text-muted">
                                    El precio de este tipo se cotiza según la duración del evento.
                                </Form.Text>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="cantidadPersonasBase">
                                Cantidad de personas base
                            </Form.Label>

                            <Form.Control
                                id="cantidadPersonasBase"
                                name="cantidadPersonasBase"
                                type="number"
                                value={formData.cantidadPersonasBase}
                                onChange={handleChange}
                                min={1}
                                step={1}
                                required
                                disabled={saving}
                                placeholder="Ej. 50"
                            />

                            <Form.Control.Feedback type="invalid">
                                Ingresa una cantidad entera mayor que cero.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="imagen_url">
                                URL de la imagen
                            </Form.Label>

                            <Form.Control
                                id="imagen_url"
                                name="imagen_url"
                                type="url"
                                value={formData.imagen_url}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="https://ejemplo.com/imagen.jpg"
                            />

                            <Form.Text className="text-muted">
                                Pega un enlace directo a una imagen.
                            </Form.Text>
                        </Form.Group>

                        {formData.imagen_url.trim() && (
                            <div className="mt-3">
                                <Form.Label>Vista previa</Form.Label>

                                <div
                                    className="border rounded overflow-hidden"
                                    style={{ height: "220px" }}
                                >
                                    <img
                                        src={formData.imagen_url.trim()}
                                        alt="Vista previa del tipo de evento"
                                        className="w-100 h-100"
                                        style={{
                                            objectFit: "cover",
                                            display: "block"
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                        onLoad={(e) => {
                                            e.currentTarget.style.display = "block";
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg me-2" />

                                    {selectedTipoEvento
                                        ? "Guardar cambios"
                                        : "Crear evento"}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal
                show={!!tipoEventoEstado}
                onHide={cerrarCambioEstado}
                centered
            >
                <Modal.Header
                    closeButton={!cambiandoEstado}
                >
                    <Modal.Title>
                        {tipoEventoEstado?.activo
                            ? "Desactivar evento"
                            : "Activar evento"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {tipoEventoEstado?.activo ? (
                        <p className="mb-0">
                            ¿Deseas desactivar{" "}
                            <strong>
                                {tipoEventoEstado?.nombre}
                            </strong>
                            ? Dejará de aparecer en el
                            catálogo público.
                        </p>
                    ) : (
                        <p className="mb-0">
                            ¿Deseas activar{" "}
                            <strong>
                                {tipoEventoEstado?.nombre}
                            </strong>
                            ? Volverá a aparecer en el
                            catálogo público.
                        </p>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={cerrarCambioEstado}
                        disabled={cambiandoEstado}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant={
                            tipoEventoEstado?.activo
                                ? "danger"
                                : "success"
                        }
                        onClick={handleCambiarEstado}
                        disabled={cambiandoEstado}
                    >
                        {cambiandoEstado ? (
                            <>
                                <Spinner
                                    size="sm"
                                    className="me-2"
                                />
                                Guardando...
                            </>
                        ) : tipoEventoEstado?.activo ? (
                            "Desactivar"
                        ) : (
                            "Activar"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                show={!!tipoEventoEliminar}
                onHide={() => !eliminando && setTipoEventoEliminar(null)}
                onConfirm={handleEliminarFisico}
                title="Eliminar tipo de evento"
                confirmText="Sí, eliminar definitivamente"
                loading={eliminando}
            >
                <p>
                    ¿Eliminar permanentemente <strong>{tipoEventoEliminar?.nombre}</strong>?
                </p>
                <p className="mb-0">
                    Solo se puede eliminar si no tiene eventos ni presupuestos relacionados. Esta acción no se puede deshacer.
                </p>
            </ConfirmModal>

            <Modal
                show={Boolean(error)}
                onHide={() => setError("")}
                centered
                aria-labelledby="tipo-evento-error-title"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="tipo-evento-error-title">
                        <i className="bi bi-exclamation-triangle-fill text-danger me-2" />
                        No se pudo completar la acción
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Alert variant="danger" className="mb-0">
                        {error}
                    </Alert>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setError("")}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
