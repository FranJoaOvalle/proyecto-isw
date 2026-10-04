import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {Alert, Spinner} from "react-bootstrap";

import { login, getCurrentUser } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";

import "./LoginPage.css";

const getHomeByRole = (rol) => {
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

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUsuario } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const from = location.state?.from?.pathname;
    const registroExitoso = location.state?.registroExitoso;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);

            const usuario = await getCurrentUser();
            setUsuario(usuario);

            const destino = from ?? getHomeByRole(usuario.rol);
            navigate(destino, { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible iniciar sesión."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-panel">
                <div className="login-card">
                    <div className="mb-5">
                        <div className="mb-4">
                            <span className="fs-4 fw-bold text-primary">
                                Organizadora de eventos
                            </span>
                        </div>

                        <h1 className="fw-bold mb-2">
                            Bienvenido de nuevo
                        </h1>

                        <p className="text-secondary mb-0">
                            Inicia sesión para continuar a tu cuenta.
                        </p>
                    </div>

                    {registroExitoso && (
                        <div className="alert alert-success" role="alert">
                            Cuenta creada correctamente. Ya puedes iniciar sesión.
                        </div>
                    )}

                    {location.state?.passwordReset && (
                        <Alert variant="success">
                            Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
                        </Alert>
                    )}

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="form-label fw-medium"
                            >
                                Correo
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                required
                                disabled={loading}
                                className="form-control form-control-lg"
                            />
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="password"
                                className="form-label fw-medium"
                            >
                                Contraseña
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                                className="form-control form-control-lg"
                            />
                            <div className="text-end mb-3">
                                <Link
                                    to="/forgot-password"
                                    className="small text-decoration-none"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-lg w-100 fw-semibold"
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                        aria-hidden="true"
                                    />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Iniciar sesión"
                            )}
                        </button>

                        <div className="text-center text-secondary mt-4">
                            ¿Aún no tienes una cuenta?{" "}
                            <Link
                                to="/register"
                                className="fw-semibold text-decoration-none"
                            >
                                Regístrate
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="btn btn-link text-secondary text-decoration-none d-block mx-auto mt-4"
                        >
                            ← Volver
                        </button>
                    </form>
                </div>
            </div>

            <div className="login-image">
                <img
                    src="/assets/img/login.webp"
                    alt="Evento"
                />
                <div className="login-overlay" />
            </div>
        </div>
    );
}