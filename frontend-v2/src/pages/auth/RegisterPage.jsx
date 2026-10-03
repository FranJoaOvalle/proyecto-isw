import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import { register } from "../../services/auth.service";

import "./RegisterPage.css";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [tipo, setTipo] = useState("PERSONA");
    const [form, setForm] = useState({
        email: "",
        password: "",
        rut: "",
        nombres: "",
        apellidos: "",
        rutEmpresa: "",
        razonSocial: "",
        casaMatriz: "",
        telefono: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = tipo === "PERSONA"
                ? {
                    tipo,
                    email: form.email,
                    password: form.password,
                    rut: form.rut,
                    nombres: form.nombres,
                    apellidos: form.apellidos,
                    ...(form.telefono && { telefono: form.telefono })
                }
                : {
                    tipo,
                    email: form.email,
                    password: form.password,
                    rutEmpresa: form.rutEmpresa,
                    razonSocial: form.razonSocial,
                    casaMatriz: form.casaMatriz,
                    ...(form.telefono && { telefono: form.telefono })
                };

            await register(data);

            navigate("/login", {
                replace: true,
                state: {
                    registroExitoso: true
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible crear la cuenta."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-panel">
                <div className="register-card">
                    <div className="mb-4">
                        <span className="fs-4 fw-bold text-primary">
                            Organizadora de eventos
                        </span>

                        <h1 className="fw-bold mt-4 mb-2">
                            Crear una cuenta
                        </h1>

                        <p className="text-secondary mb-0">
                            Regístrate para comenzar a organizar tu evento.
                        </p>
                    </div>

                    <div className="btn-group w-100 mb-4" role="group">
                        <input
                            type="radio"
                            className="btn-check"
                            name="tipo"
                            id="persona"
                            checked={tipo === "PERSONA"}
                            onChange={() => setTipo("PERSONA")}
                        />

                        <label
                            className="btn btn-outline-primary"
                            htmlFor="persona"
                        >
                            Persona
                        </label>

                        <input
                            type="radio"
                            className="btn-check"
                            name="tipo"
                            id="empresa"
                            checked={tipo === "EMPRESA"}
                            onChange={() => setTipo("EMPRESA")}
                        />

                        <label
                            className="btn btn-outline-primary"
                            htmlFor="empresa"
                        >
                            Empresa
                        </label>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-12">
                                <label htmlFor="email" className="form-label">
                                    Correo
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="form-control"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-12">
                                <label htmlFor="password" className="form-label">
                                    Contraseña
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="form-control"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    disabled={loading}
                                />

                                <div className="form-text">
                                    Mínimo 8 caracteres.
                                </div>
                            </div>

                            {tipo === "PERSONA" ? (
                                <>
                                    <div className="col-12">
                                        <label htmlFor="rut" className="form-label">
                                            RUT
                                        </label>

                                        <input
                                            id="rut"
                                            name="rut"
                                            value={form.rut}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="12345678-5"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label htmlFor="nombres" className="form-label">
                                            Nombres
                                        </label>

                                        <input
                                            id="nombres"
                                            name="nombres"
                                            value={form.nombres}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label htmlFor="apellidos" className="form-label">
                                            Apellidos
                                        </label>

                                        <input
                                            id="apellidos"
                                            name="apellidos"
                                            value={form.apellidos}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-12">
                                        <label htmlFor="rutEmpresa" className="form-label">
                                            RUT de la empresa
                                        </label>

                                        <input
                                            id="rutEmpresa"
                                            name="rutEmpresa"
                                            value={form.rutEmpresa}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="76543210-K"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label htmlFor="razonSocial" className="form-label">
                                            Razón social
                                        </label>

                                        <input
                                            id="razonSocial"
                                            name="razonSocial"
                                            value={form.razonSocial}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label htmlFor="casaMatriz" className="form-label">
                                            Casa matriz
                                        </label>

                                        <input
                                            id="casaMatriz"
                                            name="casaMatriz"
                                            value={form.casaMatriz}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="col-12">
                                <label htmlFor="telefono" className="form-label">
                                    Teléfono
                                    <span className="text-secondary"> (opcional)</span>
                                </label>

                                <input
                                    id="telefono"
                                    name="telefono"
                                    type="tel"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="+56912345678"
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-12 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-100 fw-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner
                                                size="sm"
                                                className="me-2"
                                                aria-hidden="true"
                                            />
                                            Creando cuenta...
                                        </>
                                    ) : (
                                        "Crear cuenta"
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="text-center text-secondary mt-4">
                        ¿Ya tienes una cuenta?{" "}
                        <Link
                            to="/login"
                            className="fw-semibold text-decoration-none"
                        >
                            Inicia sesión
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="btn btn-link text-secondary text-decoration-none d-block mx-auto mt-3"
                    >
                        ← Volver
                    </button>
                </div>
            </div>

            <div className="register-image">
                <img
                    src="/assets/img/login.webp"
                    alt="Evento"
                />
                <div className="register-overlay" />
            </div>
        </div>
    );
}