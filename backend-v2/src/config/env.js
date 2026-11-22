const { z } = require("zod");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria."),
    JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres."),
    FRONTEND_URL: z.url(),
    CLIENTE_FRECUENTE_MIN_EVENTOS_COMPLETADOS: z.coerce.number().int().min(1).default(3),
    PAGO_DIAS_ALERTA_COMPROMISO: z.coerce.number().int().min(1).default(3),
    PAGO_DIAS_ALERTA_EVENTO: z.coerce.number().int().min(1).default(7),
    PAGO_ENCUESTA_REINTENTO_MINUTOS: z.coerce.number().int().min(1).default(10),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
        .enum(["true", "false"])
        .default("false")
        .transform((value) => value === "true"),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.email().optional(),
    SURVEY_URL: z.url().optional()
}).superRefine((config, context) => {
    if (config.NODE_ENV === "production" &&
        (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS || !config.SMTP_FROM)) {
        context.addIssue({
            code: "custom",
            path: ["SMTP_HOST"],
            message: "La configuración SMTP completa es obligatoria en producción."
        });
    }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Configuración de entorno inválida:");

    for (const issue of result.error.issues)
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);

    process.exit(1);
}

module.exports = result.data;
