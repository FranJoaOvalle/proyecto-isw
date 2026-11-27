import ActionButton from "../ActionButton";
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
    onEliminarFisico,
    onSolicitar,
    disabled = false
}) {
    const precio = Number(tipoEvento.modalidadPrecio === "POR_HORA"
        ? tipoEvento.tarifaHora
        : tipoEvento.precioBase);
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

                {tipoEvento.incluye && (
                    <div className="mb-2">
                        <small className="text-secondary d-block mb-1">
                            Incluye habitualmente
                        </small>
                        <div style={{ whiteSpace: "pre-line" }}>
                            {tipoEvento.incluye}
                        </div>
                    </div>
                )}

                <div className="bg-body-tertiary rounded p-3 mt-2">
                    <small className="text-secondary d-block mb-1">
                        {tipoEvento.modalidadPrecio === "POR_HORA"
                            ? "Tarifa de referencia por hora"
                            : "Precio base de referencia"}
                    </small>

                    <span className="fs-4 fw-bold">
                        $
                        {Number.isFinite(precio)
                            ? precio.toLocaleString("es-CL")
                            : "0"}
                        {tipoEvento.modalidadPrecio === "POR_HORA" && "/hora"}
                    </span>

                    <small className="text-secondary d-block mt-2">El monto final se acuerda en el presupuesto.</small>
                    <hr />

                    <small className="text-secondary d-block mb-1">
                        Mínimo de asistentes
                    </small>

                    <span className="fw-semibold">
                        {Number.isFinite(cantidadPersonasBase) &&
                        cantidadPersonasBase > 0
                            ? `${cantidadPersonasBase} personas`
                            : "Sin especificar"}
                    </span>
                </div>

                {admin && (
                    <div className="table-actions mt-3">
                        <ActionButton
                            icon="bi-pencil"
                            label="Editar tipo de evento"
                            variant="outline-primary"
                            onClick={onEditar}
                            disabled={disabled}
                        />

                        <ActionButton
                            icon={tipoEvento.activo ? "bi-slash-circle" : "bi-check-circle"}
                            label={tipoEvento.activo ? "Desactivar tipo de evento" : "Activar tipo de evento"}
                            variant={tipoEvento.activo ? "outline-danger" : "outline-success"}
                            onClick={onCambiarEstado}
                            disabled={disabled}
                        />

                        {!tipoEvento.activo && onEliminarFisico && (
                            <ActionButton
                                icon="bi-trash"
                                label="Eliminar tipo de evento"
                                variant="danger"
                                onClick={onEliminarFisico}
                                disabled={disabled}
                            />
                        )}
                    </div>
                )}

                {!admin && tipoEvento.activo && onSolicitar && (
                    <Button
                        className="w-100 mt-3"
                        onClick={onSolicitar}
                        disabled={disabled}
                    >
                        <i className="bi bi-calendar-plus me-2" aria-hidden="true" />
                        Solicitar evento
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
}
