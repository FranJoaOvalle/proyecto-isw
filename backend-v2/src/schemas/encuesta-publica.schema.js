const { z } = require("zod");

const tokenSchema = z.string().regex(
    /^[A-Za-z0-9_-]{43}$/,
    "El token de la encuesta no es válido."
);

const consultarEncuestaSchema = z.object({
    body: z.object({
        token: tokenSchema
    })
});

const responderEncuestaSchema = z.object({
    body: z.object({
        token: tokenSchema,
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
    consultarEncuestaSchema,
    responderEncuestaSchema
};