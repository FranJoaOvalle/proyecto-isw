import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

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
            <div className="mb-5">
                <h1 className="fw-bold">
                    {nombre ? `Hola, ${nombre}` : "Mi cuenta"}
                </h1>

                <p className="text-secondary mb-0">
                    Gestiona tu cuenta y revisa las opciones disponibles.
                </p>
            </div>

            <Row className="g-4">
                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title className="fw-bold">
                                Catálogo
                            </Card.Title>

                            <Card.Text className="text-secondary">
                                Revisa los tipos de eventos y servicios
                                disponibles.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/catalogo"
                            >
                                Ver catálogo
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title className="fw-bold">
                                Mi perfil
                            </Card.Title>

                            <Card.Text className="text-secondary">
                                Revisa y actualiza los datos asociados a tu
                                cuenta.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/perfil"
                                variant="outline-primary"
                            >
                                Administrar perfil
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title className="fw-bold">
                                Compra / Contrato
                            </Card.Title>

                            <Card.Text className="text-secondary">
                                Inicia el proceso de compra o contratación de un evento.
                            </Card.Text>

                            <Button
                                as={Link}
                                to="/cliente/compra"
                            >
                                Ir a Compra / Contrato
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}