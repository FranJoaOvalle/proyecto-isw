-- CreateTable
CREATE TABLE "EvaluacionProductor" (
    "id" SERIAL NOT NULL,
    "productorId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "evaluadorId" INTEGER NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "formulario" JSONB NOT NULL,
    "respuestas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionProductor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionProductor_eventoId_key" ON "EvaluacionProductor"("eventoId");

-- CreateIndex
CREATE INDEX "EvaluacionProductor_productorId_idx" ON "EvaluacionProductor"("productorId");

-- CreateIndex
CREATE INDEX "EvaluacionProductor_evaluadorId_idx" ON "EvaluacionProductor"("evaluadorId");

-- CreateIndex
CREATE INDEX "EvaluacionProductor_encuestaId_idx" ON "EvaluacionProductor"("encuestaId");

-- AddForeignKey
ALTER TABLE "EvaluacionProductor" ADD CONSTRAINT "EvaluacionProductor_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionProductor" ADD CONSTRAINT "EvaluacionProductor_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionProductor" ADD CONSTRAINT "EvaluacionProductor_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionProductor" ADD CONSTRAINT "EvaluacionProductor_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
