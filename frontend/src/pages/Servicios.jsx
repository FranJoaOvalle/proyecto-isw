import { useEffect, useMemo, useState } from "react";
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

const Servicios = () => {
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
        id_categoria: "",
        imagen_url: ""
    });

    const esAdmin = usuario?.rol === "ADMIN";

    const cargarServicios = async () => {
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

    const cargarCategorias = async () => {
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
        cargarServicios();
    }, [incluirInactivos]);

    useEffect(() => {
        cargarCategorias();
    }, []);

    const getNombreCategoria = idCategoria => {
        const categoria = categorias.find(
            categoria =>
                categoria.id_categoria === idCategoria
        );

        return categoria?.nombre ?? "Sin categoría";
    };

    const serviciosFiltrados = useMemo(() => {
        const textoBusqueda = busqueda.trim().toLowerCase();

        return servicios.filter(servicio => {
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
    }, [
        servicios,
        busqueda,
        categoriaFiltro,
        categorias
    ]);

    const abrirCrear = () => {
        setSelectedServicio(null);

        setFormData({
            nombre: "",
            descripcion: "",
            precio_base: "",
            estado: true,
            id_categoria: "",
            imagen_url: ""
        });

        setError("");
        setShowForm(true);
    };

    const abrirEditar = servicio => {
        setSelectedServicio(servicio);

        setFormData({
            nombre: servicio.nombre ?? "",
            descripcion: servicio.descripcion ?? "",
            precio_base: servicio.precio_base ?? "",
            estado: servicio.estado ?? true,
            id_categoria: servicio.id_categoria ?? "",
            imagen_url: servicio.imagen_url ?? ""
        });

        setError("");
        setShowForm(true);
    };

    const cerrarFormulario = () => {
        if (saving) {
            return;
        }

        setShowForm(false);
        setSelectedServicio(null);
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
                descripcion: formData.descripcion.trim(),
                precio_base: Number(formData.precio_base),
                estado: formData.estado,
                id_categoria: Number(formData.id_categoria),
                imagen_url: formData.imagen_url.trim() || null
            };

            if (selectedServicio) {
                await updateServicio(
                    selectedServicio.id_servicio,
                    data
                );
            } else {
                await createServicio(data);
            }

            setShowForm(false);
            setSelectedServicio(null);

            await cargarServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible guardar el servicio."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDesactivar = async servicio => {
        const confirmar = window.confirm(
            `¿Deseas desactivar el servicio "${servicio.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setError("");

            await deactivateServicio(
                servicio.id_servicio
            );

            await cargarServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible desactivar el servicio."
            );
        }
    };

    const handleReactivar = async servicio => {
        const confirmar = window.confirm(
            `¿Deseas reactivar el servicio "${servicio.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setError("");

            await reactivateServicio(
                servicio.id_servicio
            );

            await cargarServicios();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible reactivar el servicio."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* NAVBAR */}
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <span className="text-xl font-bold text-blue-600">
                    NES Eventos
                </span>

                <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
                >
                    Volver al dashboard
                </Link>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <main className="p-8">

                {/* ENCABEZADO */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Catálogo de servicios
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Consulta y gestiona los servicios disponibles para los eventos.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={abrirCrear}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        + Nuevo servicio
                    </button>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* FILTROS */}
                <div className="mt-8 grid gap-4 md:grid-cols-3">

                    {/* BUSCAR */}
                    <div>
                        <label
                            htmlFor="busqueda"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Buscar servicio
                        </label>

                        <input
                            id="busqueda"
                            type="text"
                            value={busqueda}
                            onChange={event =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Nombre o categoría..."
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* CATEGORÍA */}
                    <div>
                        <label
                            htmlFor="categoriaFiltro"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Filtrar por categoría
                        </label>

                        <select
                            id="categoriaFiltro"
                            value={categoriaFiltro}
                            onChange={event =>
                                setCategoriaFiltro(event.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                    {/* MOSTRAR INACTIVOS */}
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
                                    Mostrar inactivos
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* SERVICIOS */}
                {loading ? (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                        Cargando servicios...
                    </div>
                ) : serviciosFiltrados.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                        No se encontraron servicios.
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

                        {serviciosFiltrados.map(servicio => (
                            <div
                                key={servicio.id_servicio}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                            >

                                {/* IMAGEN */}
                                <div className="relative h-52 w-full overflow-hidden bg-gray-100">

                                    {servicio.imagen_url ? (
                                        <img
                                            src={servicio.imagen_url}
                                            alt={servicio.nombre}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            onError={event => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                            Sin imagen
                                        </div>
                                    )}

                                    {/* DEGRADADO */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                    {/* CATEGORÍA */}
                                    <div className="absolute bottom-4 left-4">
                                        <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                                            {getNombreCategoria(
                                                servicio.id_categoria
                                            )}
                                        </span>
                                    </div>

                                    {/* ESTADO */}
                                    <div className="absolute right-4 top-4">
                                        {servicio.estado ? (
                                            <span className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>

                                </div>

                                {/* INFORMACIÓN */}
                                <div className="flex flex-1 flex-col p-5">

                                    <h2 className="text-xl font-bold text-gray-900">
                                        {servicio.nombre}
                                    </h2>

                                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-600">
                                        {servicio.descripcion}
                                    </p>

                                    {/* PRECIO */}
                                    <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
                                        <p className="text-sm text-gray-500">
                                            Precio base
                                        </p>

                                        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                                            $
                                            {Number(
                                                servicio.precio_base
                                            ).toLocaleString("es-CL")}
                                        </p>
                                    </div>

                                    {/* BOTONES */}
                                    <div className="mt-5 flex gap-2">

                                        {servicio.estado && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    abrirEditar(servicio)
                                                }
                                                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {servicio.estado ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDesactivar(
                                                        servicio
                                                    )
                                                }
                                                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                                            >
                                                Desactivar
                                            </button>
                                        ) : (
                                            esAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleReactivar(
                                                            servicio
                                                        )
                                                    }
                                                    className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                                                >
                                                    Reactivar
                                                </button>
                                            )
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </main>

            {/* MODAL CREAR / EDITAR */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">

                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">

                        <div className="max-h-[90vh] overflow-y-auto p-6">

                            {/* CABECERA */}
                            <div className="flex items-center justify-between">

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedServicio
                                            ? "Editar servicio"
                                            : "Nuevo servicio"}
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Completa los datos del servicio.
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
                                        htmlFor="nombre"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Nombre
                                    </label>

                                    <input
                                        id="nombre"
                                        name="nombre"
                                        type="text"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ej. Banquetería"
                                    />
                                </div>

                                {/* DESCRIPCIÓN */}
                                <div>
                                    <label
                                        htmlFor="descripcion"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Descripción
                                    </label>

                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        required
                                        minLength={10}
                                        maxLength={500}
                                        rows={4}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Describe el servicio..."
                                    />
                                </div>

                                {/* PRECIO Y CATEGORÍA */}
                                <div className="grid gap-5 md:grid-cols-2">

                                    <div>
                                        <label
                                            htmlFor="precio_base"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Precio base
                                        </label>

                                        <input
                                            id="precio_base"
                                            name="precio_base"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={formData.precio_base}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="150000"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="id_categoria"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Categoría
                                        </label>

                                        <select
                                            id="id_categoria"
                                            name="id_categoria"
                                            value={formData.id_categoria}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">
                                                Selecciona una categoría
                                            </option>

                                            {categorias.map(categoria => (
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
                                            ))}
                                        </select>
                                    </div>

                                </div>

                                {/* URL IMAGEN */}
                                <div>
                                    <label
                                        htmlFor="imagen_url"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        URL de imagen
                                    </label>

                                    <input
                                        id="imagen_url"
                                        name="imagen_url"
                                        type="url"
                                        value={formData.imagen_url}
                                        onChange={handleChange}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-2 text-xs text-gray-500">
                                        Puedes dejar este campo vacío si el servicio no tendrá imagen.
                                    </p>
                                </div>

                                {/* VISTA PREVIA */}
                                {formData.imagen_url.trim() && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">
                                            Vista previa
                                        </p>

                                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                            <img
                                                src={formData.imagen_url}
                                                alt="Vista previa"
                                                className="h-48 w-full object-cover"
                                                onError={event => {
                                                    event.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

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
                                        Servicio activo
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
};

export default Servicios;