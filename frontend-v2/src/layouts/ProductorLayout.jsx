import DashboardLayout from "./DashboardLayout";

const grupos = [
    {
        nombre: "Operaciones",
        items: [
            { nombre: "Panel", ruta: "/productor", icono: "window", end: true },
            { nombre: "Mi agenda", ruta: "/productor/agenda", icono: "calendar-week" },
            { nombre: "Eventos asignados", ruta: "/productor/eventos", icono: "calendar-event" }
        ]
    },
    {
        nombre: "Cuenta",
        items: [
            { nombre: "Mi perfil", ruta: "/productor/perfil", icono: "person" }
        ]
    }
];

export default function ProductorLayout() {
    return (
        <DashboardLayout
            titulo="Producción"
            menuLabel="Menú de productor"
            grupos={grupos}
        />
    );
}