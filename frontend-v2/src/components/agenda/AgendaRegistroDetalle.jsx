import ActionButton from "../ActionButton";
import { Badge, Card, Col, Row } from "react-bootstrap";
import {
    TIPOS_ACTIVIDAD,
    formatearEstado,
    formatearFecha,
    obtenerProductoresAsignados,
    obtenerVarianteEstado
} from "./agenda.utils";

const obtenerNombreCliente = (cliente) => {
    if (!cliente) return "No disponible";

    if (cliente.tipo === "EMPRESA") {
        return cliente.empresa?.razonSocial || "Cliente empresa";
    }

    return `${cliente.persona?.nombres || ""} ${cliente.persona?.apellidos || ""}`.trim() || "Cliente persona";
};

const obtenerNombreProductor = (productor) =>
    productor
        ? `${productor.nombres || ""} ${productor.apellidos || ""}`.trim() || "Productor sin nombre"
        : "Productor no asignado";

export default function AgendaRegistroDetalle({
    registro,
    esAdmin,
    onClose,
    onEdit,
    onComplete,
    onSetPending,
    onCancel,
    onReactivate,
    onDelete,
    changingStatus = false
}) {
    if (!registro) return null;

    const esEvento = registro.tipoRegistro === "EVENTO";
    const productores = esEvento ? [] : obtenerProductoresAsignados(registro);
    const descripcion = esEvento
        ? registro.observaciones || registro.tipoEvento?.descripcion
        : registro.descripcion;

    return (
        <Card className={`mt-2 border border-${esEvento ? "primary" : "success"} border-opacity-50 rounded-4 overflow-hidden shadow-sm`}>
            <div className={esEvento ? "bg-primary" : "bg-success"} style={{ height: 4 }} />
            <Card.Body className="p-3 p-lg-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                    <div>
                        <div className={`small text-${esEvento ? "primary" : "success"} fw-semibold mb-1`}>
                            {esEvento ? "DETALLE DEL EVENTO" : "DETALLE DE LA ACTIVIDAD"}
                        </div>
                        <h3 className="h5 fw-bold mb-2">
                            {esEvento ? registro.tipoEvento?.nombre || "Evento" : registro.titulo || "Actividad"}
                        </h3>
                        <div className="d-flex flex-wrap gap-2">
                            <Badge bg={esEvento ? "primary" : "success"}>
                                {esEvento ? "Evento contratado" : "Actividad"}
                            </Badge>
                            {!esEvento && (
                                <Badge bg="info">
                                    {TIPOS_ACTIVIDAD.find((tipo) => tipo.value === registro.tipo)?.label || "Sin tipo"}
                                </Badge>
                            )}
                            <Badge bg={obtenerVarianteEstado(registro.estado)}>
                                {formatearEstado(registro.estado) || "Sin estado"}
                            </Badge>
                        </div>
                    </div>

                    {onClose && (
                        <ActionButton
                            icon="bi-x-lg"
                            label="Cerrar detalles"
                            variant="outline-secondary"
                            onClick={onClose}
                        />
                    )}
                </div>

                <Row className="g-3">
                    <Col xs={12} md={6}>
                        <div className="border rounded-3 p-3 h-100">
                            <div className="small text-body-secondary mb-1">
                                <i className="bi bi-clock text-primary me-2" />Inicio
                            </div>
                            <div className="fw-semibold">{formatearFecha(registro.inicio)}</div>
                        </div>
                    </Col>
                    <Col xs={12} md={6}>
                        <div className="border rounded-3 p-3 h-100">
                            <div className="small text-body-secondary mb-1">
                                <i className="bi bi-clock-history text-primary me-2" />Término
                            </div>
                            <div className="fw-semibold">{formatearFecha(registro.fin)}</div>
                        </div>
                    </Col>
                    <Col xs={12} md={esEvento ? 4 : 12}>
                        <div className="border rounded-3 p-3 h-100">
                            <div className="small text-body-secondary mb-1">
                                <i className="bi bi-geo-alt text-primary me-2" />Lugar
                            </div>
                            <div className="fw-semibold">{registro.lugar || "Sin lugar definido"}</div>
                        </div>
                    </Col>
                    {esEvento && (
                        <>
                            <Col xs={12} md={4}>
                                <div className="border rounded-3 p-3 h-100">
                                    <div className="small text-body-secondary mb-1">
                                        <i className="bi bi-people text-primary me-2" />Asistentes
                                    </div>
                                    <div className="fw-semibold">{registro.asistentes ?? "Sin definir"}</div>
                                </div>
                            </Col>
                            <Col xs={12} md={4}>
                                <div className="border rounded-3 p-3 h-100">
                                    <div className="small text-body-secondary mb-1">
                                        <i className="bi bi-person text-primary me-2" />Cliente
                                    </div>
                                    <div className="fw-semibold">{obtenerNombreCliente(registro.cliente)}</div>
                                </div>
                            </Col>
                            <Col xs={12} md={4}>
                                <div className="border rounded-3 p-3 h-100">
                                    <div className="small text-body-secondary mb-1">
                                        <i className="bi bi-person-badge text-primary me-2" />Productor asignado
                                    </div>
                                    <div className="fw-semibold">{obtenerNombreProductor(registro.productor)}</div>
                                </div>
                            </Col>
                        </>
                    )}
                    {!esEvento && registro.evento?.cliente && (
                        <Col xs={12} md={6}>
                            <div className="border rounded-3 p-3 h-100">
                                <div className="small text-body-secondary mb-1">
                                    <i className="bi bi-person text-primary me-2" />Cliente asociado
                                </div>
                                <div className="fw-semibold">{obtenerNombreCliente(registro.evento.cliente)}</div>
                                {registro.evento.tipoEvento?.nombre && (
                                    <div className="small text-body-secondary mt-1">
                                        {registro.evento.tipoEvento.nombre}
                                    </div>
                                )}
                            </div>
                        </Col>
                    )}
                    {!esEvento && registro.evento && (
                        <Col xs={12}>
                            <div className="border border-primary border-opacity-25 rounded-3 p-3 bg-primary bg-opacity-10">
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                    <div className="fw-semibold">
                                        <i className="bi bi-calendar-event text-primary me-2" />
                                        Evento relacionado
                                    </div>
                                    <Badge bg={obtenerVarianteEstado(registro.evento.estado)}>
                                        {formatearEstado(registro.evento.estado) || "Sin estado"}
                                    </Badge>
                                </div>
                                <div className="fw-semibold mb-2">
                                    {registro.evento.tipoEvento?.nombre || "Evento contratado"}
                                </div>
                                <div className="d-flex flex-column flex-md-row flex-wrap gap-2 gap-md-4 small text-body-secondary">
                                    <span>
                                        <i className="bi bi-clock me-1" />
                                        {formatearFecha(registro.evento.inicio)}
                                        {registro.evento.fin ? ` – ${formatearFecha(registro.evento.fin)}` : ""}
                                    </span>
                                    <span>
                                        <i className="bi bi-geo-alt me-1" />
                                        {registro.evento.lugar || "Sin lugar definido"}
                                    </span>
                                </div>
                            </div>
                        </Col>
                    )}
                    <Col xs={12}>
                        <div className="border rounded-3 p-3">
                            <div className="small text-body-secondary mb-2">
                                <i className="bi bi-card-text text-primary me-2" />
                                {esEvento ? "Observaciones" : "Descripción"}
                            </div>
                            <p className="mb-0 text-body-secondary" style={{ whiteSpace: "pre-wrap" }}>
                                {descripcion || "Sin observaciones disponibles."}
                            </p>
                        </div>
                    </Col>
                </Row>

                {!esEvento && productores.length > 0 && (
                    <div className="border rounded-3 p-3 mt-3">
                        <div className="fw-semibold mb-2">
                            <i className="bi bi-people text-primary me-2" />Productores asignados
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {productores.map((productor) => (
                                <Badge key={productor.id} bg={productor.esResponsable ? "primary" : "secondary"} pill>
                                    {productor.nombre}{productor.esResponsable ? " · Responsable" : ""}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {!esEvento && (
                    <div className="table-actions justify-content-start mt-4">
                        {registro.estado === "PENDIENTE" && onComplete && (
                            <ActionButton
                                icon="bi-check2-circle"
                                label="Completar actividad"
                                variant="outline-success"
                                onClick={() => onComplete(registro)}
                                disabled={changingStatus}
                            />
                        )}
                        {registro.estado === "COMPLETADA" && onSetPending && (
                            <ActionButton
                                icon="bi-arrow-counterclockwise"
                                label="Marcar actividad como pendiente"
                                variant="outline-secondary"
                                onClick={() => onSetPending(registro)}
                                disabled={changingStatus}
                            />
                        )}
                        {onEdit && (registro.estado !== "CANCELADA" || esAdmin) && (
                            <ActionButton
                                icon="bi-pencil"
                                label="Editar actividad"
                                variant="outline-primary"
                                onClick={() => onEdit(registro)}
                            />
                        )}
                        {registro.estado !== "CANCELADA" && onCancel && (
                            <ActionButton
                                icon="bi-x-circle"
                                label="Cancelar actividad"
                                variant="outline-danger"
                                onClick={() => onCancel(registro)}
                            />
                        )}
                        {esAdmin && registro.estado === "CANCELADA" && onReactivate && (
                            <ActionButton
                                icon="bi-check-circle"
                                label="Reactivar actividad"
                                variant="outline-success"
                                onClick={() => onReactivate(registro)}
                                disabled={changingStatus}
                            />
                        )}
                        {!esEvento && esAdmin && registro.estado === "CANCELADA" && onDelete && (
                            <ActionButton
                                icon="bi-trash"
                                label="Eliminar actividad"
                                variant="danger"
                                onClick={() => onDelete(registro)}
                            />
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
