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
    Spinner
} from "react-bootstrap";

import CatalogoCard from "../../components/catalogo/CatalogoCard";
import TableToolbar from "../../components/admin/TableToolbar";

import {
    createTipoEvento,
    getTiposEvento,
    updateTipoEvento,
    updateTipoEventoEstado
} from "../../services/tipoEvento.service";

const initialFormData = {
    nombre: "",
    descripcion: "",
    precioBase: ""
};

export default function CatalogoAdminPage() {
    const [tiposEvento, setTiposEvento] = useState([]);

    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("TODOS");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

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

            const coincideBusqueda =
                !texto ||
                nombre.includes(texto) ||
                descripcion.includes(texto);

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
            descripcion:
                tipoEvento.descripcion ?? "",
            precioBase:
                tipoEvento.precioBase ?? ""
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
                nombre:
                    formData.nombre.trim(),

                descripcion:
                    formData.descripcion.trim() || null,

                precioBase:
                    Number(formData.precioBase)
            };

            if (selectedTipoEvento) {
                await updateTipoEvento(
                    selectedTipoEvento.id,
                    data
                );
            } else {
                await createTipoEvento(data);
            }

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

            await updateTipoEventoEstado(
                tipoEventoEstado.id,
                !tipoEventoEstado.activo
            );

            setTipoEventoEstado(null);

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

    return (
        <Container className="py-5">
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

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

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

                            <Form.Control.Feedback
                                type="invalid"
                                tooltip
                            >
                                Ingresa un nombre de al menos
                                2 caracteres.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3 position-relative">
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
                                maxLength={500}
                                disabled={saving}
                                placeholder="Descripción del tipo de evento..."
                            />
                        </Form.Group>

                        <Form.Group className="position-relative">
                            <Form.Label htmlFor="precioBase">
                                Precio base
                            </Form.Label>

                            <Form.Control
                                id="precioBase"
                                name="precioBase"
                                type="number"
                                value={formData.precioBase}
                                onChange={handleChange}
                                min={0}
                                step={1}
                                required
                                disabled={saving}
                                placeholder="500000"
                            />

                            <Form.Control.Feedback
                                type="invalid"
                                tooltip
                            >
                                Ingresa un precio base válido.
                            </Form.Control.Feedback>
                        </Form.Group>
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
        </Container>
    );
}