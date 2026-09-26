import { useNavigate } from "react-router-dom";

const menuItems = [
    {
        title: "Inicio",
        path: "/",
        icon: "⌂"
    },
    {
        title: "Catálogo",
        path: "/catalogo",
        icon: "▣"
    }
];

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="d-flex min-vh-100 bg-white">

            {/* Sidebar */}
            <aside
                className="bg-light border-end d-flex flex-column"
                style={{ width: "270px" }}
            >

                {/* Logo */}
                <div
                    className="d-flex align-items-center gap-2 px-4 border-bottom"
                    style={{ height: "82px" }}
                >
                    <div
                        className="bg-dark text-white rounded-3 d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: "40px", height: "40px" }}
                    >
                        NE
                    </div>

                    <span className="fw-semibold fs-5">
                        Nes Eventos
                    </span>
                </div>

                {/* Menú */}
                <nav className="p-3">
                    {menuItems.map((item) => {
                        const activo = window.location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`btn w-100 text-start d-flex align-items-center gap-3 mb-1 ${
                                    activo
                                        ? "btn-dark"
                                        : "btn-light text-secondary"
                                }`}
                            >
                                <span className="fs-5">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.title}
                                </span>
                            </button>
                        );
                    })}
                </nav>

            </aside>

            {/* Contenido principal */}
            <div className="flex-grow-1">

                {/* Barra superior */}
                <header
                    className="border-bottom px-4 d-flex align-items-center"
                    style={{ height: "62px" }}
                >
                    <span className="text-secondary small">
                        Sábado, 26 de septiembre 2026
                    </span>
                </header>

                {/* Dashboard */}
                <main className="container-fluid px-5 py-4">

                    {/* Bienvenida */}
                    <div className="mb-4">
                        <h1 className="fw-bold">
                            Buenos días
                        </h1>

                        <p className="text-secondary">
                            Aquí tienes el resumen de Nes Eventos.
                        </p>
                    </div>

                    {/* Tarjetas */}
                    <div className="row g-4">

                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h2 className="fw-bold">
                                        0
                                    </h2>

                                    <h5>
                                        Servicios activos
                                    </h5>

                                    <p className="text-secondary mb-0">
                                        Servicios disponibles en el catálogo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h2 className="fw-bold">
                                        0
                                    </h2>

                                    <h5>
                                        Categorías
                                    </h5>

                                    <p className="text-secondary mb-0">
                                        Categorías registradas en el catálogo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h2 className="fw-bold">
                                        0
                                    </h2>

                                    <h5>
                                        Eventos
                                    </h5>

                                    <p className="text-secondary mb-0">
                                        Eventos registrados.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </main>

            </div>

        </div>
    );
}