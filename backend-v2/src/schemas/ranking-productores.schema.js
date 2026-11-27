const { z } = require("zod");

const rankingProductoresSchema = z.object({
    query: z.object({
        desde: z.iso.datetime({ offset: true }).optional(),
        hasta: z.iso.datetime({ offset: true }).optional()
    }).refine(
        ({ desde, hasta }) =>
            !desde || !hasta || new Date(desde) < new Date(hasta),
        {
            message: "El período seleccionado no es válido.",
            path: ["hasta"]
        }
    )
});

module.exports = {
    rankingProductoresSchema
};