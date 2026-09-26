import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getClientes,
    createCliente,
    updateCliente,
    deactivateCliente,
    reactivateCliente
} from "../services/cliente.service";
import { useAuth } from "../context/AuthContext";

export default function Clientes() {
    const { usuario } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [incluirInactivos, setIncluirInactivos] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        notas: ""
    });

    const [selectedCliente, setSelectedCliente] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        notas: ""
    });

    const [saving, setSaving] = useState(false);

    const loadClientes = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getClientes(incluirInactivos);
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

    const handleChange = e => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditChange = e => {
        const { name, value } = e.target;

        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdate = async e => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await updateCliente(selectedCliente.id, {
                nombre: editForm.nombre,
                email: editForm.email || null,
                telefono: editForm.telefono || null,
                direccion: editForm.direccion || null,
                notas: editForm.notas || null
            });

            setSelectedCliente(null);
            await loadClientes();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible modificar el cliente."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm("¿Deseas desactivar este cliente?"))
            return;

        try {
            setError("");
            await deactivateCliente(selectedCliente.id);

            setSelectedCliente(null);
            await loadClientes();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible desactivar el cliente."
            );
        }
    };

    const handleReactivate = async () => {
        try {
            setError("");
            await reactivateCliente(selectedCliente.id);

            setSelectedCliente(null);
            await loadClientes();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible reactivar el cliente."
            );
        }
    };

    const handleCreate = async e => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await createCliente({
                nombre: form.nombre,
                email: form.email || null,
                telefono: form.telefono || null,
                direccion: form.direccion || null,
                notas: form.notas || null
            });

            setForm({
                nombre: "",
                email: "",
                telefono: "",
                direccion: "",
                notas: ""
            });

            setShowForm(false);
            await loadClientes();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible registrar el cliente."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleManage = cliente => {
        setSelectedCliente(cliente);

        setEditForm({
            nombre: cliente.nombre ?? "",
            email: cliente.email ?? "",
            telefono: cliente.telefono ?? "",
            direccion: cliente.direccion ?? "",
            notas: cliente.notas ?? ""
        });
    };

    useEffect(() => {
        loadClientes();
    }, [incluirInactivos]);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <Link
                    to="/dashboard"
                    className="text-xl font-bold text-blue-600"
                >
                    NES Eventos
                </Link>

                <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600"
                >
                    Volver al dashboard
                </Link>
            </nav>

            <main className="p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Clientes
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Gestiona los clientes registrados en el sistema.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                        Nuevo cliente
                    </button>
                </div>

                {usuario?.rol === "ADMIN" && (
                    <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={incluirInactivos}
                            onChange={e => setIncluirInactivos(e.target.checked)}
                        />

                        Mostrar clientes inactivos
                    </label>
                )}

                {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Nuevo cliente
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="mt-6 space-y-4">
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Nombre"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                                />

                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Correo"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                                />

                                <input
                                    name="telefono"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    placeholder="Teléfono"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                                />

                                <input
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    placeholder="Dirección"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                                />

                                <textarea
                                    name="notas"
                                    value={form.notas}
                                    onChange={handleChange}
                                    placeholder="Notas"
                                    rows="3"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                                />

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                                    >
                                        {saving ? "Guardando..." : "Registrar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedCliente && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Gestionar cliente
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setSelectedCliente(null)}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
                                <input
                                    name="nombre"
                                    value={editForm.nombre}
                                    onChange={handleEditChange}
                                    required
                                    disabled={!selectedCliente.activo}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                                />

                                <input
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    disabled={!selectedCliente.activo}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                                />

                                <input
                                    name="telefono"
                                    value={editForm.telefono}
                                    onChange={handleEditChange}
                                    disabled={!selectedCliente.activo}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                                />

                                <input
                                    name="direccion"
                                    value={editForm.direccion}
                                    onChange={handleEditChange}
                                    disabled={!selectedCliente.activo}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                                />

                                <textarea
                                    name="notas"
                                    value={editForm.notas}
                                    onChange={handleEditChange}
                                    rows="3"
                                    disabled={!selectedCliente.activo}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                                />

                                <div className="flex justify-between pt-2">
                                    <div>
                                        {selectedCliente.activo ? (
                                            <button
                                                type="button"
                                                onClick={handleDeactivate}
                                                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                                            >
                                                Desactivar
                                            </button>
                                        ) : (
                                            usuario?.rol === "ADMIN" && (
                                                <button
                                                    type="button"
                                                    onClick={handleReactivate}
                                                    className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                                                >
                                                    Reactivar
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCliente(null)}
                                            className="rounded-lg border border-gray-300 px-4 py-2"
                                        >
                                            Cancelar
                                        </button>

                                        {selectedCliente.activo && (
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                                            >
                                                {saving ? "Guardando..." : "Guardar cambios"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <p className="mt-8 text-gray-500">
                        Cargando clientes...
                    </p>
                ) : (
                    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-sm text-gray-600">
                            <tr>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Correo</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                            {clientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {cliente.nombre}
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">
                                        {cliente.email ?? "—"}
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">
                                        {cliente.telefono ?? "—"}
                                    </td>

                                    <td className="px-6 py-4">
                                        {cliente.activo ? "Activo" : "Inactivo"}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleManage(cliente)}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {clientes.length === 0 && (
                            <p className="p-8 text-center text-gray-500">
                                No hay clientes registrados.
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}