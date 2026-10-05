import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Alert,
    Fade,
    Form,
    InputGroup,
    Spinner
} from "react-bootstrap";

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
    const [showPassword, setShowPassword] = useState(false);
    const [validated, setValidated] = useState(false);

    const from = location.state?.from?.pathname;
    const registroExitoso = location.state?.registroExitoso;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formElement = e.currentTarget;

        if (!formElement.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        setValidated(true);
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
                                NES Eventos
                            </span>
                        </div>

                        <h1 className="fw-bold mb-2">
                            Bienvenido de nuevo
                        </h1>

                        <p className="text-secondary mb-0">
                            Inicia sesión para continuar a tu cuenta.
                        </p>
                    </div>

                    <Fade
                        in={!!registroExitoso}
                        mountOnEnter
                        unmountOnExit
                    >
                        <div>
                            <Alert
                                variant="success"
                                className="py-2 px-3 mb-3"
                            >
                                Cuenta creada correctamente. Ya puedes iniciar sesión.
                            </Alert>
                        </div>
                    </Fade>

                    <Fade
                        in={!!location.state?.passwordReset}
                        mountOnEnter
                        unmountOnExit
                    >
                        <div>
                            <Alert
                                variant="success"
                                className="py-2 px-3 mb-3"
                            >
                                Tu contraseña fue restablecida correctamente.
                                Ya puedes iniciar sesión.
                            </Alert>
                        </div>
                    </Fade>

                    <Fade
                        in={!!error}
                        mountOnEnter
                        unmountOnExit
                    >
                        <div>
                            <Alert
                                variant="danger"
                                className="py-2 px-3 mb-3"
                            >
                                {error}
                            </Alert>
                        </div>
                    </Fade>

                    <Form
                        noValidate
                        validated={validated}
                        onSubmit={handleSubmit}
                    >
                        <div className="mb-4 position-relative">
                            <Form.Label
                                htmlFor="email"
                                className="fw-medium"
                            >
                                Correo
                            </Form.Label>

                            <Form.Control
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                required
                                disabled={loading}
                            />

                            <Form.Control.Feedback type="invalid" tooltip>
                                Ingresa un correo electrónico válido.
                            </Form.Control.Feedback>
                        </div>

                        <div className="mb-4 position-relative">
                            <Form.Label
                                htmlFor="password"
                                className="fw-medium"
                            >
                                Contraseña
                            </Form.Label>

                            <InputGroup hasValidation>
                                <Form.Control
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="••••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowPassword((current) => !current)
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                    title={
                                        showPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    />
                                </button>

                                <Form.Control.Feedback type="invalid" tooltip>
                                    Ingresa tu contraseña.
                                </Form.Control.Feedback>
                            </InputGroup>

                            <div className="text-end mt-1 mb-3">
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
                            className="btn btn-primary w-100 fw-semibold"
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
                    </Form>
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