import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

export default function ProductorPage() {
    const { usuario } = useAuth();

    const productor = usuario?.productor;
    const nombre = productor?.nombres ?? "";

    return (
        <Container className="py-5">
            <div className="mb-5">
                <h1 className="fw-bold">
                    {nombre ? `Hola, ${nombre}` : "Panel del productor"}
                </h1>

                <p className="text-secondary mb-0">
                    Gestiona tu cuenta y revisa tus operaciones asignadas.
                </p>
            </div>

            <Row className="g-4 mb-4">
                <Col md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title className="fw-bold">
                                Eventos asignados
                            </Card.Title>

                            <Card.Text className="text-secondary">
                                Aquí podrás revisar y gestionar los eventos
                                que tengas asignados.
                            </Card.Text>

                            <Button disabled>
                                Próximamente
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
                                Actualiza tus datos personales, correo,
                                teléfono o contraseña.
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
            </Row>

            {productor && (
                <Card>
                    <Card.Body className="p-4">
                        <h2 className="h5 fw-bold mb-3">
                            Información de cuenta
                        </h2>

                        <Row className="g-3">
                            <Col md={6}>
                                <div className="text-secondary small">
                                    Nombre
                                </div>
                                <div>
                                    {productor.nombres} {productor.apellidos}
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="text-secondary small">
                                    Correo
                                </div>
                                <div>{usuario.email}</div>
                            </Col>

                            <Col md={6}>
                                <div className="text-secondary small">
                                    Teléfono
                                </div>
                                <div>{productor.telefono || "No registrado"}</div>
                            </Col>

                            <Col md={6}>
                                <div className="text-secondary small">
                                    Estado
                                </div>
                                <div>
                                    {usuario.activo ? "Activo" : "Inactivo"}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}