-- CreateTable
CREATE TABLE "AutorizacionCliente" (
    "usuarioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "AutorizacionCliente_pkey" PRIMARY KEY ("usuarioId","clienteId")
);

-- CreateTable
CREATE TABLE "AutorizacionPersonal" (
    "usuarioId" INTEGER NOT NULL,
    "personalId" INTEGER NOT NULL,

    CONSTRAINT "AutorizacionPersonal_pkey" PRIMARY KEY ("usuarioId","personalId")
);

-- AddForeignKey
ALTER TABLE "AutorizacionCliente" ADD CONSTRAINT "AutorizacionCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacionCliente" ADD CONSTRAINT "AutorizacionCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacionPersonal" ADD CONSTRAINT "AutorizacionPersonal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizacionPersonal" ADD CONSTRAINT "AutorizacionPersonal_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
