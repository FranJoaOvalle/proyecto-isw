const bcrypt = require("bcryptjs");
const prisma = require("../db/prisma");

const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");

class PersonalService {
    async getAll() {
        return prisma.personal.findMany({
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const personal = await prisma.personal.findUnique({
            where: { id }
        });

        if (!personal) throw new NotFoundException("Personal no encontrado.");

        return personal;
    }

    async create(data) {
        return prisma.personal.create({
            data
        });
    }

    async update(id, data) {
        await this.getById(id);

        return prisma.personal.update({
            where: { id },
            data
        });
    }

    async remove(id) {
        const personal = await this.getById(id);

        if (!personal.activo) return personal;

        return prisma.personal.update({
            where: { id },
            data: { activo: false }
        });
    }

    async createUsuario(id, email, password, rol) {
        const passwordHash = await bcrypt.hash(password, 12);

        return prisma.$transaction(async tx => {
            const personal = await tx.personal.findUnique({
                where: { id },
                select: {
                    id: true,
                    usuarioId: true
                }
            });

            if (!personal) throw new NotFoundException("Personal no encontrado.");

            if (personal.usuarioId) throw new ConflictException("El personal ya tiene una cuenta asociada.");

            const usuarioExistente = await tx.usuario.findUnique({
                where: { email }
            });

            if (usuarioExistente) throw new ConflictException("El correo electrónico ya está registrado.");

            const usuario = await tx.usuario.create({
                data: {
                    email,
                    passwordHash,
                    rol
                },
                select: {
                    id: true,
                    email: true,
                    rol: true,
                    activo: true
                }
            });

            await tx.personal.update({
                where: { id },
                data: {
                    usuarioId: usuario.id
                }
            });

            return usuario;
        });
    }
}

module.exports = new PersonalService();