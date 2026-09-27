import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { usuario, logout } = useAuth();

    const puedeGestionar = [
        "ADMIN",
        "PRODUCCION",
        "COMERCIAL"
    ].includes(usuario?.rol);

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* NAVBAR */}
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">

                <span className="text-xl font-bold text-blue-600">
                    NES Eventos
                </span>

                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 hover:text-red-600"
                >
                    Cerrar sesión
                </button>

            </nav>

            {/* CONTENIDO */}
            <main className="p-8">

                <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>

                <p className="mt-2 text-gray-600">
                    Sesión iniciada como {usuario?.rol}
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* =============================== */}
                    {/* ADMIN / PRODUCCION / COMERCIAL */}
                    {/* =============================== */}

                    {puedeGestionar && (
                        <>
                            {/* CLIENTES */}
                            <Link
                                to="/clientes"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Clientes
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Registrar, consultar y gestionar clientes.
                                </p>
                            </Link>

                            {/* PERSONAL */}
                            <Link
                                to="/personal"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Personal
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Registrar, consultar y gestionar personal.
                                </p>
                            </Link>

                            {/* CATÁLOGO COMPLETO */}
                            <Link
                                to="/catalogo"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Catálogo
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Consultar y gestionar el catálogo.
                                </p>
                            </Link>
                        </>
                    )}

                    {/* =============================== */}
                    {/* CLIENTE */}
                    {/* =============================== */}

                    {usuario?.rol === "CLIENTE" && (
                        <Link
                            to="/servicios"
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                            <h2 className="text-lg font-semibold text-gray-900">
                                Catálogo de servicios
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Consulta los servicios disponibles.
                            </p>
                        </Link>
                    )}

                </div>
            </main>
        </div>
    );
}

