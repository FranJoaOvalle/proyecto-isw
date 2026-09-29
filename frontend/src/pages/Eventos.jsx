import { useEffect, useMemo, useState } from "react";
import { getEventos, createEvento, updateEvento, cancelarEvento } from "../services/evento.service";
import { getClientes } from "../services/cliente.service";
import { useAuth } from "../context/AuthContext";

const Eventos = () => {
    const { usuario } = useAuth();

    const [eventos, setEventos] = useState([]);
    const [clientes, setClientes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        clienteId: "",
        tipoEvento: "",
        fecha: "",
        horario: "",
        cantidadAsistentes: "",
        lugar: "",
        observaciones: "",
        estado: "ORGANIZACION"
    });

    const esCliente = usuario?.rol === "CLIENTE";
    const puedeGestionar = [
        "ADMIN",
        "PRODUCCION",
        "COMERCIAL"
    ].includes(usuario?.rol);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError("");

            const resEventos = await getEventos();
            setEventos(resEventos.data || resEventos || []);

            if (puedeGestionar) {
                const resClientes = await getClientes();
                setClientes(resClientes.data || resClientes || []);
            }
        } catch (error) {
            let msg = error.response?.data?.error?.message ?? error.response?.data?.error ?? "No fue posible cargar los eventos.";
            if (esCliente && msg.toLowerCase().includes("permisos")) {
                msg = "Tu cuenta aún no tiene habilitada la vista de eventos en el servidor.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [usuario?.rol]);

    const getNombreCliente = idCliente => {
        const cliente = clientes.find(c => String(c.id) === String(idCliente));
        return cliente?.nombre ?? `Cliente #${idCliente}`;
    };

    const eventosFiltrados = useMemo(() => {
        const textoBusqueda = busqueda.trim().toLowerCase();

        return eventos.filter(evento => {
            const tipo = evento.tipoEvento?.toLowerCase() ?? "";
            const lugar = evento.lugar?.toLowerCase() ?? "";
            const estadoTxt = evento.estado?.toLowerCase() ?? "";
            const nombreCliente = (evento.cliente?.nombre || getNombreCliente(evento.clienteId)).toLowerCase();

            const coincideBusqueda =
                tipo.includes(textoBusqueda) ||
                lugar.includes(textoBusqueda) ||
                estadoTxt.includes(textoBusqueda) || 
                nombreCliente.includes(textoBusqueda);

            const coincideEstado =
                estadoFiltro === "" || String(evento.estado) === String(estadoFiltro);

            return coincideBusqueda && coincideEstado;
        });
    }, [eventos, busqueda, estadoFiltro, clientes]);

    const abrirCrear = () => {
        if (!puedeGestionar) return;
        setSelectedEvento(null);
        setFormData({ 
            clienteId: "", 
            tipoEvento: "", 
            fecha: "", 
            horario: "", 
            cantidadAsistentes: "", 
            lugar: "", 
            observaciones: "",
            estado: "ORGANIZACION" 
        });
        setError("");
        setShowForm(true);
    };

    const abrirEditar = evento => {
        if (!puedeGestionar) return;
        setSelectedEvento(evento);
        setFormData({
            clienteId: evento.clienteId ?? "",
            tipoEvento: evento.tipoEvento ?? "",
            fecha: evento.fecha ? new Date(evento.fecha).toISOString().slice(0, 16) : "",
            horario: evento.horario ?? "",
            cantidadAsistentes: evento.cantidadAsistentes ?? "",
            lugar: evento.lugar ?? "",
            observaciones: evento.observaciones ?? "",
            estado: evento.estado ?? "ORGANIZACION"
        });
        setError("");
        setShowForm(true);
    };

    const cerrarFormulario = () => {
        if (saving) return;
        setShowForm(false);
        setSelectedEvento(null);
    };

    const handleChange = event => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (!puedeGestionar) return;

        try {
            setSaving(true);
            setError("");

            const payload = {
                clienteId: Number(formData.clienteId),
                tipoEvento: formData.tipoEvento.trim(),
                fecha: new Date(formData.fecha).toISOString(),
                horario: formData.horario.trim(),
                cantidadAsistentes: Number(formData.cantidadAsistentes),
                lugar: formData.lugar.trim(),
                estado: formData.estado
            };

            if (formData.observaciones !== undefined && formData.observaciones !== null) {
                payload.observaciones = formData.observaciones.trim();
            }

            if (selectedEvento) {
                await updateEvento(selectedEvento.id, payload);
            } else {
                await createEvento(payload);
            }

            setShowForm(false);
            setSelectedEvento(null);
            await cargarDatos(); 
        } catch (error) {
            setError(
                error.response?.data?.error?.message ?? 
                error.response?.data?.error ?? 
                "No fue posible guardar el evento."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancelar = async evento => {
        if (!puedeGestionar) return;
        const confirmar = window.confirm(`¿Deseas cancelar el evento "${evento.tipoEvento}"?`);
        if (!confirmar) return;

        try {
            setError("");
            await cancelarEvento(evento.id);
            await cargarDatos();
        } catch (error) {
            setError(error.response?.data?.error?.message ?? error.response?.data?.error ?? "No fue posible cancelar el evento.");
        }
    };

    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'ORGANIZACION': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'CONFIRMADO': return 'bg-green-100 text-green-800 border border-green-200';
            case 'CANCELADO': return 'bg-red-100 text-red-800 border border-red-200';
            case 'FINALIZADO': return 'bg-blue-100 text-blue-800 border border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    return (
        <div className="p-8">
            {/* ENCABEZADO*/}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {esCliente ? "Mis Eventos" : "Gestión de Eventos"}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        {esCliente
                            ? "Consulta el estado y los detalles de tus eventos programados."
                            : "Administra, agenda y supervisa los eventos de los clientes."
                        }
                    </p>
                </div>

                {puedeGestionar && (
                    <button
                        type="button"
                        onClick={abrirCrear}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                    >
                        + Nuevo Evento
                    </button>
                )}
            </div>

            {/* ERROR */}
            {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            {/* FILTROS */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label htmlFor="busqueda" className="mb-2 block text-sm font-medium text-gray-700">Buscar evento</label>
                    <input
                        id="busqueda"
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Tipo, estado, lugar o cliente..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <div>
                    <label htmlFor="estadoFiltro" className="mb-2 block text-sm font-medium text-gray-700">Filtrar por estado</label>
                    <select
                        id="estadoFiltro"
                        value={estadoFiltro}
                        onChange={e => setEstadoFiltro(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">Todos los estados</option>
                        <option value="ORGANIZACION">En Organización</option>
                        <option value="CONFIRMADO">Confirmado</option>
                        <option value="FINALIZADO">Finalizado</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* LISTA DE EVENTOS */}
            {loading ? (
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <p className="text-gray-500 font-medium">Cargando eventos...</p>
                </div>
            ) : eventosFiltrados.length === 0 ? (
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">No hay eventos</h3>
                    <p className="mt-2 text-sm text-gray-500">No se encontraron registros que coincidan con tu búsqueda.</p>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                    {eventosFiltrados.map(evento => (
                        <div
                            key={evento.id}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{evento.tipoEvento}</h2>
                                        <p className="mt-1 text-sm font-medium text-gray-500">
                                            {new Date(evento.fecha).toLocaleDateString("es-CL", { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${getEstadoClass(evento.estado)}`}>
                                        {evento.estado}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="block font-semibold text-gray-900 mb-1">Cliente</span>
                                        <span className="text-gray-600">{evento.cliente?.nombre || getNombreCliente(evento.clienteId)}</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900 mb-1">Asistentes</span>
                                        <span className="text-gray-600">{evento.cantidadAsistentes} personas</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900 mb-1">Horario</span>
                                        <span className="text-gray-600">{evento.horario}</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900 mb-1">Lugar</span>
                                        <span className="text-gray-600 block truncate" title={evento.lugar}>{evento.lugar}</span>
                                    </div>
                                </div>

                                {evento.observaciones && (
                                    <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600">
                                        <span className="block font-semibold text-gray-900 mb-1">Observaciones</span>
                                        {evento.observaciones}
                                    </div>
                                )}
                            </div>

                            {/* BOTONES DE GESTIÓN */}
                            {puedeGestionar && (
                                <div className="mt-6 flex gap-3 pt-5 border-t border-gray-100">
                                    {evento.estado !== 'CANCELADO' && (
                                        <button
                                            type="button"
                                            onClick={() => abrirEditar(evento)}
                                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600"
                                        >
                                            Editar
                                        </button>
                                    )}
                                    {evento.estado !== 'CANCELADO' && (
                                        <button
                                            type="button"
                                            onClick={() => handleCancelar(evento)}
                                            className="flex-1 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    {evento.estado === 'CANCELADO' && (
                                        <span className="flex-1 text-center py-2 text-sm font-semibold text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                                            Evento inactivo
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CREAR / EDITAR */}
            {showForm && puedeGestionar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="max-h-[90vh] overflow-y-auto p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedEvento ? "Editar Evento" : "Nuevo Evento"}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedEvento ? "Modifica los detalles del evento (fecha, lugar, estado, etc)." : "Agenda un nuevo evento para un cliente."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={cerrarFormulario}
                                    disabled={saving}
                                    className="text-3xl text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label htmlFor="clienteId" className="mb-2 block text-sm font-medium text-gray-700">Cliente Asociado</label>
                                        <select
                                            id="clienteId"
                                            name="clienteId"
                                            value={formData.clienteId}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">Seleccione un cliente...</option>
                                            {clientes.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Evento</label>
                                        <input type="text" name="tipoEvento" value={formData.tipoEvento} onChange={handleChange} required minLength={2} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Ej. Matrimonio" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Fecha</label>
                                        <input type="datetime-local" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Horario</label>
                                        <input type="text" name="horario" value={formData.horario} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="18:00 a 04:00" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Asistentes</label>
                                        <input type="number" min="1" name="cantidadAsistentes" value={formData.cantidadAsistentes} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Lugar del Evento</label>
                                        <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Estado del Evento</label>
                                        <select
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="ORGANIZACION">En Organización</option>
                                            <option value="CONFIRMADO">Confirmado</option>
                                            <option value="FINALIZADO">Finalizado</option>
                                            <option value="CANCELADO">Cancelado</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Observaciones</label>
                                        <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Requerimientos dietéticos, accesos, etc." />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-gray-200 mt-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={cerrarFormulario}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                                    >
                                        {saving ? "Guardando..." : selectedEvento ? "Guardar cambios" : "Crear evento"}
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

export default Eventos;