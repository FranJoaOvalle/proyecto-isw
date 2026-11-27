import DashboardLayout from "./DashboardLayout";

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
            { nombre: "Evaluaciones", ruta: "/admin/evaluaciones", icono: "clipboard-check" },
            { nombre: "Ranking", ruta: "/admin/ranking", icono: "trophy" }
        ]
    },
    {
        nombre: "Cuenta",
        items: [
            { nombre: "Mi perfil", ruta: "/admin/perfil", icono: "person" }
        ]
    }
];

export default function AdminLayout() {
    return (
        <DashboardLayout
            titulo="Administración"
            menuLabel="Menú administrativo"
            grupos={grupos}
        />
    );
}