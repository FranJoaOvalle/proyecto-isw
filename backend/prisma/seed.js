const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma");

const main = async () => {
    const passwordHash = await bcrypt.hash("Admin123!", 12);

    await prisma.usuario.upsert({
        where: { email: "admin@nes.cl" },
        update: {},
        create: {
            email: "admin@nes.cl",
            passwordHash,
            rol: "ADMIN"
        }
    });
};

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());;