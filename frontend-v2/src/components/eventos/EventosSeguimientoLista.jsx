import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../PageHeader";
import EmptyState from "../EmptyState";
import TableToolbar from "../admin/TableToolbar";
import EventoResumenCard from "./EventoResumenCard";
import { getEventosSeguimiento } from "../../services/seguimiento.service";
import {
    estadosEvento,
    varianteEstado,
    fechaSeguimiento,
    mensajeError
} from "./seguimiento.utils";

export default function EventosSeguimientoLista() {
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "ADMIN";
    const [eventos, setEventos] = useState([]);
    const [filtros, setFiltros] = useState({ buscar: "", estado: "" });
    const [consulta, setConsulta] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let activo = true;
        async function cargar() {
            setCargando(true);
            setError("");
            try {
                const datos = await getEventosSeguimiento(consulta);
                if (activo) setEventos(datos);
            } catch (err) {
                if (activo)
                    setError(
                        mensajeError(err, "No fue posible cargar los eventos.")
                    );
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => {
            activo = false;
        };
    }, [consulta]);
    return (
        <Container className="py-5">
            <PageHeader
                title={esAdmin ? "Eventos" : "Eventos asignados"}
                description={
                    esAdmin
                        ? "Consulta los eventos registrados y su seguimiento."
                        : "Consulta el seguimiento de los eventos que tienes asignados."
                }
            />
            <Form
                className="mb-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    setConsulta(
                        Object.fromEntries(
                            Object.entries(filtros).filter(([, v]) => v)
                        )
                    );
                }}
            >
                <TableToolbar
                    search={filtros.buscar}
                    onSearchChange={(buscar) =>
                        setFiltros({ ...filtros, buscar })
                    }
                    searchPlaceholder="Buscar por tipo de evento o lugar..."
                    estado={filtros.estado}
                    onEstadoChange={(estado) =>
                        setFiltros({ ...filtros, estado })
                    }
                    opcionesEstado={{ "": "Todos", ...estadosEvento }}
                >
                    <div className="d-flex gap-2">
                        <Button type="submit">Buscar</Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setFiltros({ buscar: "", estado: "" });
                                setConsulta({});
                            }}
                        >
                            Limpiar
                        </Button>
                    </div>
                </TableToolbar>
            </Form>
            {error ? (
                <Alert variant="danger">
                    {error}{" "}
                    <Button
                        variant="link"
                        onClick={() => setConsulta({ ...consulta })}
                    >
                        Reintentar
                    </Button>
                </Alert>
            ) : cargando ? (
                <div role="status">
                    <Spinner size="sm" /> Cargando eventos...
                </div>
            ) : eventos.length === 0 ? (
                <EmptyState
                    icon="bi-calendar-event"
                    title="Sin eventos"
                    description="No hay eventos que coincidan con los filtros actuales."
                />
            ) : (
                <Row className="g-4">
                    {eventos.map((evento) => (
                        <Col
                            key={evento.id}
                            md={6}
                            xl={4}
                        >
                            <EventoResumenCard
                                evento={{
                                    ...evento,
                                    nombre: evento.tipoEvento.nombre,
                                    fecha: fechaSeguimiento(evento.inicio),
                                    estado: estadosEvento[evento.estado],
                                    estadoVariant: varianteEstado[evento.estado]
                                }}
                                detalleUrl={`/${esAdmin ? "admin" : "productor"}/eventos/${evento.id}`}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}
