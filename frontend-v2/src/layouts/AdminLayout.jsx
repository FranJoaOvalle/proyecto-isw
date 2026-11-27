import { useState } from "react";
import { Button, Nav, Offcanvas } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";

import "./AdminLayout.css";

const grupos = [
    {
        nombre: "General",
        items: [
            { nombre: "Panel", ruta: "/admin", icono: "window", end: true },
            { nombre: "Agenda", ruta: "/admin/agenda", icono: "calendar-week" }
        ]
    },
    {
        nombre: "Gestión",
        items: [
            { nombre: "Clientes", ruta: "/admin/clientes", icono: "person" },
            { nombre: "Productores", ruta: "/admin/productores", icono: "person-gear" },
            { nombre: "Catálogo", ruta: "/admin/catalogo", icono: "shop-window" },
            { nombre: "Solicitudes", ruta: "/admin/solicitudes", icono: "inbox" },
            { nombre: "Eventos", ruta: "/admin/eventos", icono: "calendar-event" },
            { nombre: "Recursos", ruta: "/admin/recursos", icono: "box2" }
        ]
    },
    {
        nombre: "Finanzas",
        items: [
            { nombre: "Presupuestos", ruta: "/admin/presupuestos", icono: "receipt" },
            { nombre: "Pagos", ruta: "/admin/pagos", icono: "cash-coin" }
        ]
    },
    {
        nombre: "Desempeño",
        items: [
            { nombre: "Encuestas", ruta: "/admin/encuestas", icono: "ui-checks" },
            { nombre: "Evaluaciones", ruta: "/admin/evaluaciones", icono: "clipboard-check" }
        ]
    }
];

function AdminNavigation({ onNavigate }) {
    return (
        <Nav className="admin-navigation flex-column">
            {grupos.map(grupo => (
                <div
                    key={grupo.nombre}
                    className="admin-nav-group"
                >
                    <div className="admin-nav-heading">
                        {grupo.nombre}
                    </div>

                    {grupo.items.map(item => (
                        <Nav.Link
                            key={item.ruta}
                            as={NavLink}
                            to={item.ruta}
                            end={item.end ?? false}
                            onClick={onNavigate}
                            className="admin-nav-link"
                        >
                            <i
                                className={`bi bi-${item.icono}`}
                                aria-hidden="true"
                            />

                            <span>{item.nombre}</span>
                        </Nav.Link>
                    ))}
                </div>
            ))}
        </Nav>
    );
}

export default function AdminLayout() {
    const [mostrarMenu, setMostrarMenu] = useState(false);

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar d-none d-lg-block">
                <div className="admin-sidebar-title">
                    Administración
                </div>

                <AdminNavigation />
            </aside>

            <Offcanvas
                show={mostrarMenu}
                onHide={() => setMostrarMenu(false)}
                placement="start"
                className="admin-mobile-sidebar"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        Administración
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <AdminNavigation
                        onNavigate={() => setMostrarMenu(false)}
                    />
                </Offcanvas.Body>
            </Offcanvas>

            <main className="admin-content">
                <div className="d-lg-none border-bottom p-3 bg-body">
                    <Button
                        variant="outline-primary"
                        onClick={() => setMostrarMenu(true)}
                    >
                        <i className="bi bi-list me-2" />
                        Menú administrativo
                    </Button>
                </div>

                <Outlet />
            </main>
        </div>
    );
}