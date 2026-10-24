import { Badge, Button, Card } from "react-bootstrap";
import AgendaRegistroDetalle from "./AgendaRegistroDetalle";
import { formatearEstado, obtenerFechaLocal, obtenerNombre, obtenerVarianteEstado } from "./agenda.utils";

export default function AgendaSemana({ agenda }) {
    const {
        vistaAgenda,
        diasSemana,
        cambiarMes,
        irAHoy,
        registrosPorDia,
        seleccionarDia,
        registroListaSeleccionado,
        registrosSemana,
        setRegistroListaSeleccionado,
        cambiandoEstadoActividad,
        esAdmin,
        abrirEdicionActividad,
        completarActividadPendiente,
        marcarActividadPendiente,
        anularActividad,
        setActividadReactivando,
        solicitarEliminacionFisica
    } = agenda;

    if (vistaAgenda !== "semana") return null;

    const seleccionActual = registroListaSeleccionado
        ? registrosSemana.find((registro) =>
                registro.tipoRegistro === registroListaSeleccionado.tipoRegistro &&
                registro.id === registroListaSeleccionado.id
            )
        : null;

    const fechaInicio = diasSemana[0]?.fecha;
    const fechaFin = diasSemana[diasSemana.length - 1]?.fecha;
    const tituloSemana = fechaInicio && fechaFin
        ? `${new Date(`${fechaInicio}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long" })} – ${new Date(`${fechaFin}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`
        : "Semana";

    return (
        <Card className="bg-body text-body border rounded-4 mb-4 overflow-hidden shadow">
            <div className="bg-primary" style={{ height: 5 }} />
            <Card.Body className="p-3 p-lg-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 flex-shrink-0" style={{ width: 54, height: 54 }}>
                            <i className="bi bi-calendar-week fs-3" />
                        </div>
                        <div>
                            <div className="small fw-bold text-primary mb-1">MI AGENDA</div>
                            <h2 className="h4 fw-bold text-capitalize mb-1">{tituloSemana}</h2>
                            <div className="small text-body-secondary">
                                Organiza y consulta tus eventos y actividades
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={() => cambiarMes(-1)} aria-label="Semana anterior">
                            <i className="bi bi-chevron-left me-1" />Anterior
                        </Button>
                        <Button variant="primary" size="sm" className="rounded-3 fw-semibold px-3 shadow-sm" onClick={irAHoy}>
                            <i className="bi bi-calendar-check me-2" />Hoy
                        </Button>
                        <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={() => cambiarMes(1)} aria-label="Semana siguiente">
                            Siguiente<i className="bi bi-chevron-right ms-1" />
                        </Button>
                    </div>
                </div>

                <div className="d-flex align-items-stretch gap-2 overflow-auto pb-2">
                    {diasSemana.map((dia) => {
                        const registros = registrosPorDia[dia.fecha] || [];

                        return (
                            <section
                                key={dia.fecha}
                                className="d-flex flex-column border rounded-4 p-2 flex-grow-1 bg-body"
                                style={{ minWidth: 145, flexBasis: 0, minHeight: 250 }}
                            >
                                <div className="p-2 text-center border-bottom border-secondary border-opacity-25 mb-2">
                                    <span className="small text-body-secondary text-capitalize d-block">
                                        {new Date(`${dia.fecha}T12:00:00`).toLocaleDateString("es-CL", { weekday: "long" })}
                                    </span>
                                    <span className="fs-5 fw-bold text-body">
                                        {new Date(`${dia.fecha}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                                    </span>
                                </div>

                                <div className="d-flex flex-column gap-2 flex-grow-1">
                                    {registros.length === 0 ? (
                                        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center text-body-secondary py-3">
                                            <i className="bi bi-calendar2-check mb-1" />
                                            <span className="small">Sin registros</span>
                                        </div>
                                    ) : registros.map((registro) => {
                                        const esEvento = registro.tipoRegistro === "EVENTO";
                                        const seleccionado = registroListaSeleccionado?.tipoRegistro === registro.tipoRegistro && registroListaSeleccionado?.id === registro.id;
                                        const horaInicio = registro.inicio
                                            ? new Date(registro.inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
                                            : "Hora s/d";
                                        const horaFin = registro.fin
                                            ? new Date(registro.fin).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
                                            : null;

                                        return (
                                            <button
                                                key={`${registro.tipoRegistro}-${registro.id}`}
                                                type="button"
                                                className={`w-100 d-flex flex-column align-items-center justify-content-center text-center rounded-3 border p-2 ${seleccionado ? "border-primary bg-primary bg-opacity-10 shadow-sm" : esEvento ? "border-primary border-opacity-25 bg-primary bg-opacity-10" : "border-success border-opacity-25 bg-success bg-opacity-10"}`}
                                                style={{ minHeight: 104 }}
                                                onClick={() => {
                                                    if (seleccionado) {
                                                        setRegistroListaSeleccionado(null);
                                                        return;
                                                    }

                                                    seleccionarDia(obtenerFechaLocal(new Date(registro.inicio)));
                                                    setRegistroListaSeleccionado(registro);
                                                }}
                                                aria-pressed={seleccionado}
                                            >
                                                <span className={`small fw-semibold d-block mb-1 ${esEvento ? "text-primary" : "text-success"}`}>
                                                    <i className="bi bi-clock me-1" />{horaInicio}{horaFin ? ` – ${horaFin}` : ""}
                                                </span>
                                                <span className="small fw-semibold text-body text-break d-block mb-1">
                                                    {obtenerNombre(registro)}
                                                </span>
                                                <Badge bg={esEvento ? "primary" : "success"} className="rounded-pill mb-1">
                                                    {esEvento ? "Evento" : "Actividad"}
                                                </Badge>
                                                <Badge bg={obtenerVarianteEstado(registro.estado)} className="rounded-pill">
                                                    {formatearEstado(registro.estado) || "Sin estado"}
                                                </Badge>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {seleccionActual ? (
                    <AgendaRegistroDetalle
                        registro={seleccionActual}
                        esAdmin={esAdmin}
                        onClose={() => setRegistroListaSeleccionado(null)}
                        onEdit={abrirEdicionActividad}
                        onComplete={completarActividadPendiente}
                        onSetPending={marcarActividadPendiente}
                        onCancel={anularActividad}
                        onReactivate={setActividadReactivando}
                        onDelete={solicitarEliminacionFisica}
                        changingStatus={cambiandoEstadoActividad}
                    />
                ) : (
                    <div className="small text-body-secondary mt-3">
                        Selecciona un registro para consultar su información detallada.
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
