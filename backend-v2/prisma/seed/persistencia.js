const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { modelos } = require("./modelo");

function destino() {
    const archivo = dotenv.parse(fs.readFileSync(path.resolve(__dirname, "../../.env")));
    assert(archivo.DATABASE_URL && process.env.DATABASE_URL === archivo.DATABASE_URL,
        "La conexión activa debe coincidir con DATABASE_URL en backend-v2/.env.");
    let url;
    try { url = new URL(archivo.DATABASE_URL); } catch { throw Error("DATABASE_URL no es una URL válida."); }
    assert(["postgres:", "postgresql:"].includes(url.protocol), "Se requiere una conexión a PostgreSQL.");
    const base = decodeURIComponent(url.pathname.slice(1));
    const esquema = url.searchParams.get("schema") ?? "public";
    assert(base && esquema, "DATABASE_URL debe identificar la base y el esquema de la aplicación.");
    console.log(`Destino configurado: ${url.host}/${base} · esquema ${esquema}`);
    return { base, esquema };
}

async function guardar(s, { base, esquema }) {
    const cliente = require("../../src/config/prisma");
    // PostgreSQL escapa las comillas dobles dentro de identificadores duplicándolas.
    const esquemaSQL = '"' + esquema.replaceAll('"', '""') + '"';
    try {
        await cliente.$transaction(async tx => {
            const [conexion] = await tx.$queryRaw`SELECT current_database() AS db, current_schema() AS esquema,
                host(inet_server_addr()) AS servidor, inet_server_port() AS puerto`;
            assert(conexion.db === base && conexion.esquema === esquema,
                "La base o el esquema de PostgreSQL difieren del destino configurado.");
            const migraciones = fs.readdirSync(path.resolve(__dirname, "../migrations"), { withFileTypes: true })
                .filter(entrada => entrada.isDirectory()).map(entrada => entrada.name).sort();
            const aplicadas = await tx.$queryRawUnsafe(`SELECT migration_name, finished_at FROM ${esquemaSQL}."_prisma_migrations" WHERE rolled_back_at IS NULL`);
            assert(aplicadas.every(m => m.finished_at), "Hay migraciones incompletas.");
            assert.deepEqual(aplicadas.map(m => m.migration_name).sort(), migraciones, "Las migraciones difieren del repositorio.");
            const servidor = conexion.servidor ? `${conexion.servidor}:${conexion.puerto}` : "socket local";
            console.log(`PostgreSQL confirmó ${servidor}/${base}/${esquema} y ${migraciones.length} migraciones.`);
            // Los nombres de las tablas proceden de la lista de modelos del seed.
            // ONLY y RESTRICT impiden que se vacíen particiones o referencias ajenas.
            await tx.$executeRawUnsafe("TRUNCATE TABLE " + modelos.map(m => `ONLY ${esquemaSQL}."${m}"`).join(", ") + " RESTART IDENTITY RESTRICT");
            for (const modelo of modelos) {
                const filas = s.db[modelo];
                const tabla = tx[modelo[0].toLowerCase() + modelo.slice(1)];
                for (let i = 0; i < filas.length; i += 400)
                    await tabla.createMany({ data: filas.slice(i, i + 400) });
                assert.equal(await tabla.count(), filas.length, "Recuento persistido de " + modelo);
                if (filas[0]?.id != null) {
                    // ALTER RESTART es transaccional, incluso si un lote posterior falla.
                    await tx.$executeRawUnsafe(`ALTER SEQUENCE ${esquemaSQL}."${modelo}_id_seq" RESTART WITH ${filas.at(-1).id + 1}`);
                }
            }
            assert.equal(await tx.invitacionEncuesta.count({ where: { OR: [
                { NOT: { destinatario: { endsWith: "@example.invalid" } } },
                { estado: { in: ["PENDIENTE", "FALLIDA"] }, intentos: { lt: 3 } }
            ] } }), 0, "Hay invitaciones fuera del dominio reservado o con envíos disponibles.");
        }, { timeout: 120000, maxWait: 10000 });
    } finally { await cliente.$disconnect(); }
}

module.exports = { destino, guardar };
