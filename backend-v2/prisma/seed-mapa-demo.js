require("dotenv").config();

const { PrismaClient } = require("../generated/prisma/client.ts");

const prisma = new PrismaClient();
const espacios = [
    {
        clave: "centro",
        nombreAnterior: "[DEMO MAPA] Salón de muestra Centro",
        nombre: "Salón Rozas Centro",
        direccion: "Rozas 520, Concepción, Chile",
        capacidad: 80,
        costoArriendo: 280000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Salón para encuentros de trabajo, talleres y celebraciones de tamaño mediano."
    },
    {
        clave: "cultura",
        nombreAnterior: "[DEMO MAPA] Sala de muestra O'Higgins",
        nombre: "Sala O'Higgins",
        direccion: "O'Higgins 555, Concepción, Chile",
        capacidad: 120,
        costoArriendo: 350000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Espacio céntrico apropiado para charlas, capacitaciones y reuniones corporativas."
    },
    {
        clave: "norte",
        nombreAnterior: "[DEMO MAPA] Sala de muestra Barrio Norte",
        nombre: "Salón Barrio Norte",
        direccion: "Maipú 2359, Concepción, Chile",
        capacidad: 70,
        costoArriendo: 220000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Salón para reuniones y actividades de grupos pequeños."
    },
    {
        clave: "universidad",
        nombreAnterior: "[DEMO MAPA] Sala de muestra Universitaria",
        nombre: "Sala Cultural Universitaria",
        direccion: "Casa del Arte José Clemente Orozco, Concepción, Chile",
        capacidad: 100,
        costoArriendo: 320000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Sala adecuada para exposiciones, charlas y encuentros culturales."
    },
    {
        clave: "hospicio",
        nombreAnterior: "[DEMO MAPA] Salón de muestra Hospicio",
        nombre: "Salón Hospicio",
        direccion: "Hospicio 40, Concepción, Chile",
        capacidad: 60,
        costoArriendo: 190000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Espacio de escala reducida para reuniones, talleres y actividades privadas."
    },
    {
        clave: "collao",
        nombreAnterior: "[DEMO MAPA] Recinto de muestra Collao",
        nombre: "Centro de Eventos Collao",
        direccion: "Collao 481, Concepción, Chile",
        capacidad: 300,
        costoArriendo: 650000,
        unidadArriendo: "EVENTO",
        habilitado: false,
        observaciones: "Recinto amplio para ferias, encuentros comunitarios y celebraciones."
    },
    {
        clave: "hualpen",
        nombreAnterior: "[DEMO MAPA] Espacio de muestra Hualpén",
        nombre: "Salón Colón Hualpén",
        direccion: "Avenida Colón 7500, Hualpén, Chile",
        capacidad: 180,
        costoArriendo: 420000,
        unidadArriendo: "EVENTO",
        habilitado: true,
        observaciones: "Salón para eventos sociales y encuentros empresariales."
    }
];

const reservas = [
    {
        espacio: "centro",
        referenciaAnterior: "DEMO MAPA - Encuentro de verano",
        referencia: "Encuentro de verano",
        inicio: new Date("2026-12-12T16:00:00-03:00"),
        fin: new Date("2026-12-12T22:00:00-03:00")
    },
    {
        espacio: "universidad",
        referenciaAnterior: "DEMO MAPA - Jornada cultural",
        referencia: "Jornada cultural",
        inicio: new Date("2026-12-18T10:00:00-03:00"),
        fin: new Date("2026-12-18T16:00:00-03:00")
    },
    {
        espacio: "hualpen",
        referenciaAnterior: "DEMO MAPA - Feria de muestra",
        referencia: "Feria de emprendimiento",
        inicio: new Date("2026-12-20T12:00:00-03:00"),
        fin: new Date("2026-12-20T20:00:00-03:00")
    }
];

async function main() {
    const ids = {};
    let espaciosCreados = 0;
    let reservasCreadas = 0;

    for (const espacio of espacios) {
        const existente = await prisma.espacio.findFirst({
            where: { nombre: { in: [espacio.nombre, espacio.nombreAnterior] } },
            select: { id: true }
        });
        const registro = existente ?? await prisma.espacio.create({
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
            await prisma.espacio.update({
                where: { id: existente.id },
                data: {
                    nombre: espacio.nombre,
                    direccion: espacio.direccion,
                    observaciones: espacio.observaciones
                }
            });
        }
        ids[espacio.clave] = registro.id;
        if (!existente) espaciosCreados += 1;
    }

    for (const reserva of reservas) {
        const espacioId = ids[reserva.espacio];
        const existente = await prisma.reservaEspacio.findFirst({
            where: { espacioId, referencia: { in: [reserva.referencia, reserva.referenciaAnterior] } },
            select: { id: true }
        });
        if (existente) {
            await prisma.reservaEspacio.update({
                where: { id: existente.id },
                data: { referencia: reserva.referencia }
            });
            continue;
        }

        await prisma.reservaEspacio.create({
            data: {
                espacioId,
                referencia: reserva.referencia,
                inicio: reserva.inicio,
                fin: reserva.fin
            }
        });
        reservasCreadas += 1;
    }

    const resultado = { espaciosCreados, reservasCreadas };

    console.log(`Espacios de ejemplo: ${resultado.espaciosCreados} espacios nuevos y ${resultado.reservasCreadas} reservas nuevas.`);
}

main()
    .catch(error => {
        console.error("No se pudieron guardar los espacios de ejemplo.", error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
