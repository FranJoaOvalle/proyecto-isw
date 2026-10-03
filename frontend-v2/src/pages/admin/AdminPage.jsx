import { useEffect, useState } from "react";
import {
    Alert,
    Card,
    Col,
    Container,
    Row,
    Spinner
} from "react-bootstrap";

import { getClientes } from "../../services/cliente.service";
import { getProductores } from "../../services/productor.service";

export default function AdminPage() {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadResumen = async () => {
            try {
                const [clientes, productores] = await Promise.all([
                    getClientes(),
                    getProductores()
                ]);

                setResumen({
                    clientes: {
                        total: clientes.length,
                        activos: clientes.filter(
                            (cliente) => cliente.usuario.activo
                        ).length,
                        personas: clientes.filter(
                            (cliente) => cliente.tipo === "PERSONA"
                        ).length,
                        empresas: clientes.filter(
                            (cliente) => cliente.tipo === "EMPRESA"
                        ).length
                    },
                    productores: {
                        total: productores.length,
                        activos: productores.filter(
                            (productor) => productor.usuario.activo
                        ).length
                    }
                });
            } catch (error) {
                setError(
                    error.response?.data?.error?.message ??
                    "No fue posible cargar el resumen."
                );
            } finally {
                setLoading(false);
            }
        };

        loadResumen();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <div className="mb-4">
                <h1 className="fw-bold">Resumen</h1>
                <p className="text-secondary mb-0">
                    Estado general de NES Eventos.
                </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {resumen && (
                <>
                    <Row className="g-4 mb-4">
                        <Col md={6} lg={3}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="text-secondary mb-2">
                                        Clientes
                                    </div>

                                    <div className="fs-2 fw-bold">
                                        {resumen.clientes.total}
                                    </div>

                                    <small className="text-secondary">
                                        {resumen.clientes.activos} activos
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="text-secondary mb-2">
                                        Personas
                                    </div>

                                    <div className="fs-2 fw-bold">
                                        {resumen.clientes.personas}
                                    </div>

                                    <small className="text-secondary">
                                        clientes particulares
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="text-secondary mb-2">
                                        Empresas
                                    </div>

                                    <div className="fs-2 fw-bold">
                                        {resumen.clientes.empresas}
                                    </div>

                                    <small className="text-secondary">
                                        clientes empresa
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="text-secondary mb-2">
                                        Productores
                                    </div>

                                    <div className="fs-2 fw-bold">
                                        {resumen.productores.total}
                                    </div>

                                    <small className="text-secondary">
                                        {resumen.productores.activos} activos
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="g-4">
                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>Clientes inactivos</Card.Title>

                                    <div className="fs-3 fw-bold">
                                        {resumen.clientes.total -
                                            resumen.clientes.activos}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>
                                        Productores inactivos
                                    </Card.Title>

                                    <div className="fs-3 fw-bold">
                                        {resumen.productores.total -
                                            resumen.productores.activos}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}