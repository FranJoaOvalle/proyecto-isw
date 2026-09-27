const prisma = require("../db/prisma");

const ForbiddenException = require("../exceptions/ForbiddenException");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class AutorizacionService {
    async cliente(usuario, clienteId) {
        if (usuario.rol === "ADMIN") return;

        const autorizacion = await prisma.autorizacionCliente.findUnique({
            where: {
                usuarioId_clienteId: {
                    usuarioId: usuario.id_usuario,
                    clienteId
                }
            }
        });

        if (!autorizacion)
            throw new ForbiddenException("No tiene autorización para modificar este cliente.");
    }

    async personal(usuario, personalId) {
        if (usuario.rol === "ADMIN") return;

        const autorizacion = await prisma.autorizacionPersonal.findUnique({
            where: {
                usuarioId_personalId: {
                    usuarioId: usuario.id_usuario,
                    personalId
                }
            }
        });

        if (!autorizacion)
            throw new ForbiddenException("No tiene autorización para modificar este registro de personal.");
    }

    async asignarCliente(usuarioId, clienteId) {
        const [usuario, cliente] = await Promise.all([
            prisma.usuario.findUnique({
                where: { id: usuarioId }
            }),
            prisma.cliente.findUnique({
                where: { id: clienteId }
            })
        ]);

        if (!usuario) throw new NotFoundException("Usuario no encontrado.");
        if (!cliente) throw new NotFoundException("Cliente no encontrado.");

        if (!["PRODUCCION", "COMERCIAL"].includes(usuario.rol))
            throw new ConflictException("Solo se pueden asignar autorizaciones a personal de Producción o Comercial.");

        const existente = await prisma.autorizacionCliente.findUnique({
            where: {
                usuarioId_clienteId: {
                    usuarioId,
                    clienteId
                }
            }
        });

        if (existente) throw new ConflictException("El usuario ya tiene autorización sobre este cliente.");

        return prisma.autorizacionCliente.create({
            data: {
                usuarioId,
                clienteId
            }
        });
    }

    async quitarCliente(usuarioId, clienteId) {
        const autorizacion = await prisma.autorizacionCliente.findUnique({
            where: {
                usuarioId_clienteId: {
                    usuarioId,
                    clienteId
                }
            }
        });

        if (!autorizacion) throw new NotFoundException("El usuario no tiene autorización sobre este cliente.");

        return prisma.autorizacionCliente.delete({
            where: {
                usuarioId_clienteId: {
                    usuarioId,
                    clienteId
                }
            }
        });
    }

    async asignarPersonal(usuarioId, personalId) {
        const [usuario, personal] = await Promise.all([
            prisma.usuario.findUnique({
                where: { id: usuarioId }
            }),
            prisma.personal.findUnique({
                where: { id: personalId }
            })
        ]);

        if (!usuario) throw new NotFoundException("Usuario no encontrado.");
        if (!personal) throw new NotFoundException("Personal no encontrado.");

        if (!["PRODUCCION", "COMERCIAL"].includes(usuario.rol))
            throw new ConflictException("Solo se pueden asignar autorizaciones a personal de Producción o Comercial.");

        const existente = await prisma.autorizacionPersonal.findUnique({
            where: {
                usuarioId_personalId: {
                    usuarioId,
                    personalId
                }
            }
        });

        if (existente)
            throw new ConflictException("El usuario ya tiene autorización sobre este registro de personal.");

        return prisma.autorizacionPersonal.create({
            data: {
                usuarioId,
                personalId
            }
        });
    }

    async quitarPersonal(usuarioId, personalId) {
        const autorizacion = await prisma.autorizacionPersonal.findUnique({
            where: {
                usuarioId_personalId: {
                    usuarioId,
                    personalId
                }
            }
        });

        if (!autorizacion)
            throw new NotFoundException("El usuario no tiene autorización sobre este registro de personal.");

        return prisma.autorizacionPersonal.delete({
            where: {
                usuarioId_personalId: {
                    usuarioId,
                    personalId
                }
            }
        });
    }

    async getClientes(clienteId) {
        const cliente = await prisma.cliente.findUnique({
            where: { id: clienteId },
            select: { id: true }
        });

        if (!cliente) throw new NotFoundException("Cliente no encontrado.");

        return prisma.autorizacionCliente.findMany({
            where: { clienteId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        email: true,
                        rol: true,
                        activo: true
                    }
                }
            }
        });
    }

    async getPersonal(personalId) {
        const personal = await prisma.personal.findUnique({
            where: { id: personalId },
            select: { id: true }
        });

        if (!personal) throw new NotFoundException("Personal no encontrado.");

        return prisma.autorizacionPersonal.findMany({
            where: { personalId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        email: true,
                        rol: true,
                        activo: true
                    }
                }
            }
        });
    }
}

module.exports = new AutorizacionService();