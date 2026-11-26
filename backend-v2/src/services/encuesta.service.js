const prisma = require("../config/prisma");
const NotFoundException = require("../exceptions/NotFoundException");

const include = {
    preguntas: {
        orderBy: { orden: "asc" }
    }
};

class EncuestaService {

    prepararPreguntas(preguntas) {
        return preguntas.map((pregunta, index) => ({
            ...pregunta,
            orden: index + 1
        }));
    }

    async getAll(tipo) {
        return prisma.encuesta.findMany({
            where: tipo ? { tipo } : {},
            include,
            orderBy: { nombre: "asc" }
        });
    }

    async getById(id) {
        const encuesta = await prisma.encuesta.findUnique({
            where: { id },
            include
        });

        if (!encuesta) {
            throw new NotFoundException(
                "Encuesta no encontrada."
            );
        }

        return encuesta;
    }

    async create(data) {
        const { preguntas, ...encuesta } = data;

        return prisma.encuesta.create({
            data: {
                ...encuesta,
                preguntas: {
                    create: this.prepararPreguntas(preguntas)
                }
            },
            include
        });
    }

    async update(id, data) {
        const { preguntas, ...encuesta } = data;

        return prisma.$transaction(async tx => {
            const existente = await tx.encuesta.findUnique({
                where: { id }
            });

            if (!existente) {
                throw new NotFoundException(
                    "Encuesta no encontrada."
                );
            }

            await tx.encuesta.update({
                where: { id },
                data: encuesta
            });

            await tx.preguntaEncuesta.deleteMany({
                where: { encuestaId: id }
            });

            await tx.preguntaEncuesta.createMany({
                data: this.prepararPreguntas(preguntas).map(
                    pregunta => ({
                        ...pregunta,
                        encuestaId: id
                    })
                )
            });

            return tx.encuesta.findUnique({
                where: { id },
                include
            });
        });
    }

    async cambiarEstado(id, activo) {
        await this.getById(id);

        return prisma.encuesta.update({
            where: { id },
            data: { activo },
            include
        });
    }
}

module.exports = new EncuestaService();