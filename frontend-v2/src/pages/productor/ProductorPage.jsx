import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Row
} from "react-bootstrap";

import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";

import "../cliente/ClientePage.css";

const secciones = [
    {
        titulo: "Mi agenda",
        descripcion: "Consulta tus eventos y actividades programadas.",
        icono: "calendar-week",
        ruta: "/productor/agenda",
        accion: "Ver agenda"
    },
    {
        titulo: "Eventos asignados",
        descripcion: "Revisa la planificación, los recursos y las actividades de tus eventos.",
        icono: "calendar-event",
        ruta: "/productor/eventos",
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

function DatoCuenta({ titulo, valor, icono }) {
    return (
        <div className="d-flex align-items-center gap-3">
            <i
                className={`bi bi-${icono} text-secondary fs-5`}
                aria-hidden="true"
            />

            <div className="flex-grow-1 overflow-hidden">
                <div className="text-secondary small">
                    {titulo}
                </div>

                <div className="fw-medium text-break">
                    {valor}
                </div>
            </div>
        </div>
    );
}

export default function ProductorPage() {
    const { usuario } = useAuth();

    const productor = usuario?.productor;
    const nombre = productor?.nombres ?? "";

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
                title={nombre ? `Hola, ${nombre}` : "Panel del productor"}
                description="Panel de producción"
            />

            <div className="cliente-banner mb-4">
                <div>
                    <div className="cliente-fecha text-secondary small mb-2">
                        {fecha}
                    </div>

                    <h4 className="fw-bold mb-2">
                        Agenda de trabajo
                    </h4>

                    <p className="text-secondary mb-0">
                        Revisa tus horarios y quién está a cargo de cada
                        actividad.
                    </p>
                </div>

                <Button
                    as={Link}
                    to="/productor/agenda"
                    variant="outline-primary"
                    className="flex-shrink-0"
                >
                    <i className="bi bi-calendar-week me-2" />
                    Abrir agenda
                </Button>
            </div>

            <Row className="g-4">
                <Col xl={8}>
                    <h5 className="fw-bold mb-3">
                        Operaciones
                    </h5>

                    <Row className="g-3">
                        {secciones.map(seccion => (
                            <Col md={6} key={seccion.ruta}>
                                <AccesoDirecto {...seccion} />
                            </Col>
                        ))}
                    </Row>
                </Col>

                <Col xl={4}>
                    <h5 className="fw-bold mb-3">
                        Mi cuenta
                    </h5>

                    <Card className="cliente-cuenta">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="cliente-icono">
                                    <i className="bi bi-person" />
                                </div>

                                <div className="flex-grow-1">
                                    <div className="fw-bold">
                                        {productor
                                            ? `${productor.nombres} ${productor.apellidos}`
                                            : "Productor"}
                                    </div>

                                    <small className="text-secondary">
                                        Productor
                                    </small>
                                </div>

                                {usuario && (
                                    <Badge
                                        bg={usuario.activo
                                            ? "success"
                                            : "secondary"}
                                    >
                                        {usuario.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </Badge>
                                )}
                            </div>

                            <hr />

                            <div className="d-flex flex-column gap-3 my-4">
                                <DatoCuenta
                                    titulo="Correo electrónico"
                                    valor={usuario?.email ?? "No registrado"}
                                    icono="envelope"
                                />

                                <DatoCuenta
                                    titulo="Teléfono"
                                    valor={productor?.telefono || "No registrado"}
                                    icono="telephone"
                                />
                            </div>

                            <Button
                                as={Link}
                                to="/productor/perfil"
                                variant="outline-secondary"
                                className="w-100"
                            >
                                Editar perfil
                                <i className="bi bi-arrow-right ms-2" />
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}