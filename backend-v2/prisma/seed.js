process.env.TZ = "America/Santiago";
require("../src/config/loadEnv");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { configuracion, escenario } = require("./seed/modelo");
const { inventario } = require("./seed/inventario");
const { personas, fecharAltas } = require("./seed/personas");
const comercial = require("./seed/comercial");
const operacion = require("./seed/operacion");
const { encuestas } = require("./seed/encuestas");
const validar = require("./seed/validar");
const { destino, guardar } = require("./seed/persistencia");
const resumen = require("./seed/resumen");

async function main() {
    const inicio = Date.now();
    const args = process.argv.slice(2);
    if (args.length) throw Error("Ejecuta npx prisma db seed sin argumentos.");
    const conexion = destino();
    const s = escenario(configuracion());
    const hashes = await Promise.all(["Prueba123!", randomBytes(32).toString("hex")].map(clave => bcrypt.hash(clave, 12)));
    personas(s, ...hashes);
    const grupos = inventario(s);
    comercial(s, grupos);
    fecharAltas(s);
    operacion(s);
    encuestas(s);
    const resultado = await validar(s);
    await guardar(s, conexion);
    console.log(JSON.stringify(resumen(s, resultado), null, 2));
    console.log(`Validaciones correctas · transacción confirmada · ${(Date.now() - inicio) / 1000} s`);
}

main().catch(error => {
    // Evita volcar mensajes del motor que pudieran incluir parámetros de conexión.
    console.error("Seed interrumpido:", error.code?.startsWith?.("P") ? error.code : error.message);
    process.exitCode = 1;
});
