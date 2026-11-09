import { Badge, Button, Card, Spinner } from "react-bootstrap";
import EmptyState from "../EmptyState";
import AgendaRegistroDetalle from "./AgendaRegistroDetalle";
import { TIPOS_ACTIVIDAD, obtenerFechaLocal, obtenerNombre, formatearDia, obtenerVarianteEstado, formatearEstado } from "./agenda.utils";

export default function AgendaLista({ agenda }) {
    const { esAdmin, vistaAgenda, mesVisible, cambiarMes, irAHoy, registrosDelMes, cargando, cambiandoEstadoActividad, registroListaSeleccionado, setRegistroListaSeleccionado, abrirEdicionActividad, completarActividadPendiente, anularActividad, setActividadReactivando, solicitarEliminacionFisica } = agenda;

    return (
        <>            {vistaAgenda === "lista" && (
                <Card className="bg-body text-body border rounded-4 mb-4 overflow-hidden shadow">
                    <div className="bg-primary" style={{ height: 5 }} />

                    <Card.Body className="p-3 p-lg-4">
                        {/* Encabezado de la lista */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 flex-shrink-0"
                                    style={{ width: 54, height: 54 }}
                                >
                                    <i className="bi bi-list-ul fs-3" />
                                </div>

                                <div className="min-w-0">
                                    <div className="small fw-bold text-primary mb-1">
                                        MI AGENDA
                                    </div>
                                    <h2 className="h4 fw-bold text-capitalize mb-1">
                                        {mesVisible.toLocaleDateString("es-CL", {
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </h2>
                                    <div className="small text-body-secondary">
                                        Organiza y consulta tus eventos y actividades
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between justify-content-lg-end gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="rounded-3"
                                        onClick={() => cambiarMes(-1)}
                                        aria-label="Mes anterior"
                                    >
                                        <i className="bi bi-chevron-left me-1" />Anterior
                                    </Button>

                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="rounded-3 fw-semibold px-3 shadow-sm"
                                        onClick={irAHoy}
                                    >
                                        <i className="bi bi-calendar-check me-2" />
                                        Hoy
                                    </Button>

                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="rounded-3"
                                        onClick={() => cambiarMes(1)}
                                        aria-label="Mes siguiente"
                                    >
                                        Siguiente<i className="bi bi-chevron-right ms-1" />
                                    </Button>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="d-flex flex-wrap gap-2 mb-4">
                            <div className="border rounded-3 px-3 py-2 d-flex align-items-center gap-2">
                                <i className="bi bi-calendar-event text-primary fs-5" />
                                <div>
                                    <div className="small text-body-secondary">Eventos</div>
                                    <div className="fw-bold">
                                        {registrosDelMes.filter(
                                            (registro) => registro.tipoRegistro === "EVENTO"
                                        ).length}
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-3 px-3 py-2 d-flex align-items-center gap-2">
                                <i className="bi bi-list-check text-success fs-5" />
                                <div>
                                    <div className="small text-body-secondary">Actividades</div>
                                    <div className="fw-bold">
                                        {registrosDelMes.filter(
                                            (registro) => registro.tipoRegistro === "ACTIVIDAD"
                                        ).length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {cargando ? (
                            <div className="d-flex flex-column align-items-center py-5">
                                <Spinner animation="border" variant="primary" className="mb-3" />
                                <span className="small text-body-secondary">
                                    Cargando agenda...
                                </span>
                            </div>
                        ) : registrosDelMes.length === 0 ? (
                            <EmptyState
                                icon="bi-calendar2-check"
                                title="Sin registros"
                                description="No hay eventos ni actividades para este mes con los filtros actuales."
                            />
                        ) : (
                            <>
                                {/* Lista compacta agrupada por día */}
                                    <div className="d-flex flex-column gap-3">
                                    {registrosDelMes.map((registro, indice) => {
                                        const esEvento = registro.tipoRegistro === "EVENTO";
                                        const fechaRegistro = new Date(registro.inicio);

                                        const fechaAnterior = indice > 0
                                            ? new Date(registrosDelMes[indice - 1].inicio)
                                            : null;

                                        const cambiaDia =
                                            !fechaAnterior ||
                                            obtenerFechaLocal(fechaRegistro) !==
                                                obtenerFechaLocal(fechaAnterior);

                                        const seleccionado =
                                            registroListaSeleccionado?.tipoRegistro ===
                                                registro.tipoRegistro &&
                                            registroListaSeleccionado?.id === registro.id;

                                        return (
                                            <div key={`${registro.tipoRegistro}-${registro.id}`}>
                                                {cambiaDia && (
                                                    <div className="d-flex align-items-center gap-2 mb-2 mt-1">
                                                        <div
                                                            className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                                                            style={{ width: 34, height: 34 }}
                                                        >
                                                            <i className="bi bi-calendar3" />
                                                        </div>

                                                        <div>
                                                            <h3 className="h6 fw-bold text-capitalize mb-0">
                                                                {formatearDia(
                                                                    obtenerFechaLocal(fechaRegistro)
                                                                )}
                                                            </h3>
                                                            <span className="small text-body-secondary">
                                                                {fechaRegistro.toLocaleDateString("es-CL", {
                                                                    day: "numeric",
                                                                    month: "long"
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    className={`w-100 text-start border rounded-3 p-2 p-md-3 ${
                                                        seleccionado
                                                            ? "border-primary bg-body-tertiary"
                                                            : "border-secondary border-opacity-25 bg-body"
                                                    }`}
                                                    style={{
                                                        cursor: "pointer",
                                                        transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                                                        boxShadow: seleccionado
                                                            ? "0 0 0 1px var(--bs-primary)"
                                                            : "none"
                                                    }}
                                                    onClick={() => {
                                                        setRegistroListaSeleccionado(
                                                            seleccionado ? null : registro
                                                        );
                                                    }}
                                                    aria-pressed={seleccionado}
                                                >
                                                    <div className="d-flex align-items-center gap-2 gap-md-3">
                                                        {/* Horario */}
                                                        <div className="d-flex align-items-center gap-2 rounded-3 border bg-body-tertiary px-2 py-2 flex-shrink-0">
                                                            <i className="bi bi-clock text-body-secondary small" />
                                                            <div className="d-flex align-items-center gap-1 text-nowrap">
                                                                <span className="fw-semibold text-body">
                                                                {fechaRegistro.toLocaleTimeString("es-CL", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                                </span>

                                                                <i className="bi bi-arrow-right-short text-body-secondary" />
                                                                <span className="small text-body-secondary">
                                                                {registro.fin
                                                                    ? new Date(registro.fin).toLocaleTimeString(
                                                                        "es-CL",
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit"
                                                                        }
                                                                    )
                                                                    : "Sin fin"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Información resumida */}
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="fw-semibold text-body text-truncate mb-1">
                                                                {obtenerNombre(registro)}
                                                            </div>

                                                            <div className="d-flex flex-wrap gap-1 gap-sm-2">
                                                                <Badge bg={esEvento ? "primary" : "success"} className="rounded-pill">
                                                                    {esEvento ? "Evento" : "Actividad"}
                                                                </Badge>

                                                                {!esEvento && (
                                                                    <Badge bg="info" className="rounded-pill">
                                                                        {TIPOS_ACTIVIDAD.find(
                                                                            (tipo) => tipo.value === registro.tipo
                                                                        )?.label || "Sin tipo"}
                                                                    </Badge>
                                                                )}

                                                                <Badge bg={obtenerVarianteEstado(registro.estado)} className="rounded-pill">
                                                                    {formatearEstado(registro.estado) || "Sin estado"}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Indicador de selección */}
                                                        <i
                                                            className={`bi ${
                                                                seleccionado
                                                                    ? "bi-chevron-up"
                                                                    : "bi-chevron-down"
                                                            } text-body-secondary`}
                                                        />
                                                    </div>
                                                </button>
                                                {seleccionado && (
                                                    <AgendaRegistroDetalle
                                                        registro={registro}
                                                        esAdmin={esAdmin}
                                                        onClose={() => setRegistroListaSeleccionado(null)}
                                                        onEdit={abrirEdicionActividad}
                                                        onComplete={completarActividadPendiente}
                                                        onSetPending={agenda.marcarActividadPendiente}
                                                        onCancel={anularActividad}
                                                        onReactivate={setActividadReactivando}
                                                        onDelete={solicitarEliminacionFisica}
                                                        changingStatus={cambiandoEstadoActividad}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                            </>
                        )}
                    </Card.Body>
                </Card>
            )}

        </>
    );
}
