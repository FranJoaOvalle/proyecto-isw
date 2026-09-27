import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getServicios,
    createServicio,
    updateServicio,
    deactivateServicio,
    reactivateServicio
} from "../services/servicio.service";
import { getCategorias } from "../services/categoria.service";
import { useAuth } from "../context/AuthContext";

export default function Servicios() {
    const { usuario } = useAuth();

    const [servicios, setServicios] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [incluirInactivos, setIncluirInactivos] = useState(false);

    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [selectedServicio, setSelectedServicio] = useState(null);

    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio_base: "",
        estado: true,
        id_categoria: ""
    });

    const esAdmin = usuario?.rol === "ADMIN";

    const loadServicios = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getServicios(incluirInactivos);
            setServicios(data);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar los servicios."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar las categorías."
            );
        }
    };

    useEffect(() => {
        loadServicios();
    }, [incluirInactivos]);

    useEffect(() => {
        loadCategorias();
    }, []);

    const handleChange = event => {
        const { name, value, type, checked } = event.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            nombre: "",
            descripcion: "",
            precio_base: "",
            estado: true,
            id_categoria: ""
        });

        setSelectedServicio(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowForm(true);
        setError("");
    };

    const handleEdit = servicio => {
        setSelectedServicio(servicio);

        setFormData({
            nombre: servicio.nombre ?? "",
            descripcion: servicio.descripcion ?? "",
            precio_base: servicio.precio_base ?? "",
            estado: servicio.estado,
            id_categoria: servicio.id_categoria ?? ""
        });

        setShowForm(true);
        setError("");
    };

    const handleSubmit = async event => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const data = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                precio_base: Number(formData.precio_base),
                estado: formData.estado,
                id_categoria: Number(formData.id_categoria)
            };

            if (selectedServicio) {
                await updateServicio(
                    selectedServicio.id_servicio,
                    data
                );
            } else {
                await createServicio(data);
            }

            resetForm();
            setShowForm(false);

            await loadServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible guardar el servicio."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async id => {
        try {
            setError("");

            await deactivateServicio(id);
            await loadServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible desactivar el servicio."
            );
        }
    };

    const handleReactivate = async id => {
        try {
            setError("");

            await reactivateServicio(id);
            await loadServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible reactivar el servicio."
            );
        }
    };

    const getNombreCategoria = idCategoria => {
        const categoria = categorias.find(
            categoria =>
                categoria.id_categoria === idCategoria
        );

        return categoria?.nombre ?? "Sin categoría";
    };

    const serviciosFiltrados = servicios.filter(servicio => {
        const textoBusqueda = busqueda.trim().toLowerCase();

        const nombreServicio =
            servicio.nombre?.toLowerCase() ?? "";

        const nombreCategoria =
            getNombreCategoria(servicio.id_categoria)
                .toLowerCase();

        const coincideBusqueda =
            nombreServicio.includes(textoBusqueda) ||
            nombreCategoria.includes(textoBusqueda);

        const coincideCategoria =
            categoriaFiltro === "" ||
            String(servicio.id_categoria) ===
                String(categoriaFiltro);

        return coincideBusqueda && coincideCategoria;
    });

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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Catálogo de servicios
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Gestiona los servicios disponibles en el sistema.
                        </p>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                    >
                        Nuevo servicio
                    </button>
                </div>

                {esAdmin && (
                    <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={incluirInactivos}
                            onChange={event =>
                                setIncluirInactivos(
                                    event.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />

                        Mostrar servicios inactivos
                    </label>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Buscar servicio
                        </label>

                        <input
                            type="text"
                            value={busqueda}
                            onChange={event =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Buscar por nombre o categoría..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Filtrar por categoría
                        </label>

                        <select
                            value={categoriaFiltro}
                            onChange={event =>
                                setCategoriaFiltro(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="">
                                Todas las categorías
                            </option>

                            {categorias.map(categoria => (
                                <option
                                    key={categoria.id_categoria}
                                    value={categoria.id_categoria}
                                >
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Cargando servicios...
                    </div>
                ) : serviciosFiltrados.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                        {servicios.length === 0
                            ? "No hay servicios para mostrar."
                            : "No se encontraron servicios con los filtros seleccionados."}
                    </div>
                ) : (
                    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-sm text-gray-600">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">
                                            Nombre
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Descripción
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Precio base
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Categoría
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Estado
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Gestionar
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {serviciosFiltrados.map(
                                        servicio => (
                                            <tr
                                                key={
                                                    servicio.id_servicio
                                                }
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {servicio.nombre}
                                                </td>

                                                <td className="max-w-sm px-6 py-4 text-sm text-gray-600">
                                                    {servicio.descripcion}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    $
                                                    {Number(
                                                        servicio.precio_base
                                                    ).toLocaleString(
                                                        "es-CL"
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {getNombreCategoria(
                                                        servicio.id_categoria
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm">
                                                    {servicio.estado ? (
                                                        <span className="font-medium text-green-600">
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium text-red-600">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {servicio.estado && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            servicio
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                                >
                                                                    Editar
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        handleDeactivate(
                                                                            servicio.id_servicio
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                                                                >
                                                                    Desactivar
                                                                </button>
                                                            </>
                                                        )}

                                                        {!servicio.estado &&
                                                            esAdmin && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleReactivate(
                                                                            servicio.id_servicio
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                                                                >
                                                                    Reactivar
                                                                </button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedServicio
                                        ? "Editar servicio"
                                        : "Nuevo servicio"}
                                </h2>

                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="text-2xl text-gray-400 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-4"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Nombre
                                    </label>

                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Descripción
                                    </label>

                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        required
                                        minLength={10}
                                        maxLength={500}
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Precio base
                                    </label>

                                    <input
                                        type="number"
                                        name="precio_base"
                                        value={formData.precio_base}
                                        onChange={handleChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Categoría
                                    </label>

                                    <select
                                        name="id_categoria"
                                        value={formData.id_categoria}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                                    >
                                        <option value="">
                                            Seleccionar categoría
                                        </option>

                                        {categorias.map(
                                            categoria => (
                                                <option
                                                    key={
                                                        categoria.id_categoria
                                                    }
                                                    value={
                                                        categoria.id_categoria
                                                    }
                                                >
                                                    {categoria.nombre}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="estado"
                                        checked={formData.estado}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                    />

                                    Servicio activo
                                </label>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Guardando..."
                                            : selectedServicio
                                                ? "Guardar cambios"
                                                : "Crear servicio"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}