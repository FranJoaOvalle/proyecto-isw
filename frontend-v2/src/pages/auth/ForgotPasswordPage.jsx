import { useState } from "react";
import {
    Alert,
    Button,
    Fade,
    Form,
    Spinner
} from "react-bootstrap";
import { Link } from "react-router-dom";

import { forgotPassword } from "../../services/auth.service";
import "./LoginPage.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [validated, setValidated] = useState(false);

    const handleChange = (e) => {
        setEmail(e.target.value);

        // El feedback anterior deja de ser relevante al modificar el correo.
        setError("");
        setSuccess("");
    };

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
            const data = await forgotPassword(email);

            setError("");
            setSuccess(data.message);
        } catch (error) {
            setSuccess("");
            setError(
                error.response?.data?.error?.message ??
                "No fue posible procesar la solicitud."
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
                            Recuperar contraseña
                        </h1>

                        <p className="text-secondary mb-0">
                            Ingresa el correo asociado a tu cuenta y te enviaremos
                            un enlace para restablecer tu contraseña.
                        </p>
                    </div>

                    <Fade
                        in={!!success}
                        mountOnEnter
                        unmountOnExit
                    >
                        <div>
                            <Alert
                                variant="success"
                                className="py-2 px-3 mb-3"
                            >
                                {success}
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
                        <Form.Group className="mb-4 position-relative">
                            <Form.Label htmlFor="email">
                                Correo electrónico
                            </Form.Label>

                            <Form.Control
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.cl"
                                autoComplete="email"
                                required
                                disabled={loading}
                            />

                            <Form.Control.Feedback
                                type="invalid"
                                tooltip
                            >
                                Ingresa un correo electrónico válido.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button
                            type="submit"
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                        aria-hidden="true"
                                    />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-envelope me-2" />
                                    Enviar enlace
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