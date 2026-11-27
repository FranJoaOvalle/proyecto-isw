import DashboardLayout from "./DashboardLayout";

const grupos = [
    {
        nombre: "Gestión",
        items: [
            { nombre: "Panel", ruta: "/cliente", icono: "window", end: true },
            { nombre: "Solicitudes", ruta: "/cliente/solicitudes", icono: "file-earmark-text" },
            { nombre: "Propuestas y contratos", ruta: "/cliente/compra", icono: "receipt" },
            { nombre: "Mis eventos", ruta: "/cliente/eventos", icono: "calendar-event" }
        ]
    },
    {
        nombre: "Servicios y cuenta",
        items: [
            { nombre: "Catálogo", ruta: "/cliente/catalogo", icono: "shop-window" },
            { nombre: "Mi perfil", ruta: "/cliente/perfil", icono: "person" }
        ]
    }
];

export default function ClienteLayout() {
    return (
        <DashboardLayout
            titulo="Mi cuenta"
            menuLabel="Menú de cliente"
            grupos={grupos}
        />
    );
}