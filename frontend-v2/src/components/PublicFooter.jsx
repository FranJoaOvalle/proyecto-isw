import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

import "./PublicFooter.css";

const rutasPerfil = {
    CLIENTE: "/cliente/perfil",
    PRODUCTOR: "/productor/perfil"
};

export default function PublicFooter() {
    const { usuario } = useAuth();

    const rutaCatalogo = usuario?.rol === "CLIENTE"
        ? "/cliente/catalogo"
        : "/catalogo";

    const rutaPerfil = rutasPerfil[usuario?.rol] ?? "/perfil";

    return (
        <footer className="public-footer border-top bg-body-tertiary">
            <Container>
                <div className="public-footer-content">
                    <Link to="/">
                        <img
                            src="/assets/img/nes_logo.png"
                            alt="NES Eventos"
                            className="public-footer-logo"
                        />
                    </Link>

                    <small className="text-secondary">
                        © {new Date().getFullYear()} NES Eventos.
                        Todos los derechos reservados.
                    </small>

                    <nav
                        className="public-footer-links"
                        aria-label="Navegación del pie de página"
                    >
                        <Link to="/">
                            Inicio
                        </Link>

                        <Link to={rutaCatalogo}>
                            Catálogo
                        </Link>

                        <Link to={usuario ? rutaPerfil : "/login"}>
                            {usuario ? "Mi perfil" : "Iniciar sesión"}
                        </Link>
                    </nav>
                </div>
            </Container>
        </footer>
    );
}