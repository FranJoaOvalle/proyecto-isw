import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Container,
    Form,
    Modal,
    Spinner,
    Table
} from "react-bootstrap";

import {
    getProductores,
    createProductor,
    updateProductor,
    cambiarEstadoProductor
} from "../../services/productor.service";
import UserAvatar from "../../components/UserAvatar";

const initialForm = {
    email: "",
    password: "",
    nombres: "",
    apellidos: "",
    telefono: ""
};

export default function ProductoresPage() {
    const [productores, setProductores] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editing, setEditing] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingId, setChangingId] = useState(null);
    const [error, setError] = useState("");

    const loadProductores = async () => {
        try {
            const data = await getProductores();
            setProductores(data);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar los productores."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProductores();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const openCreate = () => {
        setEditing(null);
        setForm(initialForm);
        setError("");
        setShowModal(true);
    };

    const openEdit = (productor) => {
        setEditing(productor);

        setForm({
            email: productor.usuario.email,
            password: "",
            nombres: productor.nombres,
            apellidos: productor.apellidos,
            telefono: productor.telefono ?? ""
        });

        setError("");
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            if (editing) {
                const data = {
                    email: form.email,
                    nombres: form.nombres,
                    apellidos: form.apellidos,
                    telefono: form.telefono
                };

                await updateProductor(editing.id, data);
            } else {
                await createProductor(form);
            }

            setShowModal(false);
            await loadProductores();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible guardar el productor."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEstado = async (productor) => {
        setError("");
        setChangingId(productor.id);

        try {
            await cambiarEstadoProductor(
                productor.id,
                !productor.usuario.activo
            );

            await loadProductores();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cambiar el estado del productor."
            );
        } finally {
            setChangingId(null);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold">Productores</h1>
                    <p className="text-secondary mb-0">
                        Administra las cuentas de los productores.
                    </p>
                </div>

                <Button onClick={openCreate}>
                    <i className="bi bi-person-add me-2"/>
                    Nuevo productor
                </Button>
            </div>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead>
                    <tr>
                        <th>Productor</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                    </thead>

                    <tbody>
                    {productores.map((productor) => {
                        const nombre = `${productor.nombres} ${productor.apellidos}`;

                        return (
                            <tr key={productor.id}>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <UserAvatar
                                            nombre={nombre}
                                            size={38}
                                        />

                                        <div>
                                            <div className="fw-semibold">
                                                {nombre}
                                            </div>

                                            <small className="text-secondary">
                                                {productor.usuario.email}
                                            </small>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    {productor.telefono || "-"}
                                </td>

                                <td>
                                    <Badge
                                        bg={
                                            productor.usuario.activo
                                                ? "success"
                                                : "secondary"
                                        }
                                    >
                                        {productor.usuario.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </Badge>
                                </td>

                                <td className="text-end">
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        className="me-2"
                                        onClick={() => openEdit(productor)}
                                    >
                                        <i className="bi bi-pencil me-1" />
                                        Editar
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant={
                                            productor.usuario.activo
                                                ? "outline-danger"
                                                : "outline-success"
                                        }
                                        disabled={changingId === productor.id}
                                        onClick={() => handleEstado(productor)}
                                    >
                                        {changingId === productor.id ? (
                                            "Guardando..."
                                        ) : productor.usuario.activo ? (
                                            <>
                                                <i className="bi bi-person-x me-1" />
                                                Desactivar
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-check me-1" />
                                                Activar
                                            </>
                                        )}
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}

                    {productores.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="text-center text-secondary py-4"
                            >
                                No hay productores registrados.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
            >
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editing
                                ? "Editar productor"
                                : "Nuevo productor"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Correo</Form.Label>
                            <Form.Control
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {!editing && (
                            <Form.Group className="mb-3">
                                <Form.Label>Contraseña inicial</Form.Label>
                                <Form.Control
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Nombres</Form.Label>
                            <Form.Control
                                name="nombres"
                                value={form.nombres}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Apellidos</Form.Label>
                            <Form.Control
                                name="apellidos"
                                value={form.apellidos}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                                name="telefono"
                                type="tel"
                                value={form.telefono}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            <i
                                className={
                                    editing
                                        ? "bi bi-floppy me-2"
                                        : "bi bi-plus-lg me-2"
                                }
                            />
                            {saving
                                ? "Guardando..."
                                : editing
                                    ? "Guardar cambios"
                                    : "Crear productor"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}