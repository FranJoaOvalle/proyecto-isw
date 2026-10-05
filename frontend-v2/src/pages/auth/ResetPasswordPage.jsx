import { useState } from "react";
import {
    Alert,
    Button,
    Fade,
    Form,
    InputGroup,
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validated, setValidated] = useState(false);

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError("");
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formElement = e.currentTarget;

        if (!token)
            return;

        if (!formElement.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (password !== confirmPassword) {
            setValidated(true);
            return;
        }

        setValidated(true);
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

                    <Fade
                        in={!token}
                        mountOnEnter
                        unmountOnExit
                    >
                        <div>
                            <Alert
                                variant="danger"
                                className="py-2 px-3 mb-3"
                            >
                                El enlace de recuperación no es válido.
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
                        <Form.Group className="mb-3 position-relative">
                            <Form.Label htmlFor="password">
                                Nueva contraseña
                            </Form.Label>

                            <InputGroup hasValidation>
                                <Form.Control
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="••••••••••"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    disabled={!token || loading}
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowPassword((current) => !current)
                                    }
                                    disabled={!token || loading}
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

                                <Form.Control.Feedback
                                    type="invalid"
                                    tooltip
                                >
                                    La contraseña debe tener al menos 8 caracteres.
                                </Form.Control.Feedback>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4 position-relative">
                            <Form.Label htmlFor="confirmPassword">
                                Confirmar contraseña
                            </Form.Label>

                            <InputGroup hasValidation>
                                <Form.Control
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    placeholder="••••••••••"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    disabled={!token || loading}
                                    isInvalid={
                                        validated &&
                                        (
                                            confirmPassword.length < 8 ||
                                            confirmPassword !== password
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            (current) => !current
                                        )
                                    }
                                    disabled={!token || loading}
                                    aria-label={
                                        showConfirmPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                    title={
                                        showConfirmPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >
                                    <i
                                        className={
                                            showConfirmPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    />
                                </button>

                                <Form.Control.Feedback
                                    type="invalid"
                                    tooltip
                                >
                                    {confirmPassword.length < 8
                                        ? "Repite una contraseña de al menos 8 caracteres."
                                        : "Las contraseñas no coinciden."}
                                </Form.Control.Feedback>
                            </InputGroup>
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
                                        aria-hidden="true"
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