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

            <main className="p-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>

                <p className="mt-2 text-gray-600">
                    Sesión iniciada como {usuario?.rol}
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {puedeGestionar && (
                        <>
                            <Link
                                to="/clientes"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Clientes
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Registrar, consultar y gestionar clientes.
                                </p>
                            </Link>

                            <Link
                                to="/personal"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Personal
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Registrar, consultar y gestionar personal.
                                </p>
                            </Link>

                            <Link
                                to="/servicios"
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                            >
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Catálogo de servicios
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Consultar y gestionar el catálogo de servicios.
                                </p>
                            </Link>
                        </>
                    )}

                    {usuario?.rol === "CLIENTE" && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Servicios
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Consulta y contratación de servicios.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
