const { z } = require("zod");

const id = z.coerce.number().int().positive().max(2147483647);
const sinFiltro = (valor) => {
    if (valor == null || (typeof valor === "string" && (!valor.trim() || valor.trim() === "TODOS"))) return undefined;
    return valor;
};

const listarSchema = z.object({
    query: z.object({
        estado: z.preprocess(sinFiltro, z.enum(["PENDIENTE", "PAGADO", "FALLIDO", "REEMBOLSADO"]).optional()),
        tipo: z.preprocess(sinFiltro, z.enum(["ANTICIPO", "SALDO"]).optional()),
        presupuestoId: z.preprocess(sinFiltro, id.optional())
    }).strict()
});

const registrarSchema = z.object({
    body: z.object({
        presupuestoId: id,
        tipo: z.enum(["ANTICIPO", "SALDO"])
    }).strict()
});

const confirmarSchema = z.object({
    params: z.object({ id }),
    body: z.object({
        referencia: z.string().trim().min(1).max(255).optional()
    }).strict()
});

const encuestaSchema = z.object({
    params: z.object({ id }),
    body: z.object({}).strict()
});

module.exports = { listarSchema, registrarSchema, confirmarSchema, encuestaSchema };
