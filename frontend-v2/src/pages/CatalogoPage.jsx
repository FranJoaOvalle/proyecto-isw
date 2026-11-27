import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Alert,
    Col,
    Container,
    Form,
    InputGroup,
    Row,
    Spinner
} from "react-bootstrap";

import CatalogoCard from "../components/catalogo/CatalogoCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getTiposEvento } from "../services/tipoEvento.service";

export default function CatalogoPage() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [tiposEvento, setTiposEvento] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const cargarCatalogo = async () => {
        try {
            setLoading(true);

            const data = await getTiposEvento();

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

        if (!texto)
            return tiposEvento;

        return tiposEvento.filter((tipoEvento) => {
            const nombre =
                tipoEvento.nombre?.toLowerCase() ?? "";

            const descripcion =
                tipoEvento.descripcion?.toLowerCase() ?? "";

            const incluye =
                tipoEvento.incluye?.toLowerCase() ?? "";

            return (
                nombre.includes(texto) ||
                descripcion.includes(texto) ||
                incluye.includes(texto)
            );
        });
    }, [tiposEvento, busqueda]);

    return (
        <Container className="py-5">
            <div className="mb-4">
                <h1 className="fw-bold mb-2">
                    Catálogo de eventos
                </h1>

                <p className="text-secondary mb-0">
                    Consulta los precios de referencia y elige el
                    servicio que quieres cotizar.
                </p>
            </div>

            <InputGroup className="mb-4">
                <InputGroup.Text>
                    <i className="bi bi-search" />
                </InputGroup.Text>

                <Form.Control
                    type="search"
                    value={busqueda}
                    onChange={(e) =>
                        setBusqueda(e.target.value)
                    }
                    placeholder="Buscar por tipo de evento"
                    aria-label="Buscar por tipo de evento"
                />
            </InputGroup>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner
                        animation="border"
                        role="status"
                    />

                    <p className="text-secondary mt-3 mb-0">
                        Cargando catálogo...
                    </p>
                </div>
            ) : tiposFiltrados.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-calendar-x fs-1 text-secondary" />

                    <h2 className="fs-5 fw-bold mt-3">
                        No se encontraron servicios
                    </h2>

                    <p className="text-secondary mb-0">
                        {busqueda
                            ? "Prueba con el nombre de un servicio, como matrimonio o graduación."
                            : "Aún no hay servicios publicados en el catálogo."}
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
                                onSolicitar={usuario?.rol === "CLIENTE"
                                    ? () => navigate("/cliente/solicitudes", {
                                        state: { tipoEventoId: tipoEvento.id }
                                    })
                                    : undefined}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}
