import {Container, Nav, Navbar, NavDropdown} from "react-bootstrap";

import {Link, useNavigate} from "react-router-dom";

import {useAuth} from "../contexts/AuthContext";
import {useTheme} from "../contexts/ThemeContext";
import UserAvatar from "./UserAvatar";

const getPanelPath = (rol) => {
    switch (rol) {
        case "ADMIN":
            return "/admin";
        case "PRODUCTOR":
            return "/productor";
        case "CLIENTE":
            return "/cliente";
        default:
            return "/";
    }
};

const getNombreUsuario = (usuario) => {
    if (!usuario) return "";

    if (usuario.rol === "PRODUCTOR")
        return usuario.productor?.nombres ?? usuario.email;

    if (usuario.rol === "CLIENTE") {
        if (usuario.cliente?.tipo === "PERSONA")
            return usuario.cliente.persona?.nombres ?? usuario.email;

        if (usuario.cliente?.tipo === "EMPRESA")
            return usuario.cliente.empresa?.razonSocial ?? usuario.email;
    }

    if (usuario.rol === "ADMIN")
        return "Administrador";

    return usuario.email;
};

export default function MainNavbar() {
    const navigate = useNavigate();

    const {usuario, logout} = useAuth();
    const {theme, toggleTheme} = useTheme();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <Navbar
            expand="lg"
            className="border-bottom bg-body"
        >
            <Container fluid className="px-4">
                <Navbar.Brand
                    as={Link}
                    to="/"
                    className="d-flex align-items-center"
                >
                    <img
                        src="/assets/img/nes_logo.png"
                        alt="NES Eventos"
                        style={{
                            maxHeight: 36,
                            width: "auto"
                        }}
                    />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar"/>

                <Navbar.Collapse id="main-navbar">
                    <Nav className="ms-auto align-items-lg-center gap-lg-2">
                        <Nav.Link
                            as={Link}
                            to="/"
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-house me-2"/>
                            Inicio
                        </Nav.Link>

                        <Nav.Link
                            as={Link}
                            to="/catalogo"
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-grid me-2"/>
                            Catálogo
                        </Nav.Link>

                        {usuario?.rol === "CLIENTE" && (
                            <Nav.Link
                                as={Link}
                                to="/cliente/compra"
                                className="d-flex align-items-center"
                            >
                                <i className="bi bi-cart3 me-2" />
                                Compra / Contrato
                            </Nav.Link>
                        )}

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="btn btn-link nav-link d-flex align-items-center justify-content-center"
                            aria-label={
                                theme === "dark"
                                    ? "Cambiar a modo claro"
                                    : "Cambiar a modo oscuro"
                            }
                            title={
                                theme === "dark"
                                    ? "Modo claro"
                                    : "Modo oscuro"
                            }
                        >
                            <i
                                className={
                                    theme === "dark"
                                        ? "bi bi-sun fs-5"
                                        : "bi bi-moon-stars fs-5"
                                }
                            />
                        </button>

                        {!usuario ? (
                            <Link
                                to="/login"
                                className="btn btn-primary ms-lg-2 d-flex align-items-center justify-content-center"
                            >
                                <i className="bi bi-box-arrow-in-right me-2"/>
                                Iniciar sesión
                            </Link>
                        ) : (
                            <NavDropdown
                                title={
                                    <span className="d-inline-flex align-items-center gap-2 pe-2">
                                    <UserAvatar
                                        nombre={getNombreUsuario(usuario)}
                                        size={30}
                                    />
                                        {getNombreUsuario(usuario)}
                                    </span>
                                }
                                align="end"
                                className="ms-lg-2"
                            >
                                <NavDropdown.Item
                                    onClick={() =>
                                        navigate(getPanelPath(usuario.rol))
                                    }
                                >
                                    <i className="bi bi-window me-2"/>
                                    Panel
                                </NavDropdown.Item>

                                <NavDropdown.Item
                                    onClick={() => navigate("/perfil")}
                                >
                                    <i className="bi bi-person-circle me-2"/>
                                    Mi perfil
                                </NavDropdown.Item>

                                <NavDropdown.Divider/>

                                <NavDropdown.Item onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-left me-2"/>
                                    Cerrar sesión
                                </NavDropdown.Item>
                            </NavDropdown>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}