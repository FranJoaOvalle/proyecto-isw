import {
    Button,
    Card,
    Col,
    Container,
    Row
} from "react-bootstrap";

import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";

import "./ClientePage.css";

const getNombreCliente = (usuario) => {
    const cliente = usuario?.cliente;

    if (!cliente) return "";

    if (cliente.tipo === "PERSONA")
        return cliente.persona?.nombres ?? "";

    return cliente.empresa?.razonSocial ?? "";
};

const secciones = [
    {
        titulo: "Mis solicitudes",
        descripcion: "Consulta el estado de tus solicitudes y las respuestas de administración.",
        icono: "file-earmark-text",
        ruta: "/cliente/solicitudes",
        accion: "Ver solicitudes"
    },
    {
        titulo: "Compra / Contrato",
        descripcion: "Revisa los presupuestos recibidos y confirma la contratación de tus eventos.",
        icono: "receipt",
        ruta: "/cliente/compra",
        accion: "Ver propuestas"
    },
    {
        titulo: "Mis eventos",
        descripcion: "Consulta la planificación y el estado de tus eventos contratados.",
        icono: "calendar-event",
        ruta: "/cliente/eventos",
        accion: "Ver eventos"
    }
];

function AccesoDirecto({ titulo, descripcion, icono, ruta, accion }) {
    return (
        <Card
            as={Link}
            to={ruta}
            className="cliente-acceso h-100 text-decoration-none"
        >
            <Card.Body className="d-flex flex-column p-4">
                <div className="cliente-icono mb-3">
                    <i
                        className={`bi bi-${icono}`}
                        aria-hidden="true"
                    />
                </div>

                <h5 className="fw-bold mb-2">
                    {titulo}
                </h5>

                <p className="text-secondary small mb-4">
                    {descripcion}
                </p>

                <div className="text-primary fw-semibold small mt-auto d-flex align-items-center justify-content-between">
                    {accion}

                    <i className="bi bi-arrow-right" />
                </div>
            </Card.Body>
        </Card>
    );
}

export default function ClientePage() {
    const { usuario } = useAuth();

    const nombre = getNombreCliente(usuario);

    const fecha = new Date().toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Santiago"
    });

    return (
        <Container fluid className="cliente-dashboard py-4 px-3 px-xl-4">
            <PageHeader
                title={nombre ? `Hola, ${nombre}` : "Mi cuenta"}
                description="Panel de cliente"
            />

            <div className="cliente-banner mb-4">
                <div>
                    <div className="cliente-fecha text-secondary small mb-2">
                        {fecha}
                    </div>

                    <h4 className="fw-bold mb-2">
                        ¿Necesitas organizar un evento?
                    </h4>

                    <p className="text-secondary mb-0">
                        Consulta los servicios disponibles y
                        solicita un presupuesto desde el catálogo.
                    </p>
                </div>

                <Button
                    as={Link}
                    to="/catalogo"
                    className="flex-shrink-0"
                >
                    <i className="bi bi-shop-window me-2" />
                    Ver catálogo
                </Button>
            </div>

            <h5 className="fw-bold mb-3">
                Gestión de eventos
            </h5>

            <Row className="g-3 mb-5">
                {secciones.map(seccion => (
                    <Col md={6} xl={4} key={seccion.ruta}>
                        <AccesoDirecto {...seccion} />
                    </Col>
                ))}
            </Row>

            <h5 className="fw-bold mb-3">
                Mi cuenta
            </h5>

            <Card className="cliente-cuenta">
                <Card.Body className="p-0">
                    <Link
                        to="/perfil"
                        className="cliente-cuenta-link"
                    >
                        <div className="cliente-icono">
                            <i className="bi bi-person" />
                        </div>

                        <div className="flex-grow-1">
                            <div className="fw-semibold">
                                Mi perfil
                            </div>

                            <small className="text-secondary">
                                Datos personales y configuración
                                de la cuenta.
                            </small>
                        </div>

                        <i className="bi bi-chevron-right text-secondary" />
                    </Link>
                </Card.Body>
            </Card>
        </Container>
    );
}