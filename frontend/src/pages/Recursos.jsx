import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Espacios from "./Espacios";
import { getRecursos, createRecurso, updateRecurso } from "../services/recurso.service";

const formularioInicial = {
    nombre: "", tipo: "", cantidad: "", estado: "DISPONIBLE", observaciones: ""
};

const estados = {
    DISPONIBLE: "Disponible",
    EN_REPARACION: "En reparación",
    RETIRADO: "Retirado"
};

const coloresEstado = {
    DISPONIBLE: "bg-green-100 text-green-800",
    EN_REPARACION: "bg-yellow-100 text-yellow-800",
    RETIRADO: "bg-gray-50 text-gray-700"
};

const Recursos = () => {
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [recarga, setRecarga] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(formularioInicial);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedRecurso, setSelectedRecurso] = useState(null);

    const abrirCrear = () => {
        setSelectedRecurso(null);
        setFormData({ ...formularioInicial });
        setFormError("");
        setSuccess("");
        setShowForm(true);
    };

    const abrirEditar = recurso => {
        setSelectedRecurso(recurso);
        setFormData({
            nombre: recurso.nombre,
            tipo: recurso.tipo,
            cantidad: String(recurso.cantidad),
            estado: recurso.estado,
            observaciones: recurso.observaciones ?? ""
        });
        setFormError("");
        setSuccess("");
        setShowForm(true);
    };

    const handleChange = event => {
        const { name, value } = event.target;
        setFormData(actual => ({ ...actual, [name]: value }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (saving) return;
        const cantidad = Number(formData.cantidad);
        if (formData.nombre.trim().length < 2 || formData.tipo.trim().length < 2) {
            setFormError("El nombre y el tipo deben tener al menos 2 caracteres.");
            return;
        }
        if (formData.cantidad.trim() === "" || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 2147483647) {
            setFormError("La cantidad debe ser un entero entre 0 y 2147483647.");
            return;
        }

        try {
            setSaving(true);
            setFormError("");
            const data = {
                ...formData,
                nombre: formData.nombre.trim(),
                tipo: formData.tipo.trim(),
                cantidad,
                observaciones: formData.observaciones.trim() || null
            };
            if (selectedRecurso) {
                await updateRecurso(selectedRecurso.id_recurso, data);
            } else {
                await createRecurso(data);
            }
            setShowForm(false);
            setSuccess(selectedRecurso ? "Recurso actualizado correctamente." : "Recurso registrado correctamente.");
            setSelectedRecurso(null);
            setBusqueda("");
            setEstadoFiltro("");
            recargar();
        } catch (error) {
            setFormError(error.response?.data?.error?.message ?? "No fue posible guardar el recurso.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let activo = true;

        const cargarRecursos = async () => {
            try {
                const data = await getRecursos();
                if (activo) setRecursos(data);
            } catch (error) {
                if (activo) {
                    setError(
                        error.response?.data?.error?.message ??
                        "No fue posible cargar los recursos."
                    );
                }
            } finally {
                if (activo) setLoading(false);
            }
        };

        cargarRecursos();
        return () => { activo = false; };
    }, [recarga]);

    const recursosFiltrados = useMemo(() => {
        const textoBusqueda = busqueda.trim().toLowerCase();

        return recursos.filter(recurso => {
            const coincideBusqueda =
                recurso.nombre.toLowerCase().includes(textoBusqueda) ||
                recurso.tipo.toLowerCase().includes(textoBusqueda);
            const coincideEstado =
                estadoFiltro === "" || recurso.estado === estadoFiltro;

            return coincideBusqueda && coincideEstado;
        });
    }, [recursos, busqueda, estadoFiltro]);

    const recargar = () => {
        setLoading(true);
        setError("");
        setRecarga(valor => valor + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                    NES Eventos
                </Link>
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                    Volver al dashboard
                </Link>
            </nav>

            <main className="p-4 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Recursos</h1>
                        <p className="mt-2 text-gray-600">
                            Consulta los equipos, mobiliario y vehículos de NES Eventos.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                    <button onClick={abrirCrear} disabled={showForm}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                        + Nuevo recurso
                    </button>
                    <button onClick={recargar} disabled={loading || saving}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                        Actualizar listado
                    </button>
                    </div>
                </div>

                <div className="my-8 flex gap-8 border-b border-gray-200">
                    <span className="border-b-2 border-blue-600 pb-4 text-sm font-semibold text-blue-600">Equipos</span>
                    <Link to="/recursos?modulo=espacios" className="pb-4 text-sm font-semibold text-gray-500 transition hover:text-gray-900">Espacios</Link>
                </div>
                {success && <p role="status" className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">{success}</p>}
                {showForm && (
                    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900">{selectedRecurso ? "Editar recurso" : "Registrar recurso"}</h2>
                        <fieldset disabled={saving} className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="recurso-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input id="recurso-nombre" name="nombre" required minLength={2} maxLength={100}
                                    value={formData.nombre} onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                                <label htmlFor="recurso-tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
                                <input id="recurso-tipo" name="tipo" required minLength={2} maxLength={80}
                                    placeholder="Ej.: sonido, iluminación o vehículo"
                                    value={formData.tipo} onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                                <label htmlFor="recurso-cantidad" className="block text-sm font-medium text-gray-700">Cantidad</label>
                                <input id="recurso-cantidad" name="cantidad" type="number" required min={0} max={2147483647} step={1}
                                    value={formData.cantidad} onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                                <label htmlFor="recurso-estado" className="block text-sm font-medium text-gray-700">Estado del recurso</label>
                                <select id="recurso-estado" name="estado" value={formData.estado} onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                    {Object.entries(estados).map(([valor, etiqueta]) => (
                                        <option key={valor} value={valor}>{etiqueta}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="recurso-observaciones" className="block text-sm font-medium text-gray-700">Observaciones (opcional)</label>
                                <textarea id="recurso-observaciones" name="observaciones" maxLength={2000} rows={3}
                                    value={formData.observaciones} onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </fieldset>
                        {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{formError}</p>}
                        <div className="mt-4 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                                {saving ? "Guardando..." : selectedRecurso ? "Guardar cambios" : "Guardar recurso"}
                            </button>
                            <button type="button" disabled={saving} onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700">Buscar por nombre o tipo</label>
                        <input id="busqueda" value={busqueda} onChange={event => setBusqueda(event.target.value)}
                            placeholder="Ej.: parlante o sonido"
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                        <select id="estado" value={estadoFiltro} onChange={event => setEstadoFiltro(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                            <option value="">Todos los estados</option>
                            {Object.entries(estados).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>{etiqueta}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
                {loading ? (
                    <p role="status" className="mt-6 text-gray-600">Cargando recursos...</p>
                ) : !error && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <caption className="px-4 py-3 text-left text-gray-600">
                                {recursosFiltrados.length} recursos encontrados
                            </caption>
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>{["Nombre", "Tipo", "Cantidad", "Estado", "Observaciones", "Acciones"].map(titulo => (
                                    <th key={titulo} scope="col" className="px-4 py-3 font-semibold">{titulo}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recursosFiltrados.map(recurso => (
                                    <tr key={recurso.id_recurso}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{recurso.nombre}</td>
                                        <td className="px-4 py-3">{recurso.tipo}</td>
                                        <td className="px-4 py-3">{recurso.cantidad}</td>
                                        <td className="px-4 py-3">
                                            <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${coloresEstado[recurso.estado] ?? "bg-gray-50"}`}>
                                                {estados[recurso.estado] ?? recurso.estado}
                                            </span>
                                        </td>
                                        <td className="max-w-sm whitespace-pre-wrap break-words px-4 py-3">{recurso.observaciones || "Sin observaciones"}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => abrirEditar(recurso)} disabled={showForm || saving}
                                                aria-label={`Editar ${recurso.nombre}`}
                                                className="rounded-lg border border-blue-600 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {recursosFiltrados.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        {recursos.length === 0 ? "No hay recursos registrados." : "No hay recursos que coincidan con la búsqueda."}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default function ModuloRecursos() {
    const [params] = useSearchParams();
    return params.get("modulo") === "espacios" ? <Espacios /> : <Recursos />;
}
