import { useState } from "react";
import { Container, Nav } from "react-bootstrap";

import PageHeader from "../../components/PageHeader";
import RecursosPanel from "../../components/recursos/RecursosPanel";
import EspaciosPanel from "../../components/recursos/EspaciosPanel";
import VehiculosPanel from "../../components/recursos/VehiculosPanel";

export default function RecursosPage() {
    const [seccion, setSeccion] = useState("equipos");

    return (
        <Container className="py-5">
            <PageHeader
                title="Recursos y espacios"
                description="Administra equipos, vehículos, recintos y sus reservas."
            />

            <Nav
                variant="tabs"
                activeKey={seccion}
                onSelect={key => key && setSeccion(key)}
                className="mb-4"
                aria-label="Secciones de recursos"
            >
                <Nav.Item>
                    <Nav.Link eventKey="equipos">
                        <i className="bi bi-box-seam me-2" />Recursos
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="vehiculos">
                        <i className="bi bi-truck me-2" />Vehículos
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="espacios">
                        <i className="bi bi-building me-2" />Espacios
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {seccion === "equipos" ? <RecursosPanel /> : seccion === "vehiculos" ? <VehiculosPanel /> : <EspaciosPanel />}
        </Container>
    );
}
