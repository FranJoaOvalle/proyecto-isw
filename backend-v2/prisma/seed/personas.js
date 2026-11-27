const { marcas } = require("./modelo");
const { validarRut } = require("../../src/utils/rut");
const { recintos } = require("./inventario");
const nombres = "Josefina Paula Felipe Camilo Antonia Matías Nicolás Valentina Rodrigo Francisca Diego Fernanda Rocío Ignacio Amalia Gabriel Víctor Javiera Daniela Alonso Sofía Elisa Tomás Bárbara Héctor Belén".split(" ");
const apellidos = "Jara Riquelme Orellana Leiva Cifuentes Sáez Huenchumilla Garrido Zambrano Arriagada Figueroa Nahuelpán Silva Muñoz Alarcón Soto Salinas Venegas Carvajal Lagos Parra Melillán Sanhueza Cid Retamal Burgos Araya Henríquez".split(" ");
const rubros = ["Taller Gráfico", "Consultora", "Cooperativa Textil", "Servicios Portuarios", "Conservas", "Transportes", "Ingeniería", "Maderas", "Cerámicas"];
const marcasEmpresa = ["La Hebra Azul", "Loma del Boldo", "Los Dos Sauces", "Las Tres Quilas", "Patio del Sur", "La Ronda", "Estero de Plata"];

function rut(cuerpo) {
    return "0123456789K".split("").map(dv => cuerpo + "-" + dv).find(validarRut);
}
const escenarios = [
    ["admin.prueba@nes.cl", "Administración, cartera comercial, recursos, encuestas y ranking"],
    ...["Solicitudes pendientes", "Propuestas enviadas para aceptar", "Próximo evento con saldo pendiente", "Cliente recurrente con historial",
        "Empresa con contrataciones periódicas", "Encuestas respondidas y calificaciones"].map((x,i) => [`cliente${i+1}.prueba@nes.cl`,x]),
    ...["Agenda próxima", "Evento en curso con actividades", "Historial clasificado", "Historial provisional"].map((x,i) => [`productor${i+1}.prueba@nes.cl`,x])
];

function personas(s, hashDemo, hashAdicional) {
    const { db, agregar, origen, elegir, entero } = s;
    function usuario(rol, i, activo, conocido) {
        return agregar("Usuario", { rol, activo, email: conocido
            ? (rol === "ADMIN" ? "admin" : rol.toLowerCase() + i) + ".prueba@nes.cl"
            : rol.toLowerCase() + "." + i + "@example.invalid",
            passwordHash: conocido ? hashDemo : hashAdicional, ...marcas(origen) });
    }
    for (let i = 1; i <= 4; i++) usuario("ADMIN", i, true, i === 1);
    let empresas = 0;
    for (let i = 1; i <= 124; i++) {
        const u = usuario("CLIENTE", i, i <= 118, i <= 6);
        const empresa = i === 5 || (i > 6 && i % 3 === 0);
        const c = agregar("Cliente", { usuarioId: u.id, tipo: empresa ? "EMPRESA" : "PERSONA", ...marcas(origen) });
        const telefono = "+5690000" + String(1000 + i);
        if (empresa) {
            const n = empresas++;
            db.ClienteEmpresa.push({ clienteId: c.id, rutEmpresa: rut(77080000 + i), razonSocial:
                `${rubros[n % rubros.length]} ${marcasEmpresa[Math.floor(n / rubros.length)]} ${n % 3 ? "SpA" : "Ltda."}`,
                casaMatriz: `Pasaje Los Batros ${entero(40, 298)}, ${elegir(recintos)[1]}`, telefono });
        } else db.ClientePersona.push({ clienteId: c.id, rut: rut(30050000 + i), nombres: elegir(nombres),
            apellidos: s.mezclar(apellidos).slice(0, 2).join(" "), telefono });
    }
    for (let i = 1; i <= 24; i++) {
        const u = usuario("PRODUCTOR", i, i <= 22, i <= 4);
        agregar("Productor", { usuarioId: u.id, nombres: elegir(nombres), apellidos: s.mezclar(apellidos).slice(0, 2).join(" "),
            telefono: "+5690000" + String(2000 + i), ...marcas(origen) });
    }
}
// Sitúa el alta de cada cuenta antes de su primer encargo conocido.
function fecharAltas(s) {
    for (const perfil of [...s.db.Cliente, ...s.db.Productor]) {
        const usuario = s.db.Usuario[perfil.usuarioId - 1];
        const encargos = usuario.rol === "CLIENTE" ? s.db.SolicitudEvento.filter(x => x.clienteId === perfil.id)
            : s.db.Evento.filter(x => x.productorId === perfil.id);
        const primero = encargos.reduce((n,x) => Math.min(n, +x.createdAt), +s.ahora);
        const antelacion = encargos.length || !usuario.activo ? s.entero(1, 80) : s.entero(0, 12);
        const alta = new Date(Math.max(+s.origen, primero - antelacion * 86400000));
        Object.assign(perfil, marcas(alta));
        Object.assign(usuario, marcas(alta, usuario.activo ? alta : s.ahora));
    }
}
module.exports = { personas, escenarios, fecharAltas };
