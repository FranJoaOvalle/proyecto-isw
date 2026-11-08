require("dotenv").config();

const { PrismaClient } = require("../generated/prisma/client.ts");

const prisma = new PrismaClient();
const notaDemo = "DATOS FICTICIOS PARA DEMOSTRACIÓN: nombre, capacidad, tarifa, estado y disponibilidad no son reales. La dirección pública se usa solo como referencia para ubicar el marcador.";

const espacios = [
    {
        clave: "centro",
        nombre: "[DEMO MAPA] Salón de muestra Centro",
        direccion: "Rozas 520, Concepción, Chile",
        capacidad: 80,
        costoArriendo: 280000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    },
    {
        clave: "cultura",
        nombre: "[DEMO MAPA] Sala de muestra O'Higgins",
        direccion: "O'Higgins 555, Concepción, Chile",
        capacidad: 120,
        costoArriendo: 350000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    },
    {
        clave: "norte",
        nombre: "[DEMO MAPA] Sala de muestra Barrio Norte",
        direccion: "Maipú 2359, Concepción, Chile",
        capacidad: 70,
        costoArriendo: 220000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    },
    {
        clave: "universidad",
        nombre: "[DEMO MAPA] Sala de muestra Universitaria",
        direccion: "Casa del Arte José Clemente Orozco, Concepción, Chile",
        capacidad: 100,
        costoArriendo: 320000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    },
    {
        clave: "hospicio",
        nombre: "[DEMO MAPA] Salón de muestra Hospicio",
        direccion: "Hospicio 40, Concepción, Chile",
        capacidad: 60,
        costoArriendo: 190000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    },
    {
        clave: "collao",
        nombre: "[DEMO MAPA] Recinto de muestra Collao",
        direccion: "Collao 481, Concepción, Chile",
        capacidad: 300,
        costoArriendo: 650000,
        unidadArriendo: "EVENTO",
        habilitado: false,
        observaciones: notaDemo
    },
    {
        clave: "hualpen",
        nombre: "[DEMO MAPA] Espacio de muestra Hualpén",
        direccion: "Avenida Colón 7500, Hualpén, Chile",
        capacidad: 180,
        costoArriendo: 420000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: notaDemo
    }
];

const reservas = [
    {
        espacio: "centro",
        referencia: "DEMO MAPA - Encuentro de verano",
        inicio: new Date("2026-12-12T16:00:00-03:00"),
        fin: new Date("2026-12-12T22:00:00-03:00")
    },
    {
        espacio: "universidad",
        referencia: "DEMO MAPA - Jornada cultural",
        inicio: new Date("2026-12-18T10:00:00-03:00"),
        fin: new Date("2026-12-18T16:00:00-03:00")
    },
    {
        espacio: "hualpen",
        referencia: "DEMO MAPA - Feria de muestra",
        inicio: new Date("2026-12-20T12:00:00-03:00"),
        fin: new Date("2026-12-20T20:00:00-03:00")
    }
];

async function main() {
    const resultado = await prisma.$transaction(async tx => {
        const ids = {};
        let espaciosCreados = 0;
        let reservasCreadas = 0;

        for (const espacio of espacios) {
            const existente = await tx.espacio.findFirst({
                where: { nombre: espacio.nombre },
                select: { id: true }
            });
            const registro = existente ?? await tx.espacio.create({
                data: {
                    nombre: espacio.nombre,
                    direccion: espacio.direccion,
                    capacidad: espacio.capacidad,
                    costoArriendo: espacio.costoArriendo,
                    unidadArriendo: espacio.unidadArriendo,
                    habilitado: espacio.habilitado,
                    observaciones: espacio.observaciones
                },
                select: { id: true }
            });
            if (existente) {
                await tx.espacio.update({
                    where: { id: existente.id },
                    data: { direccion: espacio.direccion }
                });
            }
            ids[espacio.clave] = registro.id;
            if (!existente) espaciosCreados += 1;
        }

        for (const reserva of reservas) {
            const espacioId = ids[reserva.espacio];
            const existente = await tx.reservaEspacio.findFirst({
                where: { espacioId, referencia: reserva.referencia },
                select: { id: true }
            });
            if (existente) continue;

            await tx.reservaEspacio.create({
                data: {
                    espacioId,
                    referencia: reserva.referencia,
                    inicio: reserva.inicio,
                    fin: reserva.fin
                }
            });
            reservasCreadas += 1;
        }

        return { espaciosCreados, reservasCreadas };
    });

    console.log(`Demo mapa: ${resultado.espaciosCreados} espacios nuevos y ${resultado.reservasCreadas} reservas nuevas.`);
    console.log("Los registros usan el prefijo [DEMO MAPA] y quedan identificados como ficticios.");
}

main()
    .catch(error => {
        console.error("No se pudieron crear los datos de demostración.", error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
