import ConfirmModal from "../../components/ConfirmModal";
import ActionButton from "../../components/ActionButton";
import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Container,
    Form,
    Spinner,
    Table
} from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import TableToolbar from "../../components/admin/TableToolbar";
import EncuestaFormularioModal from "../../components/encuestas/EncuestaFormularioModal";
import EncuestaPreviewModal from "../../components/encuestas/EncuestaPreviewModal";

import {
    getEncuestas,
    cambiarEstadoEncuesta,
    establecerEncuestaPredeterminada
} from "../../services/encuesta.service";

import {
    TIPOS_ENCUESTA
} from "../../components/encuestas/encuesta.utils";

export default function EncuestasPage() {
    const [encuestas, setEncuestas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendiente, setPendiente] = useState(null);
    const [changingId, setChangingId] = useState(null);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [tipo, setTipo] = useState("TODOS");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [encuestaEditando, setEncuestaEditando] = useState(null);
    const [encuestaPreview, setEncuestaPreview] = useState(null);
    const [predeterminandoId, setPredeterminandoId] = useState(null);

    const loadEncuestas = async () => {
        try {
            const data = await getEncuestas();
            setEncuestas(data);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar las encuestas."
            );
        } finally {
            setLoading(false);
        }
    };

    const esPredeterminada = (encuesta) =>
        encuesta.predeterminadas?.length > 0;

    const handlePredeterminada = async (encuesta) => {
        setError("");
        setPredeterminandoId(encuesta.id);

        try {
            await establecerEncuestaPredeterminada(encuesta.id);
            await loadEncuestas();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                error.response?.data?.message ??
                "No fue posible establecer la encuesta predeterminada."
            );
        } finally {
            setPredeterminandoId(null);
        }
    };

    useEffect(() => {
        loadEncuestas();
    }, []);

    const handleEstado = async (encuesta) => {
        if (!encuesta || changingId !== null || predeterminandoId !== null || esPredeterminada(encuesta)) return;
        setError("");
        setChangingId(encuesta.id);

        try {
            await cambiarEstadoEncuesta(
                encuesta.id,
                !encuesta.activo
            );

            await loadEncuestas();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cambiar el estado."
            );
        } finally {
            setPendiente(null);
            setChangingId(null);
        }
    };

    const encuestasFiltradas = encuestas.filter((encuesta) => {
        const termino = search.trim().toLowerCase();

        const coincideBusqueda =
            !termino ||
            encuesta.nombre.toLowerCase().includes(termino) ||
            (encuesta.descripcion ?? "")
                .toLowerCase().includes(termino);

        const coincideTipo =
            tipo === "TODOS" ||
            encuesta.tipo === tipo;

        const coincideEstado =
            estado === "TODOS" ||
            (estado === "ACTIVOS" && encuesta.activo) ||
            (estado === "INACTIVOS" && !encuesta.activo);

        return coincideBusqueda &&
            coincideTipo &&
            coincideEstado;
    });

    const abrirCreacion = () => {
        setEncuestaEditando(null);
        setMostrarFormulario(true);
    };

    const abrirEdicion = (encuesta) => {
        setEncuestaEditando(encuesta);
        setMostrarFormulario(true);
    };

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
        setEncuestaEditando(null);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <PageHeader
                title="Encuestas"
                description="Administra los formularios de satisfacción y evaluación de desempeño."
            >
                <Button onClick={abrirCreacion}>
                    <i className="bi bi-plus-lg me-2" />
                    Nueva encuesta
                </Button>
            </PageHeader>

            {error && (
                <Alert variant="danger" dismissible
                       onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar encuestas..."
                estado={estado}
                onEstadoChange={setEstado}
                opcionesEstado={{
                    TODOS: "Todos",
                    ACTIVOS: "Activas",
                    INACTIVOS: "Inactivas"
                }}
            >
                <Form.Select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    style={{ maxWidth: 260 }}
                    aria-label="Tipo de encuesta"
                >
                    <option value="TODOS">
                        Todos los tipos
                    </option>

                    {Object.entries(TIPOS_ENCUESTA).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        )
                    )}
                </Form.Select>
            </TableToolbar>

            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead>
                    <tr>
                        <th>Encuesta</th>
                        <th>Tipo</th>
                        <th>Preguntas</th>
                        <th>Estado</th>
                        <th className="text-end">
                            Acciones
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {encuestasFiltradas.map((encuesta) => (
                        <tr key={encuesta.id}>
                            <td>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="fw-semibold">
                                        {encuesta.nombre}
                                     </span>

                                    {esPredeterminada(encuesta) && (
                                        <Badge bg="warning" text="dark">
                                            <i className="bi bi-star-fill me-1" />
                                            Predeterminada
                                        </Badge>
                                    )}
                                </div>

                                <small className="text-secondary">
                                    {encuesta.descripcion || "Sin descripción"}
                                </small>
                            </td>

                            <td>
                                <Badge bg={
                                    encuesta.tipo === "CLIENTE_EVENTO"
                                        ? "primary"
                                        : "secondary"
                                }>
                                    {TIPOS_ENCUESTA[encuesta.tipo]}
                                </Badge>
                            </td>

                            <td>
                                {encuesta.preguntas.length}
                            </td>

                            <td>
                                <Badge bg={
                                    encuesta.activo
                                        ? "success"
                                        : "secondary"
                                }>
                                    {encuesta.activo
                                        ? "Activa"
                                        : "Inactiva"}
                                </Badge>
                            </td>
                            <td className="text-end">
                                <div className="table-actions">
                                    {!esPredeterminada(encuesta) && encuesta.activo && (
                                        <ActionButton
                                            icon="bi-star"
                                            label="Establecer como predeterminada"
                                            variant="outline-warning"
                                            disabled={predeterminandoId !== null || changingId !== null}
                                            onClick={() => handlePredeterminada(encuesta)}
                                            loading={predeterminandoId === encuesta.id}
                                        />
                                    )}

                                    <ActionButton
                                        icon="bi-eye"
                                        label="Previsualizar encuesta"
                                        variant="outline-secondary"
                                        onClick={() => setEncuestaPreview(encuesta)}
                                    />

                                    <ActionButton
                                        icon="bi-pencil"
                                        label="Editar encuesta"
                                        variant="outline-primary"
                                        onClick={() => abrirEdicion(encuesta)}
                                    />

                                    <ActionButton
                                        icon={encuesta.activo ? "bi-slash-circle" : "bi-check-circle"}
                                        label={encuesta.activo ? "Desactivar encuesta" : "Activar encuesta"}
                                        variant={encuesta.activo ? "outline-danger" : "outline-success"}
                                        disabled={changingId !== null || predeterminandoId !== null || esPredeterminada(encuesta)}
                                        onClick={() => encuesta.activo ? setPendiente(encuesta) : handleEstado(encuesta)}
                                        loading={changingId === encuesta.id}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}

                    {encuestasFiltradas.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="text-center text-secondary py-4"
                            >
                                No se encontraron encuestas.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            {encuestaPreview && (
                <EncuestaPreviewModal
                    encuesta={encuestaPreview}
                    onClose={() => setEncuestaPreview(null)}
                />
            )}

            {mostrarFormulario && (
                <EncuestaFormularioModal
                    encuesta={encuestaEditando}
                    onClose={cerrarFormulario}
                    onSaved={loadEncuestas}
                />
            )}
            <ConfirmModal
                show={Boolean(pendiente)}
                onHide={() => setPendiente(null)}
                onConfirm={() => handleEstado(pendiente)}
                loading={changingId !== null}
                title="Desactivar encuesta"
                confirmText="Desactivar encuesta"
            >
                La encuesta <strong>{pendiente?.nombre}</strong> dejará de estar disponible para nuevas evaluaciones. Podrás volver a activarla.
            </ConfirmModal>
        </Container>
    );
}