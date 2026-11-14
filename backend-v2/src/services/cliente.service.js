const prisma = require("../config/prisma");

const NotFoundException = require("../exceptions/NotFoundException");

const listarClientes = async () => {
    return prisma.cliente.findMany({
        orderBy: { id: "asc" },
        include: {
            usuario: {
                select: {
                    id: true,
                    email: true,
                    activo: true
                }
            },
            persona: true,
            empresa: true
        }
    });
};

const obtenerCliente = async (id) => {
    const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: {
            usuario: {
                select: {
                    id: true,
                    email: true,
                    activo: true
                }
            },
            persona: true,
            empresa: true
        }
    });

    if (!cliente) throw new NotFoundException("Cliente no encontrado.");
    return cliente;
};

const cambiarEstadoCliente = async (id, activo) => {
    const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: { usuario: true }
    });

    if (!cliente) throw new NotFoundException("Cliente no encontrado.");
    if (cliente.usuario.activo === activo) return obtenerCliente(id);

    await prisma.usuario.update({
        where: { id: cliente.usuarioId },
        data: { activo }
    });

    return obtenerCliente(id);
};

module.exports = {
    listarClientes,
    obtenerCliente,
    cambiarEstadoCliente
};