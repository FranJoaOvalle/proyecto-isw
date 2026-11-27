import {
    Container,
    Nav,
    Navbar,
    NavDropdown,
    OverlayTrigger,
    Tooltip
} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";

import {useAuth} from "../contexts/AuthContext";
import {useTheme} from "../contexts/ThemeContext";
import UserAvatar from "./UserAvatar";

import "./MainNavbar.css";

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

const getProfilePath = (rol) => {
    switch (rol) {
        case "ADMIN":
            return "/admin/perfil";
        case "CLIENTE":
            return "/cliente/perfil";
        case "PRODUCTOR":
            return "/productor/perfil";
        default:
            return "/perfil";
    }
};

const getNombreUsuario = (usuario, completo = false) => {
    if (!usuario) return "";

    if (usuario.rol === "ADMIN")
        return "Administrador";

    if (usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "EMPRESA") {
        return usuario.cliente.empresa?.razonSocial || usuario.email;
    }

    const persona = usuario.rol === "PRODUCTOR"
        ? usuario.productor
        : usuario.cliente?.persona;

    if (!persona) return usuario.email;

    const nombre = completo
        ? [persona.nombres, persona.apellidos]
            .filter(Boolean)
            .join(" ")
        : persona.nombres;

    return nombre || usuario.email;
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
            sticky="top"
            className="border-bottom bg-body main-navbar"
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
                            to={usuario?.rol === "CLIENTE"
                                ? "/cliente/catalogo"
                                : "/catalogo"}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-shop-window me-2"/>
                            Catálogo
                        </Nav.Link>

                        {usuario && (
                            <Nav.Link
                                as={Link}
                                to={getPanelPath(usuario.rol)}
                                className="d-flex align-items-center"
                            >
                                <i className="bi bi-grid me-2" />
                                Mi panel
                            </Nav.Link>
                        )}

                        <OverlayTrigger
                            placement="bottom"
                            trigger={["hover", "focus"]}
                            overlay={
                                <Tooltip id="navbar-theme-tooltip">
                                    {theme === "dark"
                                        ? "Cambiar a modo claro"
                                        : "Cambiar a modo oscuro"}
                                </Tooltip>
                            }
                        >
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="btn btn-link nav-link d-flex align-items-center justify-content-start justify-content-lg-center"
                                aria-label={
                                    theme === "dark"
                                        ? "Cambiar a modo claro"
                                        : "Cambiar a modo oscuro"
                                }
                            >
                                <i
                                    className={
                                        theme === "dark"
                                            ? "bi bi-sun fs-5"
                                            : "bi bi-moon-stars fs-5"
                                    }
                                    aria-hidden="true"
                                />
                            </button>
                        </OverlayTrigger>

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
                                    <span className="navbar-user-identity">
                                        <UserAvatar
                                            nombre={getNombreUsuario(usuario, true)}
                                            userId={usuario.id}
                                            size={30}
                                        />
                                        <span className="navbar-user-name">
                                            {getNombreUsuario(usuario)}
                                        </span>
                                    </span>
                                }
                                align="end"
                                className="navbar-user-dropdown ms-lg-2"
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
                                    onClick={() => navigate(getProfilePath(usuario.rol))}
                                >
                                    <i className="bi bi-person-circle me-2"/>
                                    Mi perfil
                                </NavDropdown.Item>

                                <NavDropdown.Divider/>

                                <NavDropdown.Item onClick={handleLogout} className="navbar-logout">
                                    <i className="bi bi-box-arrow-left me-2" />
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
