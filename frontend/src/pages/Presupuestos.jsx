import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crearPresupuesto } from '../services/presupuesto.service';

export default function Presupuestos() {
    const [clienteId, setClienteId] = useState('');
    const [descuento, setDescuento] = useState(0);
    
    const [servicios, setServicios] = useState([
        { servicioId: '', cantidad: 1, precioUnitario: 0 }
    ]);

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

    const calcularTotal = () => {
        const subtotal = servicios.reduce(
            (acc, curr) => acc + (Number(curr.cantidad || 0) * Number(curr.precioUnitario || 0)),
            0
        );
        return Math.max(0, subtotal - Number(descuento || 0));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                clienteId: Number(clienteId),
                descuento: Number(descuento),
                servicios: servicios.map((s) => ({
                    servicioId: Number(s.servicioId),
                    cantidad: Number(s.cantidad),
                    precioUnitario: Number(s.precioUnitario)
                }))
            };

            await crearPresupuesto(payload);
            alert("Presupuesto guardado exitosamente.");

            // Reiniciar formulario
            setClienteId('');
            setDescuento(0);
            setServicios([{ servicioId: '', cantidad: 1, precioUnitario: 0 }]);
        } catch (error) {
            let pista = "Verifique que la información ingresada cumpla con los requisitos del sistema.";

            if (!error.response) {
                pista = "No hay comunicación con el servidor. Compruebe que el servicio backend se encuentre activo.";
            } else if (error.response.status === 404) {
                pista = "El ID de cliente o alguno de los IDs de servicios no existen en el sistema. Registre primero al cliente o use identificadores válidos.";
            } else if (error.response.status === 400) {
                pista = "Existen datos numéricos incompletos o con valores no permitidos.";
            } else if (error.response.status === 401 || error.response.status === 403) {
                pista = "Su sesión expiró o no cuenta con los permisos necesarios para realizar esta operación.";
            }

            const detalleError = error.response?.data?.error || error.response?.data?.message || error.message;

            alert(`ERROR: No se pudo guardar los datos.\n\nDetalle: ${detalleError}\nPista: ${pista}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Barra de navegación superior con diseño corporativo */}
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

            {/* Contenedor principal de la vista */}
            <main className="max-w-4xl mx-auto p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Nuevo Presupuesto
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Registro de cotización y servicios asociados a un evento.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tarjeta de Datos Generales */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Datos Generales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ID del Cliente
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Ej: 1"
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
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

                    {/* Tarjeta de Detalle de Servicios */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Detalle de Servicios
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
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            ID Servicio
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            placeholder="Ej: 1"
                                            value={servicio.servicioId}
                                            onChange={(e) => handleServicioChange(index, 'servicioId', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

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
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Subtotal
                                        </label>
                                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-right text-sm font-semibold text-gray-700">
                                            ${((Number(servicio.cantidad) || 0) * (Number(servicio.precioUnitario) || 0)).toLocaleString()}
                                        </div>
                                    </div>

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

                    {/* Resumen Total y Botón de Envío */}
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
                </form>
            </main>
        </div>
    );
}