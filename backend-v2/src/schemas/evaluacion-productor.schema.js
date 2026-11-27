const { z } = require("zod");

const crearEvaluacionProductorSchema = z.object({
    body: z.object({
        revision: z.string().regex(/^[a-f0-9]{64}$/),

        puntuacion: z.number().int().min(1).max(5),

        comentario: z.string().trim().max(2000)
            .nullable().optional(),

        respuestas: z.record(
            z.string().regex(/^[1-9]\d*$/),
            z.unknown()
        )
    })
});

module.exports = {
    crearEvaluacionProductorSchema
};