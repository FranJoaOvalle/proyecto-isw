const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const rutas = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../backend/.env")
];

const archivoEnv = rutas.find((ruta) => fs.existsSync(ruta));

if (archivoEnv) {
    dotenv.config({ path: archivoEnv, quiet: true });
}
