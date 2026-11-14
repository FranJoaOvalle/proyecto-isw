import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";

const getNombreCliente = (usuario) => {
    const cliente = usuario?.cliente;

    if (!cliente) return "";

    if (cliente.tipo === "PERSONA")
        return cliente.persona?.nombres ?? "";

    return cliente.empresa?.razonSocial ?? "";
};

export default function ClientePage() {
    const { usuario } = useAuth();

    const nombre = getNombreCliente(usuario);

    return (
        <Container className="py-5">
            <PageHeader
                title={nombre ? `Hola, ${nombre}` : "Mi cuenta"}
                description="Gestiona tus solicitudes, propuestas y eventos desde un solo lugar."
            />

            <Row className="g-4">
                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column p-4">
                            <i className="bi bi-file-earmark-text text-primary fs-4 mb-3" aria-hidden="true" />
                            <Card.Title className="fw-bold">Mis solicitudes</Card.Title>
                            <Card.Text className="text-body-secondary mb-4">
                                Solicita un evento y consulta su revisión o contratación.
                            </Card.Text>
                            <Button as={Link} to="/cliente/solicitudes" className="mt-auto align-self-start">
                                Ver solicitudes
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column p-4">
                            <i className="bi bi-shop text-primary fs-4 mb-3" aria-hidden="true" />
                            <Card.Title className="fw-bold">
                                Catálogo
                            </Card.Title>

                            <Card.Text className="text-body-secondary mb-4">
                                Revisa los tipos de eventos y servicios
                                disponibles.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/catalogo"
                                variant="outline-primary"
                                className="mt-auto align-self-start"
                            >
                                Ver catálogo
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column p-4">
                            <i className="bi bi-person text-primary fs-4 mb-3" aria-hidden="true" />
                            <Card.Title className="fw-bold">
                                Mi perfil
                            </Card.Title>

                            <Card.Text className="text-body-secondary mb-4">
                                Revisa y actualiza los datos asociados a tu
                                cuenta.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/perfil"
                                variant="outline-primary"
                                className="mt-auto align-self-start"
                            >
                                Administrar perfil
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column p-4">
                            <i className="bi bi-receipt text-primary fs-4 mb-3" aria-hidden="true" />
                            <Card.Title className="fw-bold">
                                Compra / Contrato
                            </Card.Title>

                            <Card.Text className="text-body-secondary mb-4">
                                Revisa las propuestas recibidas y confirma tu contratación.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/cliente/compra"
                                className="mt-auto align-self-start"
                            >
                                Ver propuestas
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column p-4">
                            <i className="bi bi-calendar-event text-primary fs-4 mb-3" aria-hidden="true" />
                            <Card.Title className="fw-bold">
                                Mis eventos
                            </Card.Title>

                            <Card.Text className="text-body-secondary mb-4">
                                Revisa los eventos que has contratado y su estado actual.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/cliente/eventos"
                                variant="outline-primary"
                                className="mt-auto align-self-start"
                            >
                                Ver mis eventos
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
