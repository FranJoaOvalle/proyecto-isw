const { z } = require("zod");
module.exports = {
    costoArriendo: z.number().int().min(0).max(999999999999).nullable().optional(),
    unidadArriendo: z.enum(["HORA", "DIA", "EVENTO"]).nullable().optional()
};
