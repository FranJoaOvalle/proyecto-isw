import { Link } from "react-router-dom";

export default function App() {
    return (
        <div className={"min-h-screen bg-gray-50"}>
            <nav className={"w-full border-b border-gray-200 bg-white"}>
                <div className={"flex items-center justify-between px-6 py-4"}>
                    <Link
                        to={"/"}
                        className={"text-xl font-bold text-blue-600"}
                    >
                        NES Eventos
                    </Link>

                    <div className={"flex items-center gap-6"}>
                        <Link
                            to={"/"}
                            className={"text-sm font-medium text-gray-700 hover:text-blue-600"}
                        >
                            Inicio
                        </Link>

                        <Link
                            to={"/login"}
                            className={"rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"}
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}