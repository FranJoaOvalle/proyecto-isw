import { Container, Nav } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
    return (
        <>
            <div className="border-bottom bg-body-tertiary">
                <Container className="py-2">
                    <Nav variant="underline" className="gap-4">
                        <Nav.Link as={NavLink} to="/admin" end>
                            <i className="bi bi-window me-2" />
                            Panel
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/clientes">
                            <i className="bi bi-person me-2" />
                            Clientes
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/productores">
                            <i className="bi bi-person-gear me-2" />
                            Productores
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/catalogo">
                            <i className="bi bi-shop-window me-2" />
                            Catálogo
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/eventos">
                            <i className="bi bi-calendar-event me-2" />
                            Eventos
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/recursos">
                            <i className="bi bi-box2 me-2" />
                            Recursos
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/presupuestos">
                            <i className="bi bi-receipt me-2" />
                            Presupuestos
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/pagos">
                            <i className="bi bi-cash-coin me-2" />
                            Pagos
                        </Nav.Link>
                    </Nav>
                </Container>
            </div>

            <Outlet />
        </>
    );
}