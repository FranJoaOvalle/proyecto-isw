import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {
    Form,
    InputGroup,
    Spinner
} from "react-bootstrap";

import {register} from "../../services/auth.service";

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
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validated, setValidated] = useState(false);

    const handleChange = (e) => {
        const {name, value} = e.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const formElement = e.currentTarget;

        if (!formElement.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (form.password !== confirmPassword) {
            setValidated(true);
            return;
        }

        setValidated(true);
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
                    ...(form.telefono && {telefono: form.telefono})
                }
                : {
                    tipo,
                    email: form.email,
                    password: form.password,
                    rutEmpresa: form.rutEmpresa,
                    razonSocial: form.razonSocial,
                    casaMatriz: form.casaMatriz,
                    ...(form.telefono && {telefono: form.telefono})
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
                            NES Eventos
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
                            <span className="d-inline-flex align-items-center gap-2">
                                <i className="bi bi-person"/>
                                Persona
                            </span>
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
                            <span className="d-inline-flex align-items-center gap-2">
                                <i className="bi bi-building"/>
                                Empresa
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <Form
                        noValidate
                        validated={validated}
                        onSubmit={handleSubmit}
                    >
                        <div className="row g-3">
                            <div className="col-12 position-relative">
                                <Form.Label htmlFor="email">
                                    Correo
                                </Form.Label>

                                <Form.Control
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.cl"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                />

                                <Form.Control.Feedback type="invalid" tooltip>
                                    Ingresa un correo electrónico válido.
                                </Form.Control.Feedback>
                            </div>

                            <div className="col-12 position-relative">
                                <Form.Label htmlFor="password">
                                    Contraseña
                                </Form.Label>

                                <InputGroup hasValidation>
                                    <Form.Control
                                        id="password"
                                        name="password"
                                        placeholder="••••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        minLength={8}
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
                                        La contraseña debe tener al menos 8 caracteres.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </div>

                            <div className="col-12 position-relative">
                                <Form.Label htmlFor="confirmPassword">
                                    Repetir contraseña
                                </Form.Label>

                                <InputGroup hasValidation>
                                    <Form.Control
                                        id="confirmPassword"
                                        placeholder="••••••••••"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        disabled={loading}
                                        isInvalid={
                                            validated &&
                                            (
                                                confirmPassword.length < 8 ||
                                                confirmPassword !== form.password
                                            )
                                        }
                                    />

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() =>
                                            setShowConfirmPassword((current) => !current)
                                        }
                                        disabled={loading}
                                        aria-label={
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

                                    <Form.Control.Feedback type="invalid" tooltip>
                                        {confirmPassword.length < 8
                                            ? "Repite una contraseña de al menos 8 caracteres."
                                            : "Las contraseñas no coinciden."}
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </div>

                            {tipo === "PERSONA" ? (
                                <>
                                    <div className="col-12 position-relative">
                                        <Form.Label htmlFor="rut">
                                            RUT
                                        </Form.Label>

                                        <Form.Control
                                            id="rut"
                                            name="rut"
                                            value={form.rut}
                                            onChange={handleChange}
                                            placeholder="12345678-5"
                                            pattern="[0-9]{7,8}-[0-9Kk]"
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa un RUT válido. Ejemplo: 12345678-5.
                                        </Form.Control.Feedback>
                                    </div>

                                    <div className="col-md-6 position-relative">
                                        <Form.Label htmlFor="nombres">
                                            Nombres
                                        </Form.Label>

                                        <Form.Control
                                            id="nombres"
                                            name="nombres"
                                            value={form.nombres}
                                            onChange={handleChange}
                                            minLength={2}
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa tus nombres.
                                        </Form.Control.Feedback>
                                    </div>

                                    <div className="col-md-6 position-relative">
                                        <Form.Label htmlFor="apellidos">
                                            Apellidos
                                        </Form.Label>

                                        <Form.Control
                                            id="apellidos"
                                            name="apellidos"
                                            value={form.apellidos}
                                            onChange={handleChange}
                                            minLength={2}
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa tus apellidos.
                                        </Form.Control.Feedback>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-12 position-relative">
                                        <Form.Label htmlFor="rutEmpresa">
                                            RUT de la empresa
                                        </Form.Label>

                                        <Form.Control
                                            id="rutEmpresa"
                                            name="rutEmpresa"
                                            value={form.rutEmpresa}
                                            onChange={handleChange}
                                            placeholder="76543210-K"
                                            pattern="[0-9]{7,8}-[0-9Kk]"
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa un RUT de empresa válido.
                                        </Form.Control.Feedback>
                                    </div>

                                    <div className="col-12 position-relative">
                                        <Form.Label htmlFor="razonSocial">
                                            Razón social
                                        </Form.Label>

                                        <Form.Control
                                            id="razonSocial"
                                            name="razonSocial"
                                            value={form.razonSocial}
                                            onChange={handleChange}
                                            minLength={2}
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa la razón social de la empresa.
                                        </Form.Control.Feedback>
                                    </div>

                                    <div className="col-12 position-relative">
                                        <Form.Label htmlFor="casaMatriz">
                                            Casa matriz
                                        </Form.Label>

                                        <Form.Control
                                            id="casaMatriz"
                                            name="casaMatriz"
                                            value={form.casaMatriz}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />

                                        <Form.Control.Feedback type="invalid" tooltip>
                                            Ingresa la dirección de la casa matriz.
                                        </Form.Control.Feedback>
                                    </div>
                                </>
                            )}

                            <div className="col-12 position-relative">
                                <Form.Label htmlFor="telefono">
                                    Teléfono
                                    <span className="text-secondary"> (opcional)</span>
                                </Form.Label>

                                <Form.Control
                                    id="telefono"
                                    name="telefono"
                                    type="tel"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    placeholder="+56912345678"
                                    pattern="\+?[0-9]{8,15}"
                                    disabled={loading}
                                />

                                <Form.Control.Feedback type="invalid" tooltip>
                                    Ingresa un teléfono válido. Ejemplo: +56912345678.
                                </Form.Control.Feedback>
                            </div>

                            <div className="col-12 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 fw-semibold"
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
                    </Form>

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
                <div className="register-overlay"/>
            </div>
        </div>
    );
}