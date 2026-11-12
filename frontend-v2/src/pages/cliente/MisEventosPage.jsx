import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import TableToolbar from "../../components/admin/TableToolbar";
import EventoResumenCard from "../../components/eventos/EventoResumenCard";
import {
    estadosEvento,
    varianteEstado,
    fechaSeguimiento,
    mensajeError
} from "../../components/eventos/seguimiento.utils";
import { listarEventosCliente } from "../../services/eventoCliente.service";

export default function MisEventosPage() {
    const { usuario } = useAuth();
    return <ListadoEventos key={usuario?.id} />;
}

function ListadoEventos() {
    const [eventos, setEventos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const [buscar, setBuscar] = useState("");
    const [estado, setEstado] = useState("");

    useEffect(() => {
        let activo = true;
        listarEventosCliente()
            .then((datos) => { if (activo) setEventos(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar tus eventos.")); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [revision]);

    function recargar() {
        setCargando(true);
        setError("");
        setRevision((actual) => actual + 1);
    }

    const visibles = useMemo(() => {
        const termino = buscar.trim().toLocaleLowerCase("es-CL");
        return eventos.filter((evento) =>
            (!estado || evento.estado === estado) &&
            (!termino || [evento.id, evento.tipoEvento?.nombre, evento.lugar, evento.comuna]
                .join(" ").toLocaleLowerCase("es-CL").includes(termino))
        );
    }, [eventos, buscar, estado]);

    return (
        <Container className="py-5">
            <PageHeader title="Mis eventos" description="Consulta los eventos que has contratado.">
                <Button as={Link} to="/cliente/solicitudes" variant="outline-primary">Mis solicitudes</Button>
            </PageHeader>
            <TableToolbar search={buscar} onSearchChange={setBuscar}
                searchPlaceholder="Buscar por tipo, lugar o número de evento..."
                estado={estado} onEstadoChange={setEstado}
                opcionesEstado={{ "": "Todos los estados", ...estadosEvento }} />
            {error ? (
                <Alert variant="danger">{error} <Button variant="link" onClick={recargar}>Reintentar</Button></Alert>
            ) : cargando ? (
                <div role="status"><Spinner size="sm" /> Cargando eventos...</div>
            ) : !visibles.length ? (
                <EmptyState icon="bi-calendar-heart" title={eventos.length ? "No hay resultados" : "Aún no tienes eventos contratados"}
                    description={eventos.length ? "Prueba con otro texto o estado." : "Tus eventos aparecerán aquí cuando aceptes una propuesta de tu solicitud."} />
            ) : (
                <Row className="g-4">
                    {visibles.map((evento) => (
                        <Col key={evento.id} md={6} xl={4}>
                            <EventoResumenCard evento={{
                                ...evento,
                                nombre: evento.tipoEvento?.nombre ?? "Evento",
                                fecha: fechaSeguimiento(evento.inicio),
                                estado: estadosEvento[evento.estado] ?? evento.estado,
                                estadoVariant: varianteEstado[evento.estado]
                            }} detalleUrl={`/cliente/eventos/${evento.id}`} />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}
