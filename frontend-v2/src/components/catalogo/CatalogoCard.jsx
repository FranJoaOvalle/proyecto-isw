import {
    Badge,
    Button,
    Card
} from "react-bootstrap";

export default function CatalogoCard({
    tipoEvento,
    admin = false,
    onEditar,
    onCambiarEstado,
    disabled = false
}) {
    const precioBase = Number(tipoEvento.precioBase);
    const cantidadPersonasBase = Number(
        tipoEvento.cantidadPersonasBase
    );

    return (
        <Card className="h-100 shadow-sm overflow-hidden">
            {tipoEvento.imagen_url ? (
                <Card.Img
                    variant="top"
                    src={tipoEvento.imagen_url}
                    alt={`Imagen de ${tipoEvento.nombre}`}
                    style={{
                        height: "220px",
                        objectFit: "cover"
                    }}
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : (
                <div
                    className="d-flex align-items-center justify-content-center bg-body-tertiary"
                    style={{ height: "220px" }}
                >
                    <i className="bi bi-calendar-event fs-1 text-secondary" />
                </div>
            )}

            <Card.Body className="d-flex flex-column p-4">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <Card.Title className="fw-bold mb-0">
                        {tipoEvento.nombre}
                    </Card.Title>

                    {admin && (
                        <Badge
                            bg={
                                tipoEvento.activo
                                    ? "success"
                                    : "secondary"
                            }
                        >
                            {tipoEvento.activo
                                ? "Activo"
                                : "Inactivo"}
                        </Badge>
                    )}
                </div>

                <Card.Text className="text-secondary flex-grow-1">
                    {tipoEvento.descripcion || "Sin descripción."}
                </Card.Text>

                <div className="bg-body-tertiary rounded p-3 mt-2">
                    <small className="text-secondary d-block mb-1">
                        Precio base
                    </small>

                    <span className="fs-4 fw-bold">
                        $
                        {Number.isFinite(precioBase)
                            ? precioBase.toLocaleString("es-CL")
                            : "0"}
                    </span>

                    <hr />

                    <small className="text-secondary d-block mb-1">
                        Cantidad de personas base
                    </small>

                    <span className="fw-semibold">
                        {Number.isFinite(cantidadPersonasBase) &&
                        cantidadPersonasBase > 0
                            ? `${cantidadPersonasBase} personas`
                            : "No especificada"}
                    </span>
                </div>

                {admin && (
                    <div className="d-flex gap-2 mt-3">
                        <Button
                            variant="outline-primary"
                            className="flex-grow-1"
                            onClick={onEditar}
                            disabled={disabled}
                        >
                            <i className="bi bi-pencil me-2" />
                            Editar
                        </Button>

                        <Button
                            variant={
                                tipoEvento.activo
                                    ? "outline-danger"
                                    : "outline-success"
                            }
                            className="flex-grow-1"
                            onClick={onCambiarEstado}
                            disabled={disabled}
                        >
                            <i
                                className={
                                    tipoEvento.activo
                                        ? "bi bi-x-circle me-2"
                                        : "bi bi-check-circle me-2"
                                }
                            />

                            {tipoEvento.activo
                                ? "Desactivar"
                                : "Activar"}
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}