import { useEffect, useState } from "react";
import {
    Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import NotificacionToast from "../components/NotificacionToast";
import UserAvatar from "../components/UserAvatar";
import PageHeader from "../components/PageHeader";
import {
    updateProfile,
    changePassword,
    deactivateAccount
} from "../services/usuario.service";

import "./ProfilePage.css";

function getIdentidad(usuario) {
    if (usuario.rol === "ADMIN") {
        return { nombre: "Administrador", tipo: "Administración" };
    }

    const esEmpresa = usuario.rol === "CLIENTE" &&
        usuario.cliente?.tipo === "EMPRESA";

    if (esEmpresa) {
        return {
            nombre: usuario.cliente.empresa?.razonSocial || usuario.email,
            tipo: "Cliente empresa"
        };
    }

    const persona = usuario.rol === "PRODUCTOR"
        ? usuario.productor
        : usuario.cliente?.persona;

    return {
        nombre: [persona?.nombres, persona?.apellidos].filter(Boolean).join(" ") || usuario.email,
        tipo: usuario.rol === "PRODUCTOR" ? "Productor" : "Cliente particular"
    };
}

function EncabezadoSeccion({ icono, titulo }) {
    return (
        <div className="profile-section-heading">
            <div className="profile-icon">
                <i className={`bi bi-${icono}`} aria-hidden="true" />
            </div>
            <h2 className="h5 fw-bold mb-0">{titulo}</h2>
        </div>
    );
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const { usuario, setUsuario, logout } = useAuth();

    const [form, setForm] = useState({});
    const [passwords, setPasswords] = useState({
        passwordActual: "",
        passwordNueva: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect -- El formulario se rellena cuando llega el usuario autenticado. */
    useEffect(() => {
        if (!usuario) return;

        if (usuario.rol === "PRODUCTOR") {
            setForm({
                email: usuario.email,
                nombres: usuario.productor?.nombres ?? "",
                apellidos: usuario.productor?.apellidos ?? "",
                telefono: usuario.productor?.telefono ?? ""
            });

            return;
        }

        if (usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "PERSONA") {
            setForm({
                email: usuario.email,
                nombres: usuario.cliente.persona?.nombres ?? "",
                apellidos: usuario.cliente.persona?.apellidos ?? "",
                telefono: usuario.cliente.persona?.telefono ?? ""
            });

            return;
        }

        if (usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "EMPRESA") {
            setForm({
                email: usuario.email,
                razonSocial: usuario.cliente.empresa?.razonSocial ?? "",
                casaMatriz: usuario.cliente.empresa?.casaMatriz ?? "",
                telefono: usuario.cliente.empresa?.telefono ?? ""
            });

            return;
        }

        setForm({
            email: usuario.email
        });
    }, [usuario]);
    /* eslint-enable react-hooks/set-state-in-effect */

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
        setSuccess("");
        setLoading(true);

        try {
            const actualizado = await updateProfile(form);
            setUsuario(actualizado);
            setSuccess("Perfil actualizado correctamente.");
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible actualizar el perfil."
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setPasswordLoading(true);

        try {
            await changePassword(
                passwords.passwordActual,
                passwords.passwordNueva
            );

            setPasswords({
                passwordActual: "",
                passwordNueva: ""
            });

            setSuccess("Contraseña actualizada correctamente.");
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible actualizar la contraseña."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setError("");
        setDeactivating(true);

        try {
            await deactivateAccount();
            logout();
            navigate("/", { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible desactivar la cuenta."
            );

            setShowDeactivateModal(false);
        } finally {
            setDeactivating(false);
        }
    };

    if (!usuario) {
        return (
            <div className="text-center py-5" role="status">
                <Spinner animation="border" />
                <span className="visually-hidden">Cargando perfil...</span>
            </div>
        );
    }

    const esAdmin = usuario.rol === "ADMIN";
    const esPersona = usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "PERSONA";
    const esEmpresa = usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "EMPRESA";
    const identidad = getIdentidad(usuario);

    const campos = [
        ...(usuario.rol === "PRODUCTOR" || esPersona ? [
            { name: "nombres", label: "Nombres", required: true, autoComplete: "given-name" },
            { name: "apellidos", label: "Apellidos", required: true, autoComplete: "family-name" }
        ] : []),
        ...(esEmpresa ? [
            { name: "razonSocial", label: "Razón social", required: true, autoComplete: "organization", ancho: 12 },
            { name: "casaMatriz", label: "Casa matriz", required: true, ancho: 12 }
        ] : []),
        { name: "email", label: "Correo electrónico", type: "email", required: true, autoComplete: "email", ancho: esAdmin ? 12 : 6 },
        ...(!esAdmin ? [
            { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" }
        ] : []),
        ...(esPersona ? [
            { name: "rut", label: "RUT", fijo: true, valor: usuario.cliente.persona?.rut ?? "" }
        ] : []),
        ...(esEmpresa ? [
            { name: "rutEmpresa", label: "RUT empresa", fijo: true, valor: usuario.cliente.empresa?.rutEmpresa ?? "" }
        ] : [])
    ];

    return (
        <Container fluid className="profile-page py-4 px-3 px-xl-4">
            <PageHeader title="Mi perfil" description="Datos de cuenta y seguridad" />

            <NotificacionToast mensaje={success} onClose={() => setSuccess("")} />
            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            <Row className="g-4 align-items-start">
                <Col lg={4} xl={3}>
                    <Card className="profile-card">
                        <Card.Body className="p-4">
                            <div className="profile-identity text-center">
                                <UserAvatar
                                    nombre={identidad.nombre}
                                    userId={usuario.id}
                                    size={76}
                                />
                                <h2 className="h5 fw-bold mt-3 mb-1 text-break">{identidad.nombre}</h2>
                                <div className="text-secondary small">{identidad.tipo}</div>
                                {typeof usuario.activo === "boolean" && (
                                    <Badge bg={usuario.activo ? "success" : "secondary"} className="mt-3">
                                        {usuario.activo ? "Cuenta activa" : "Cuenta inactiva"}
                                    </Badge>
                                )}
                            </div>

                            <hr className="my-4" />

                            <div className="profile-summary">
                                <div className="d-flex gap-2 align-items-start">
                                    <i className="bi bi-envelope text-secondary" aria-hidden="true" />
                                    <div className="profile-summary-value">
                                        <div className="text-secondary small">Correo electrónico</div>
                                        <div className="small text-break">{usuario.email}</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 align-items-start">
                                    <i className="bi bi-person-badge text-secondary" aria-hidden="true" />
                                    <div className="profile-summary-value">
                                        <div className="text-secondary small">Tipo de cuenta</div>
                                        <div className="small">{esPersona ? "Persona natural" : identidad.tipo}</div>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8} xl={9} className="profile-settings">
                    <Card className="profile-card">
                        <Card.Body className="p-3 p-md-4">
                            <EncabezadoSeccion
                                icono="person"
                                titulo={esEmpresa ? "Datos de la empresa" : esAdmin ? "Información de la cuenta" : "Datos personales"}
                            />

                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    {campos.map(campo => (
                                        <Col xs={12} md={campo.ancho ?? 6} key={campo.name}>
                                            <Form.Group controlId={`profile-${campo.name}`}>
                                                <Form.Label>{campo.label}</Form.Label>
                                                <Form.Control
                                                    name={campo.fijo ? undefined : campo.name}
                                                    type={campo.type ?? "text"}
                                                    value={campo.fijo ? campo.valor : form[campo.name] ?? ""}
                                                    onChange={campo.fijo ? undefined : handleChange}
                                                    required={campo.required ?? false}
                                                    disabled={loading || campo.fijo}
                                                    autoComplete={campo.autoComplete}
                                                />
                                                {campo.fijo && <Form.Text>No editable.</Form.Text>}
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>

                                <div className="profile-form-actions">
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Spinner animation="border" size="sm" className="me-2" />}
                                        Guardar cambios
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="profile-card">
                        <Card.Body className="p-3 p-md-4">
                            <EncabezadoSeccion icono="shield-lock" titulo="Seguridad" />

                            <Form onSubmit={handlePasswordSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group controlId="profile-password-actual">
                                            <Form.Label>Contraseña actual</Form.Label>
                                            <Form.Control
                                                type="password"
                                                autoComplete="current-password"
                                                value={passwords.passwordActual}
                                                onChange={e => setPasswords(current => ({
                                                    ...current, passwordActual: e.target.value
                                                }))}
                                                required
                                                disabled={passwordLoading}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="profile-password-nueva">
                                            <Form.Label>Nueva contraseña</Form.Label>
                                            <Form.Control
                                                type="password"
                                                autoComplete="new-password"
                                                value={passwords.passwordNueva}
                                                onChange={e => setPasswords(current => ({
                                                    ...current, passwordNueva: e.target.value
                                                }))}
                                                minLength={8}
                                                required
                                                disabled={passwordLoading}
                                            />
                                            <Form.Text>Mínimo 8 caracteres.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="profile-form-actions">
                                    <Button type="submit" variant="outline-primary" disabled={passwordLoading}>
                                        {passwordLoading && <Spinner animation="border" size="sm" className="me-2" />}
                                        Cambiar contraseña
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    {!esAdmin && (
                        <Card className="profile-card">
                            <Card.Body className="p-3 p-md-4">
                                <div className="profile-deactivate">
                                    <div>
                                        <h2 className="h5 fw-bold mb-2">Desactivar cuenta</h2>
                                        <p className="text-secondary small mb-0">
                                            No podrás iniciar sesión hasta que un administrador reactive tu cuenta.
                                        </p>
                                    </div>
                                    <Button
                                        variant="danger"
                                        className="text-nowrap"
                                        onClick={() => setShowDeactivateModal(true)}
                                    >
                                        <i className="bi bi-person-x me-2" aria-hidden="true" />
                                        Desactivar mi cuenta
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            <Modal
                show={showDeactivateModal}
                onHide={() => { if (!deactivating) setShowDeactivateModal(false); }}
                centered
                backdrop={deactivating ? "static" : true}
                keyboard={!deactivating}
            >
                <Modal.Header closeButton={!deactivating}>
                    <Modal.Title>Desactivar cuenta</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        ¿Seguro que deseas desactivar tu cuenta <strong>{usuario.email}</strong>?
                    </p>

                    <p className="text-secondary mb-0">
                        No podrás volver a iniciar sesión hasta que un administrador
                        reactive tu cuenta.
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeactivateModal(false)}
                        disabled={deactivating}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="danger"
                        onClick={handleDeactivate}
                        disabled={deactivating}
                    >
                        {deactivating ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Desactivando...
                            </>
                        ) : (
                            "Desactivar cuenta"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
