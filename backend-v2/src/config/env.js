const { z } = require("zod");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria."),
    JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres."),
    FRONTEND_URL: z.url(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
        .enum(["true", "false"])
        .default("false")
        .transform((value) => value === "true"),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SMTP_FROM: z.email()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Configuración de entorno inválida:");

    for (const issue of result.error.issues)
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);

    process.exit(1);
}

module.exports = result.data;