import { Container, Nav } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
    return (
        <>
            <div className="border-bottom bg-body-tertiary">
                <Container className="py-2">
                    <Nav variant="underline">
                        <Nav.Link as={NavLink} to="/admin" end>
                            Panel
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/clientes">
                            Clientes
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/admin/productores">
                            Productores
                        </Nav.Link>
                    </Nav>
                </Container>
            </div>

            <Outlet />
        </>
    );
}