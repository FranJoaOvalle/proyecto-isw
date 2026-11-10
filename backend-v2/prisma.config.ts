import "../src/config/loadEnv.js";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.js",
    },
    datasource: {
        url: process.env["DATABASE_URL"],
    },
});
