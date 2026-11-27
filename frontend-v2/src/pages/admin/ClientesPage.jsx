import ConfirmModal from "../../components/ConfirmModal";
import ActionButton from "../../components/ActionButton";
import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Container,
    Spinner,
    Table,
    Form
} from "react-bootstrap";

import {
    getClientes,
    cambiarEstadoCliente
} from "../../services/cliente.service";

import UserAvatar from "../../components/UserAvatar";
import TableToolbar from "../../components/admin/TableToolbar";

export default function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendiente, setPendiente] = useState(null);
    const [changingIds, setChangingIds] = useState([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [tipo, setTipo] = useState("TODOS");

    useEffect(() => {
        const loadClientes = async () => {
            try {
                const data = await getClientes();
                setClientes(data);
            } catch (error) {
                setError(
                    error.response?.data?.error?.message ??
                    "No fue posible cargar los clientes."
                );
            } finally {
                setLoading(false);
            }
        };

        loadClientes();
    }, []);

    const handleEstado = async (cliente) => {
        if (!cliente || changingIds.includes(cliente.id)) return;
        setError("");
        setChangingIds(ids => [...ids, cliente.id]);

        try {
            const actualizado = await cambiarEstadoCliente(
                cliente.id,
                !cliente.usuario.activo
            );

            setClientes((current) =>
                current.map((item) =>
                    item.id === cliente.id ? actualizado : item
                )
            );
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cambiar el estado del cliente."
            );
        } finally {
            setPendiente(actual => actual?.id === cliente.id ? null : actual);
            setChangingIds(ids => ids.filter(id => id !== cliente.id));
        }
    };

    const getNombre = (cliente) => {
        if (cliente.tipo === "PERSONA")
            return `${cliente.persona?.nombres ?? ""} ${cliente.persona?.apellidos ?? ""}`.trim();

        return cliente.empresa?.razonSocial ?? "Empresa";
    };

    const getRut = (cliente) => {
        if (cliente.tipo === "PERSONA")
            return cliente.persona?.rut ?? "-";

        return cliente.empresa?.rutEmpresa ?? "-";
    };

    const clientesFiltrados = clientes.filter((cliente) => {
        const nombre = getNombre(cliente).toLowerCase();
        const rut = getRut(cliente).toLowerCase();
        const email = cliente.usuario.email.toLowerCase();
        const termino = search.toLowerCase().trim();

        const coincideBusqueda =
            !termino ||
            nombre.includes(termino) ||
            rut.includes(termino) ||
            email.includes(termino);

        const coincideEstado =
            estado === "TODOS" ||
            (estado === "ACTIVOS" && cliente.usuario.activo) ||
            (estado === "INACTIVOS" && !cliente.usuario.activo);

        const coincideTipo =
            tipo === "TODOS" ||
            cliente.tipo === tipo;

        return coincideBusqueda && coincideEstado && coincideTipo;
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <div className="mb-4">
                <h1 className="fw-bold">Clientes</h1>
                <p className="text-secondary mb-0">
                    Consulta clientes registrados y administra sus cuentas.
                </p>
            </div>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre, correo o RUT..."
                estado={estado}
                onEstadoChange={setEstado}
            >
                <Form.Select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    style={{ maxWidth: 180 }}
                >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="PERSONA">Persona</option>
                    <option value="EMPRESA">Empresa</option>
                </Form.Select>
            </TableToolbar>

            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>RUT</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                    </thead>

                    <tbody>
                    {clientesFiltrados.map((cliente) => {
                        const nombre = getNombre(cliente);

                        return (
                            <tr key={cliente.id}>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <UserAvatar
                                            nombre={nombre}
                                            userId={cliente.usuario?.id}
                                            size={36}
                                        />

                                        <div>
                                            <div className="fw-semibold">
                                                {nombre}
                                            </div>

                                            <small className="text-secondary">
                                                {cliente.usuario.email}
                                            </small>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <span className="table-type">
                                        <span
                                            className={`table-type-icon ${
                                                cliente.tipo === "PERSONA" 
                                                    ? "table-type-person" 
                                                    : "table-type-company"
                                            }`}
                                            aria-hidden="true"
                                        >
                                            <i
                                                className={`bi ${
                                                    cliente.tipo === "PERSONA" 
                                                        ? "bi-person" 
                                                        : "bi-building"
                                                }`}
                                            />
                                        </span>
                                        {cliente.tipo === "PERSONA" ? "Persona" : "Empresa"}
                                    </span>
                                </td>

                                <td>{getRut(cliente)}</td>

                                <td>
                                    <Badge bg={cliente.usuario.activo ? "success" : "secondary"}>
                                        {cliente.usuario.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </td>

                                <td className="text-end">
                                    <div className="table-actions">
                                        <ActionButton
                                            icon={cliente.usuario.activo ? "bi-person-x" : "bi-person-check"}
                                            label={cliente.usuario.activo ? "Desactivar cuenta" : "Activar cuenta"}
                                            variant={cliente.usuario.activo ? "outline-danger" : "outline-success"}
                                            onClick={() => cliente.usuario.activo ? setPendiente(cliente) : handleEstado(cliente)}
                                            loading={changingIds.includes(cliente.id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {clientesFiltrados.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="text-center text-secondary py-4"
                            >
                                No se encontraron clientes.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>
            <ConfirmModal
                show={Boolean(pendiente)}
                onHide={() => setPendiente(null)}
                onConfirm={() => handleEstado(pendiente)}
                loading={changingIds.includes(pendiente?.id)}
                title="Desactivar cuenta"
                confirmText="Desactivar cuenta"
            >
                La cuenta de <strong>{pendiente && (getNombre(pendiente) || pendiente.usuario.email)}</strong> quedará desactivada. El cliente podrá volver a iniciar sesión cuando reactives la cuenta.
            </ConfirmModal>
        </Container>
    );
}
