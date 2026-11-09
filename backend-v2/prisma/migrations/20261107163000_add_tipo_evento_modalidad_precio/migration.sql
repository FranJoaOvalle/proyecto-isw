CREATE TYPE "ModalidadPrecioTipoEvento" AS ENUM ('FIJO', 'POR_HORA');

ALTER TABLE "TipoEvento"
ADD COLUMN "modalidadPrecio" "ModalidadPrecioTipoEvento" NOT NULL DEFAULT 'FIJO',
ALTER COLUMN "precioBase" DROP NOT NULL;

ALTER TABLE "TipoEvento"
ADD CONSTRAINT "TipoEvento_modalidadPrecio_check"
CHECK (
    ("modalidadPrecio" = 'FIJO' AND "precioBase" IS NOT NULL AND "tarifaHora" IS NULL)
    OR
    ("modalidadPrecio" = 'POR_HORA' AND "precioBase" IS NULL AND "tarifaHora" IS NOT NULL)
);
