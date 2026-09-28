import { useEffect, useMemo, useState } from "react";

import {
    getCategorias,
    createCategoria,
    updateCategoria,
    deactivateCategoria,
    reactivateCategoria
} from "../services/categoria.service";

import { useAuth } from "../context/AuthContext";

const Categorias = () => {
    const { usuario } = useAuth();

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [incluirInactivos, setIncluirInactivos] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [selectedCategoria, setSelectedCategoria] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        estado: true
    });

    const esAdmin = usuario?.rol === "ADMIN";

    const cargarCategorias = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getCategorias(
                esAdmin && incluirInactivos
            );

            setCategorias(data);
        } catch (error) {
            setError(
                error.response?.data?.error ??
                "No fue posible cargar las categorías."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCategorias();
    }, [incluirInactivos]);

    const categoriasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return categorias.filter(categoria => {
            const nombre =
                categoria.nombre?.toLowerCase() ?? "";

            const descripcion =
                categoria.descripcion?.toLowerCase() ?? "";

            return (
                nombre.includes(texto) ||
                descripcion.includes(texto)
            );
        });
    }, [categorias, busqueda]);

    const abrirCrear = () => {
        setSelectedCategoria(null);

        setFormData({
            nombre: "",
            descripcion: "",
            estado: true
        });

        setError("");
        setShowForm(true);
    };

    const abrirEditar = categoria => {
        setSelectedCategoria(categoria);

        setFormData({
            nombre: categoria.nombre ?? "",
            descripcion: categoria.descripcion ?? "",
            estado: categoria.estado ?? true
        });

        setError("");
        setShowForm(true);
    };

    const cerrarFormulario = () => {
        if (saving) {
            return;
        }

        setShowForm(false);
        setSelectedCategoria(null);
    };

    const handleChange = event => {
        const { name, value, type, checked } = event.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const data = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim() || null,
                estado: formData.estado
            };

            if (selectedCategoria) {
                await updateCategoria(
                    selectedCategoria.id_categoria,
                    data
                );
            } else {
                await createCategoria(data);
            }

            setShowForm(false);
            setSelectedCategoria(null);

            await cargarCategorias();
        } catch (error) {
            setError(
                error.response?.data?.error ??
                "No fue posible guardar la categoría."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDesactivar = async categoria => {
        const confirmar = window.confirm(
            `¿Deseas desactivar la categoría "${categoria.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setError("");

            await deactivateCategoria(
                categoria.id_categoria
            );

            await cargarCategorias();
        } catch (error) {
            setError(
                error.response?.data?.error ??
                "No fue posible desactivar la categoría."
            );
        }
    };

    const handleReactivar = async categoria => {
        const confirmar = window.confirm(
            `¿Deseas reactivar la categoría "${categoria.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setError("");

            await reactivateCategoria(
                categoria.id_categoria
            );

            await cargarCategorias();
        } catch (error) {
            setError(
                error.response?.data?.error ??
                "No fue posible reactivar la categoría."
            );
        }
    };

    return (
        <div>

            {/* ENCABEZADO */}

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Categorías
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Organiza los servicios del catálogo por categoría.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={abrirCrear}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                    + Nueva categoría
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* FILTROS */}

            <div className="mt-8 grid gap-4 md:grid-cols-2">

                <div>

                    <label
                        htmlFor="busquedaCategoria"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Buscar categoría
                    </label>

                    <input
                        id="busquedaCategoria"
                        type="text"
                        value={busqueda}
                        onChange={event =>
                            setBusqueda(event.target.value)
                        }
                        placeholder="Nombre o descripción..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

                {esAdmin && (
                    <div className="flex items-end">

                        <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">

                            <input
                                type="checkbox"
                                checked={incluirInactivos}
                                onChange={event =>
                                    setIncluirInactivos(
                                        event.target.checked
                                    )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="text-sm font-medium text-gray-700">
                                Mostrar inactivas
                            </span>

                        </label>

                    </div>
                )}

            </div>

            {/* CONTADOR */}

            {!loading && (
                <div className="mt-6">

                    <p className="text-sm text-gray-500">
                        {categoriasFiltradas.length}{" "}
                        {categoriasFiltradas.length === 1
                            ? "categoría encontrada"
                            : "categorías encontradas"}
                    </p>

                </div>
            )}

            {/* TABLA */}

            {loading ? (

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                    Cargando categorías...
                </div>

            ) : categoriasFiltradas.length === 0 ? (

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        No se encontraron categorías
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        {busqueda
                            ? "No existen categorías que coincidan con la búsqueda."
                            : "Todavía no hay categorías registradas."
                        }
                    </p>

                    {!busqueda && (
                        <button
                            type="button"
                            onClick={abrirCrear}
                            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Crear primera categoría
                        </button>
                    )}

                </div>

            ) : (

                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[750px]">

                            <thead className="border-b border-gray-200 bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Categoría
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Descripción
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Estado
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Acciones
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {categoriasFiltradas.map(categoria => (

                                    <tr
                                        key={categoria.id_categoria}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* CATEGORÍA */}

                                        <td className="px-6 py-5">

                                            <p className="font-semibold text-gray-900">
                                                {categoria.nombre}
                                            </p>

                                        </td>

                                        {/* DESCRIPCIÓN */}

                                        <td className="max-w-md px-6 py-5">

                                            <p className="text-sm text-gray-600">
                                                {categoria.descripcion ||
                                                    "Sin descripción."}
                                            </p>

                                        </td>

                                        {/* ESTADO */}

                                        <td className="px-6 py-5">

                                            {categoria.estado ? (

                                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                    Activa
                                                </span>

                                            ) : (

                                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                                    Inactiva
                                                </span>

                                            )}

                                        </td>

                                        {/* ACCIONES */}

                                        <td className="px-6 py-5">

                                            <div className="flex justify-end gap-2">

                                                {categoria.estado ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                abrirEditar(
                                                                    categoria
                                                                )
                                                            }
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDesactivar(
                                                                    categoria
                                                                )
                                                            }
                                                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Desactivar
                                                        </button>
                                                    </>
                                                ) : (

                                                    esAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReactivar(
                                                                    categoria
                                                                )
                                                            }
                                                            className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50"
                                                        >
                                                            Reactivar
                                                        </button>
                                                    )

                                                )}

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

            {/* MODAL */}

            {showForm && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">

                    <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">

                        <div className="max-h-[90vh] overflow-y-auto p-6">

                            {/* CABECERA */}

                            <div className="flex items-center justify-between">

                                <div>

                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedCategoria
                                            ? "Editar categoría"
                                            : "Nueva categoría"}
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedCategoria
                                            ? "Modifica la información de la categoría."
                                            : "Agrega una nueva categoría al catálogo."
                                        }
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={cerrarFormulario}
                                    disabled={saving}
                                    className="text-2xl text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    ×
                                </button>

                            </div>

                            {/* FORMULARIO */}

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-5"
                            >

                                {/* NOMBRE */}

                                <div>

                                    <label
                                        htmlFor="nombreCategoria"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Nombre
                                    </label>

                                    <input
                                        id="nombreCategoria"
                                        name="nombre"
                                        type="text"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        minLength={2}
                                        maxLength={80}
                                        placeholder="Ej. Banquetería"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                {/* DESCRIPCIÓN */}

                                <div>

                                    <label
                                        htmlFor="descripcionCategoria"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Descripción
                                    </label>

                                    <textarea
                                        id="descripcionCategoria"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        maxLength={500}
                                        rows={4}
                                        placeholder="Describe el tipo de servicios que pertenecen a esta categoría..."
                                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                {/* ESTADO */}

                                <label className="flex cursor-pointer items-center gap-3">

                                    <input
                                        type="checkbox"
                                        name="estado"
                                        checked={formData.estado}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    <span className="text-sm font-medium text-gray-700">
                                        Categoría activa
                                    </span>

                                </label>

                                {/* BOTONES */}

                                <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                                    <button
                                        type="button"
                                        onClick={cerrarFormulario}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Guardando..."
                                            : selectedCategoria
                                                ? "Guardar cambios"
                                                : "Crear categoría"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Categorias;