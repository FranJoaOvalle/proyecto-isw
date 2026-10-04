import { useState } from "react";
import {
    Alert,
    Button,
    Form,
    Spinner
} from "react-bootstrap";
import {
    Link,
    useNavigate,
    useSearchParams
} from "react-router-dom";

import { resetPassword } from "../../services/auth.service";
import "./LoginPage.css";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("El enlace de recuperación no es válido.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword(token, password);

            navigate("/login", {
                replace: true,
                state: {
                    passwordReset: true
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible restablecer la contraseña."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-panel">
                <div className="login-card">
                    <div className="mb-4">
                        <h1 className="fw-bold mb-2">
                            Nueva contraseña
                        </h1>

                        <p className="text-secondary mb-0">
                            Ingresa una nueva contraseña para tu cuenta.
                        </p>
                    </div>

                    {!token && (
                        <Alert variant="danger">
                            El enlace de recuperación no es válido.
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Nueva contraseña
                            </Form.Label>

                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                required
                                disabled={!token}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>
                                Confirmar contraseña
                            </Form.Label>

                            <Form.Control
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                required
                                disabled={!token}
                            />
                        </Form.Group>

                        <Button
                            type="submit"
                            className="w-100"
                            disabled={loading || !token}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-key me-2" />
                                    Cambiar contraseña
                                </>
                            )}
                        </Button>
                    </Form>

                    <div className="text-center mt-4">
                        <Link
                            to="/login"
                            className="text-decoration-none"
                        >
                            <i className="bi bi-arrow-left me-1" />
                            Volver a iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            <div className="login-image">
                <img
                    src="/assets/img/login.webp"
                    alt=""
                />
                <div className="login-overlay" />
            </div>
        </div>
    );
}