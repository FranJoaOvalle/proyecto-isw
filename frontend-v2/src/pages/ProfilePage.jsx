import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import {
    updateProfile,
    changePassword,
    deactivateAccount
} from "../services/usuario.service";

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

    return (
        <main className="container py-5">
            <div className="mx-auto" style={{ maxWidth: "720px" }}>
                <div className="mb-4">
                    <h1 className="fw-bold">Mi perfil</h1>
                    <p className="text-secondary mb-0">
                        Administra tus datos personales y seguridad.
                    </p>
                </div>

                {success && <Alert variant="success">{success}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Card className="mb-4">
                    <Card.Body className="p-4">
                        <h2 className="h5 fw-bold mb-4">
                            Información de la cuenta
                        </h2>

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Correo</Form.Label>
                                <Form.Control
                                    name="email"
                                    type="email"
                                    value={form.email ?? ""}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>

                            {usuario.rol === "CLIENTE" &&
                                usuario.cliente?.tipo === "PERSONA" && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>RUT</Form.Label>
                                        <Form.Control
                                            value={usuario.cliente.persona?.rut ?? ""}
                                            disabled
                                        />
                                    </Form.Group>
                                )}

                            {usuario.rol === "CLIENTE" &&
                                usuario.cliente?.tipo === "EMPRESA" && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>RUT empresa</Form.Label>
                                        <Form.Control
                                            value={usuario.cliente.empresa?.rutEmpresa ?? ""}
                                            disabled
                                        />
                                    </Form.Group>
                                )}

                            {(usuario.rol === "PRODUCTOR" ||
                                usuario.cliente?.tipo === "PERSONA") && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nombres</Form.Label>
                                        <Form.Control
                                            name="nombres"
                                            value={form.nombres ?? ""}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Apellidos</Form.Label>
                                        <Form.Control
                                            name="apellidos"
                                            value={form.apellidos ?? ""}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </>
                            )}

                            {usuario.cliente?.tipo === "EMPRESA" && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Razón social</Form.Label>
                                        <Form.Control
                                            name="razonSocial"
                                            value={form.razonSocial ?? ""}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Casa matriz</Form.Label>
                                        <Form.Control
                                            name="casaMatriz"
                                            value={form.casaMatriz ?? ""}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </>
                            )}

                            {usuario.rol !== "ADMIN" && (
                                <Form.Group className="mb-4">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control
                                        name="telefono"
                                        type="tel"
                                        value={form.telefono ?? ""}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Form.Group>
                            )}

                            <Button type="submit" disabled={loading}>
                                {loading && (
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                )}
                                Guardar cambios
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card className="mb-4">
                    <Card.Body className="p-4">
                        <h2 className="h5 fw-bold mb-4">
                            Cambiar contraseña
                        </h2>

                        <Form onSubmit={handlePasswordSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contraseña actual</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={passwords.passwordActual}
                                    onChange={(e) =>
                                        setPasswords((current) => ({
                                            ...current,
                                            passwordActual: e.target.value
                                        }))
                                    }
                                    required
                                    disabled={passwordLoading}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Nueva contraseña</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={passwords.passwordNueva}
                                    onChange={(e) =>
                                        setPasswords((current) => ({
                                            ...current,
                                            passwordNueva: e.target.value
                                        }))
                                    }
                                    minLength={8}
                                    required
                                    disabled={passwordLoading}
                                />
                                <Form.Text>
                                    Mínimo 8 caracteres.
                                </Form.Text>
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="outline-primary"
                                disabled={passwordLoading}
                            >
                                {passwordLoading && (
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                )}
                                Cambiar contraseña
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                {usuario.rol !== "ADMIN" && (
                    <Card border="danger">
                        <Card.Body className="p-4">
                            <h2 className="h5 fw-bold text-danger">
                                Desactivar cuenta
                            </h2>

                            <p className="text-secondary">
                                Tu cuenta quedará inactiva y no podrás volver
                                a iniciar sesión hasta que un administrador la
                                reactive.
                            </p>

                            <Button
                                variant="outline-danger"
                                onClick={() => setShowDeactivateModal(true)}
                            >
                                Desactivar mi cuenta
                            </Button>
                        </Card.Body>
                    </Card>
                )}
            </div>

            <Modal
                show={showDeactivateModal}
                onHide={() => setShowDeactivateModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Desactivar cuenta</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        ¿Seguro que deseas desactivar tu cuenta?
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
        </main>
    );
}