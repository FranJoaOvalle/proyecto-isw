const cuentasDemo = [
    "admin.prueba@nes.cl",
    ...Array.from({ length: 6 }, (_, i) => `cliente${i + 1}.prueba@nes.cl`),
    ...Array.from({ length: 4 }, (_, i) => `productor${i + 1}.prueba@nes.cl`)
];

function esCorreoDemo(email) {
    const direccion = email.trim().toLowerCase();
    return direccion.endsWith(".invalid") || cuentasDemo.includes(direccion);
}

// Se aplica al destinatario original, antes de cualquier redirección de desarrollo.
const excluirCorreosDemo = {
    NOT: { OR: [
        { destinatario: { endsWith: ".invalid", mode: "insensitive" } },
        { destinatario: { in: cuentasDemo, mode: "insensitive" } }
    ] }
};

module.exports = { esCorreoDemo, excluirCorreosDemo };
