
import Servicios from "./Servicios.jsx";

export default function ServiciosCliente() {
    return (
        <div className="min-h-screen bg-gray-50">

            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <span className="text-xl font-bold text-blue-600">
                    NES Eventos
                </span>

                <a
                    href="/dashboard"
                    className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
                >
                    Volver al dashboard
                </a>
            </nav>

            <main className="p-8">
                <Servicios />
            </main>

        </div>
    );
}
