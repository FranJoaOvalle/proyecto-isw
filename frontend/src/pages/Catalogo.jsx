import { useState } from "react";
import Servicios from "./Servicios.jsx";
import Categorias from "./Categorias.jsx";

export default function Catalogo() {
    const [seccion, setSeccion] = useState("servicios");

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

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Catálogo
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Administra los servicios y categorías disponibles.
                    </p>
                </div>

                <div className="mb-8 border-b border-gray-200">
                    <div className="flex gap-8">

                        <button
                            type="button"
                            onClick={() => setSeccion("servicios")}
                            className={`pb-4 text-sm font-semibold transition ${
                                seccion === "servicios"
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Servicios
                        </button>

                        <button
                            type="button"
                            onClick={() => setSeccion("categorias")}
                            className={`pb-4 text-sm font-semibold transition ${
                                seccion === "categorias"
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Categorías
                        </button>

                    </div>
                </div>

                {seccion === "servicios" && (
                    <Servicios />
                )}

                {seccion === "categorias" && (
                    <Categorias />
                )}

            </main>

        </div>
    );
}

