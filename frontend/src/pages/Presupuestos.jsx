import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { crearPresupuesto } from '../services/presupuesto.service';
import { getClientes } from '../services/cliente.service';
import { getEventos } from '../services/evento.service';
import { getServicios } from '../services/servicio.service';

export default function Presupuestos() {
    // Estados para la gestión de datos del formulario de presupuesto
    const [clienteId, setClienteId] = useState('');
    const [eventoId, setEventoId] = useState('');
    const [descuento, setDescuento] = useState(0);
    
    // Estados para almacenar las listas obtenidas de los módulos de los colaboradores
    const [clientesList, setClientesList] = useState([]);
    const [eventosList, setEventosList] = useState([]);
    const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');

    // Estado para las líneas de servicios incluidos en la cotización
    const [servicios, setServicios] = useState([
        { servicioId: '', cantidad: 1, precioUnitario: 0 }
    ]);

    // Efecto para sincronizar catálogos externos al montar el componente
    useEffect(() => {
        const cargarDatosExternos = async () => {
            try {
                const [resClientes, resEventos, resServicios] = await Promise.all([
                    getClientes(),
                    getEventos(),
                    getServicios()
                ]);

                setClientesList(resClientes);
                setEventosList(resEventos.data);
                setServiciosCatalogo(resServicios);
            } catch (error) {
                setErrorCarga(error.response?.data?.error?.message || 'No fue posible cargar clientes, eventos y servicios. Recarga la página para reintentar.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatosExternos();
    }, []);

    // Manejador para autocompletar el precio unitario basado en el catálogo seleccionado
    const handleServicioSelect = (index, servicioId) => {
        const servicioEncontrado = serviciosCatalogo.find(
            (s) => s.id_servicio === Number(servicioId) || s.id === Number(servicioId)
        );

        const nuevosServicios = [...servicios];
        nuevosServicios[index].servicioId = servicioId;
        
        if (servicioEncontrado) {
            nuevosServicios[index].precioUnitario = servicioEncontrado.precio_base || servicioEncontrado.precio || 0;
        }

        setServicios(nuevosServicios);
    };

    const handleAddServicio = () => {
        setServicios([...servicios, { servicioId: '', cantidad: 1, precioUnitario: 0 }]);
    };

    const handleRemoveServicio = (index) => {
        if (servicios.length === 1) return;
        setServicios(servicios.filter((_, i) => i !== index));
    };

    const handleServicioChange = (index, campo, valor) => {
        const nuevosServicios = [...servicios];
        nuevosServicios[index][campo] = valor === '' ? '' : Number(valor);
        setServicios(nuevosServicios);
    };

    // Cálculo dinámico del subtotal y aplicación del descuento global
    const calcularTotal = () => {
        const subtotal = servicios.reduce(
            (acc, curr) => acc + (Number(curr.cantidad || 0) * Number(curr.precioUnitario || 0)),
            0
        );
        return Math.max(0, subtotal - Number(descuento || 0));
    };

    // Envío de la cotización consolidada al backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                clienteId: Number(clienteId),
                eventoId: Number(eventoId),
                descuento: Number(descuento),
                totalEstimado: calcularTotal(),
                servicios: servicios.map((s) => ({
                    servicioId: Number(s.servicioId),
                    cantidad: Number(s.cantidad),
                    precioUnitario: Number(s.precioUnitario)
                }))
            };

            await crearPresupuesto(payload);
            alert("Presupuesto guardado exitosamente.");

            // Restablecer el formulario a su estado inicial
            setClienteId('');
            setEventoId('');
            setDescuento(0);
            setServicios([{ servicioId: '', cantidad: 1, precioUnitario: 0 }]);
        } catch (error) {
            let pista = "Verifique que la información ingresada cumpla con los requisitos del sistema.";

            if (!error.response) {
                pista = "No hay comunicación con el servidor. Compruebe que el servicio backend se encuentre activo.";
            } else if (error.response.status === 404) {
                pista = "Alguno de los recursos seleccionados no existe en el sistema.";
            } else if (error.response.status === 400) {
                pista = "Existen datos numéricos incompletos o con valores no permitidos.";
            } else if (error.response.status === 401 || error.response.status === 403) {
                pista = "Su sesión expiró o no cuenta con los permisos necesarios.";
            }

            const detalleError = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`ERROR: No se pudo guardar los datos.\n\nDetalle: ${detalleError}\nPista: ${pista}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <span className="text-xl font-bold text-blue-600">
                    NES Eventos
                </span>
                <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
                >
                    Volver al dashboard
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Nuevo Presupuesto
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Registro de cotización y servicios asociados a un evento.
                    </p>
                </div>

                {errorCarga && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{errorCarga}</p>}
                {cargando && <p role="status" className="mb-4 text-gray-600">Cargando clientes, eventos y servicios...</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset disabled={cargando || Boolean(errorCarga)} className="space-y-6">
                    {/* Sección de Datos Generales y Asociaciones */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Datos Generales y Asociación
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Selector de Cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente
                                </label>
                                <select
                                    required
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Seleccione un cliente...</option>
                                    {clientesList.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Evento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Evento Asociado
                                </label>
                                <select
                                    required
                                    value={eventoId}
                                    onChange={(e) => setEventoId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Seleccione un evento...</option>
                                    {eventosList.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.tipoEvento} - {ev.lugar} ({new Date(ev.fecha).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Descuento Global */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descuento Global ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={descuento}
                                    onChange={(e) => setDescuento(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección de Detalle de Servicios */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Detalle de Servicios del Catálogo
                            </h2>
                            <button
                                type="button"
                                onClick={handleAddServicio}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                            >
                                + Añadir servicio
                            </button>
                        </div>

                        <div className="space-y-4">
                            {servicios.map((servicio, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-b border-gray-100 pb-4"
                                >
                                    {/* Selector del Servicio del Catálogo */}
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Servicio del Catálogo
                                        </label>
                                        <select
                                            required
                                            value={servicio.servicioId}
                                            onChange={(e) => handleServicioSelect(index, e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">Seleccione servicio...</option>
                                            {serviciosCatalogo.map((serv) => (
                                                <option key={serv.id_servicio || serv.id} value={serv.id_servicio || serv.id}>
                                                    {serv.nombre} (${serv.precio_base?.toLocaleString() || 0})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cantidad requerida */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={servicio.cantidad}
                                            onChange={(e) => handleServicioChange(index, 'cantidad', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Precio Unitario automatizado */}
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Precio Unitario ($)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={servicio.precioUnitario}
                                            onChange={(e) => handleServicioChange(index, 'precioUnitario', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        />
                                    </div>

                                    {/* Subtotal calculado por línea */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Subtotal
                                        </label>
                                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-right text-sm font-semibold text-gray-700">
                                            ${((Number(servicio.cantidad) || 0) * (Number(servicio.precioUnitario) || 0)).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Botón de eliminación de ítem */}
                                    <div className="md:col-span-1 flex justify-center">
                                        {servicios.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveServicio(index)}
                                                className="text-gray-400 hover:text-red-600 transition mb-2 text-sm"
                                                title="Eliminar fila"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumen Final de Costos y Envío */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                                Monto Total Estimado
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900">
                                ${calcularTotal().toLocaleString()}
                            </h2>
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Guardar Presupuesto
                        </button>
                    </div>
                    </fieldset>
                </form>
            </main>
        </div>
    );
}
