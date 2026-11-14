require("dotenv").config();

const { PrismaClient } = require("../generated/prisma/client.ts");

const prisma = new PrismaClient();
const observacionDemo = "DATOS FICTICIOS PARA DEMOSTRACIÓN; no representan inventario real.";

const recursos = [
    {
        nombre: "[DEMO MANTENCIÓN] Sillas plegables",
        descripcion: observacionDemo,
        precioUnitario: 12000,
        stockTotal: 800,
        cantidadEnMantencion: 240,
        cantidadPerdida: 0,
        unidad: "unidad"
    },
    {
        nombre: "[DEMO MANTENCIÓN] Mesas de apoyo",
        descripcion: observacionDemo,
        precioUnitario: 45000,
        stockTotal: 300,
        cantidadEnMantencion: 90,
        cantidadPerdida: 0,
        unidad: "unidad"
    },
    {
        nombre: "[DEMO MANTENCIÓN] Focos LED",
        descripcion: observacionDemo,
        precioUnitario: 38000,
        stockTotal: 180,
        cantidadEnMantencion: 45,
        cantidadPerdida: 0,
        unidad: "unidad"
    }
];

const vehiculos = [
    {
        patente: "DM-001",
        tipo: "Furgón de muestra",
        marca: "Demo",
        modelo: "Carga 1",
        anio: 2022,
        capacidadPasajeros: 3,
        estado: "EN_MANTENCION",
        observaciones: observacionDemo
    },
    {
        patente: "DM-002",
        tipo: "Minibús de muestra",
        marca: "Demo",
        modelo: "Pasajeros 12",
        anio: 2021,
        capacidadPasajeros: 12,
        estado: "EN_MANTENCION",
        observaciones: observacionDemo
    },
    {
        patente: "DM-003",
        tipo: "Camioneta de muestra",
        marca: "Demo",
        modelo: "Apoyo 4x2",
        anio: 2023,
        capacidadPasajeros: 5,
        estado: "DISPONIBLE",
        observaciones: observacionDemo
    },
    {
        patente: "DM-004",
        tipo: "Furgón de muestra",
        marca: "Demo",
        modelo: "Pasajeros 8",
        anio: 2020,
        capacidadPasajeros: 8,
        estado: "DISPONIBLE",
        observaciones: observacionDemo
    }
];

async function main() {
    let recursosCreados = 0;
    let vehiculosCreados = 0;

    for (const recurso of recursos) {
        const existente = await prisma.recurso.findFirst({
            where: { nombre: recurso.nombre, tipo: "MATERIAL" },
            select: { id: true }
        });
        if (existente) continue;

        const { unidad, ...datos } = recurso;
        await prisma.recurso.create({
            data: {
                ...datos,
                tipo: "MATERIAL",
                material: { create: { unidad } }
            }
        });
        recursosCreados += 1;
    }

    for (const vehiculo of vehiculos) {
        const existente = await prisma.vehiculo.findUnique({
            where: { patente: vehiculo.patente },
            select: { id: true }
        });
        if (existente) continue;

        await prisma.vehiculo.create({ data: vehiculo });
        vehiculosCreados += 1;
    }

    const resultado = { recursosCreados, vehiculosCreados };

    console.log(
        "Demo inventario: " + resultado.recursosCreados + " recursos y " + resultado.vehiculosCreados + " vehículos nuevos."
    );
    console.log("Todos los registros de muestra están marcados [DEMO MANTENCIÓN] o con patente DM-.");
}

main()
    .catch(error => {
        console.error("No se pudieron crear los datos de demostración.", error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
