import { useState } from "react";
import {
    Alert,
    Button,
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const data = await forgotPassword(email);
            setSuccess(data.message);
        } catch (error) {
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

                    {success && (
                        <Alert variant="success">
                            {success}
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label>Correo electrónico</Form.Label>

                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.cl"
                                autoComplete="email"
                                required
                            />
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