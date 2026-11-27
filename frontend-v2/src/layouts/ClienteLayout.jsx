import { useState } from "react";
import { Button, Nav, Offcanvas } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";

import "./AdminLayout.css";

const grupos = [
    {
        nombre: "Gestión",
        items: [
            {
                nombre: "Panel",
                ruta: "/cliente",
                icono: "window",
                end: true
            },
            {
                nombre: "Solicitudes",
                ruta: "/cliente/solicitudes",
                icono: "file-earmark-text"
            },
            {
                nombre: "Compra / Contrato",
                ruta: "/cliente/compra",
                icono: "receipt"
            },
            {
                nombre: "Mis eventos",
                ruta: "/cliente/eventos",
                icono: "calendar-event"
            }
        ]
    },
    {
        nombre: "Servicios y cuenta",
        items: [
            {
                nombre: "Catálogo",
                ruta: "/cliente/catalogo",
                icono: "shop-window"
            },
            {
                nombre: "Mi perfil",
                ruta: "/cliente/perfil",
                icono: "person"
            }
        ]
    }
];

function ClienteNavigation({ onNavigate }) {
    return (
        <Nav
            className="admin-navigation flex-column"
            aria-label="Secciones del cliente"
        >
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

export default function ClienteLayout() {
    const [mostrarMenu, setMostrarMenu] = useState(false);

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar d-none d-lg-block">
                <div className="admin-sidebar-title">
                    Mi cuenta
                </div>

                <ClienteNavigation />
            </aside>

            <Offcanvas
                show={mostrarMenu}
                onHide={() => setMostrarMenu(false)}
                placement="start"
                className="admin-mobile-sidebar"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Mi cuenta</Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <ClienteNavigation
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
                        Menú de cliente
                    </Button>
                </div>

                <Outlet />
            </main>
        </div>
    );
}