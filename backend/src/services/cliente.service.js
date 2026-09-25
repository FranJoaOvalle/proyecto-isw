const bcrypt = require("bcryptjs");

const prisma = require("../db/prisma");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class ClienteService {
    async getAll() {
        return prisma.cliente.findMany({
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const cliente = await prisma.cliente.findUnique({
            where: { id }
        });

        if (!cliente) throw new NotFoundException("Cliente no encontrado.");

        return cliente;
    }

    async create(data) {
        return prisma.cliente.create({
            data
        });
    }

    async update(id, data) {
        await this.getById(id);

        return prisma.cliente.update({
            where: { id },
            data
        });
    }

    async remove(id) {
        const cliente = await this.getById(id);

        if (!cliente.activo) return cliente;

        return prisma.cliente.update({
            where: { id },
            data: { activo: false }
        });
    }

    async createUsuario(id, email, password) {
        const passwordHash = await bcrypt.hash(password, 12);

        return prisma.$transaction(async tx => {
            const cliente = await tx.cliente.findUnique({
                where: { id },
                select: {
                    id: true,
                    usuarioId: true
                }
            });

            if (!cliente) throw new NotFoundException("Cliente no encontrado.");

            if (cliente.usuarioId) throw new ConflictException("El cliente ya tiene una cuenta asociada.");

            const usuarioExistente = await tx.usuario.findUnique({
                where: { email }
            });

            if (usuarioExistente) throw new ConflictException("El correo electrónico ya está registrado.");

            const usuario = await tx.usuario.create({
                data: {
                    email,
                    passwordHash,
                    rol: "CLIENTE"
                },
                select: {
                    id: true,
                    email: true,
                    rol: true,
                    activo: true
                }
            });

            await tx.cliente.update({
                where: { id },
                data: {
                    usuarioId: usuario.id
                }
            });

            return usuario;
        });
    }
}

module.exports = new ClienteService();