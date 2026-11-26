const { z } = require("zod");

const tipoEncuesta = z.enum([
    "CLIENTE_EVENTO",
    "ADMIN_PRODUCTOR"
]);

const tipoPregunta = z.enum([
    "ESCALA",
    "TEXTO",
    "SI_NO",
    "SELECCION_UNICA",
    "SELECCION_MULTIPLE"
]);

const preguntaSchema = z.object({
    enunciado: z.string().trim().min(3).max(500),
    tipo: tipoPregunta,
    obligatoria: z.boolean().default(true),
    opciones: z.array(
        z.string().trim().min(1).max(150)
    ).max(20).default([])
}).superRefine((data, ctx) => {
    const requiereOpciones = [
        "SELECCION_UNICA",
        "SELECCION_MULTIPLE"
    ].includes(data.tipo);

    if (requiereOpciones && data.opciones.length < 2) {
        ctx.addIssue({
            code: "custom",
            path: ["opciones"],
            message: "Debes proporcionar al menos dos opciones."
        });
    }

    if (!requiereOpciones && data.opciones.length > 0) {
        ctx.addIssue({
            code: "custom",
            path: ["opciones"],
            message: "Este tipo de pregunta no admite opciones."
        });
    }

    const opciones = data.opciones.map(
        opcion => opcion.toLowerCase()
    );

    if (new Set(opciones).size !== opciones.length) {
        ctx.addIssue({
            code: "custom",
            path: ["opciones"],
            message: "No se permiten opciones duplicadas."
        });
    }
});

const encuestaBaseSchema = z.object({
    nombre: z.string().trim().min(3).max(100),
    descripcion: z.string().trim().max(1000).nullable().optional(),
    preguntas: z.array(preguntaSchema).min(1).max(30)
});

const createEncuestaSchema = z.object({
    body: encuestaBaseSchema.extend({
        tipo: tipoEncuesta
    })
});

const updateEncuestaSchema = z.object({
    body: encuestaBaseSchema
});

const estadoEncuestaSchema = z.object({
    body: z.object({
        activo: z.boolean()
    })
});

const getEncuestasSchema = z.object({
    query: z.object({
        tipo: tipoEncuesta.optional()
    })
});

module.exports = {
    createEncuestaSchema,
    updateEncuestaSchema,
    estadoEncuestaSchema,
    getEncuestasSchema
};