require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

const main = async () => {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password)
        throw new Error("Faltan SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD en .env.");

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.usuario.upsert({
        where: { email },
        update: {
            passwordHash,
            rol: "ADMIN",
            activo: true
        },
        create: {
            email,
            passwordHash,
            rol: "ADMIN"
        }
    });

    console.log(`Admin inicial listo: ${email}`);
};

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });