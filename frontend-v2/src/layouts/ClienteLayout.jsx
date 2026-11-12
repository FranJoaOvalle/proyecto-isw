import { Container, Nav } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";

export default function ClienteLayout() {
    return (
        <>
            <div className="border-bottom bg-body-tertiary">
                <Container className="py-2">
                    <Nav variant="underline" className="gap-2 gap-md-4" aria-label="Secciones del cliente">
                        <Nav.Link as={NavLink} to="/cliente" end>
                            <i className="bi bi-window me-2" />Panel
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/cliente/solicitudes">
                            <i className="bi bi-file-earmark-text me-2" />Solicitudes
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/cliente/compra">
                            <i className="bi bi-receipt me-2" />Compra / Contrato
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/cliente/eventos">
                            <i className="bi bi-calendar-event me-2" />Mis eventos
                        </Nav.Link>
                    </Nav>
                </Container>
            </div>
            <Outlet />
        </>
    );
}
