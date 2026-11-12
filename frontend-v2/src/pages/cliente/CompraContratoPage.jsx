import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import PresupuestoResumen from "../../components/presupuestos/PresupuestoResumen";
import { estadoPropuestaCliente, propuestaVigente } from "../../components/presupuestos/presupuesto.utils";
import { estadosEvento, mensajeError } from "../../components/eventos/seguimiento.utils";
import { aceptarPresupuesto, listarPresupuestos } from "../../services/presupuesto.service";

export default function CompraContratoPage() {
    const { usuario } = useAuth();
    return <CompraContrato key={usuario?.id} />;
}

function CompraContrato() {
    const [parametros] = useSearchParams();
    const solicitudId = parametros.get("solicitudId");
    const [presupuestos, setPresupuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [propuesta, setPropuesta] = useState(null);
    const [aceptacionExpresa, setAceptacionExpresa] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorAceptacion, setErrorAceptacion] = useState("");
    const [resultadoIncierto, setResultadoIncierto] = useState(false);
    const [revision, setRevision] = useState(0);

    function cargar() {
        setCargando(true);
        setError("");
        setRevision((valor) => valor + 1);
    }

    useEffect(() => {
        let activo = true;
        listarPresupuestos()
            .then((datos) => { if (activo) setPresupuestos(datos); })
            .catch((err) => { if (activo) setError(mensajeError(err, "No fue posible cargar tus propuestas.")); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [revision]);

    async function confirmarAceptacion() {
        if (!propuesta || !aceptacionExpresa || saving || resultadoIncierto) return;
        setSaving(true);
        setErrorAceptacion("");
        try {
            const resultado = await aceptarPresupuesto(propuesta.id, propuesta.version);
            setPropuesta(null);
            setMensaje(`Contratación confirmada. Tu evento es el #${resultado.evento.id}.`);
            cargar();
        } catch (err) {
            const incierto = !err.response || err.response.status >= 500;
            setResultadoIncierto(incierto);
            setErrorAceptacion(incierto
                ? "No pudimos confirmar el resultado de la contratación. Actualiza las propuestas para comprobar si se creó el evento antes de volver a aceptar."
                : mensajeError(err, "No fue posible aceptar esta propuesta. Revisa su estado actualizado."));
            cargar();
        } finally {
            setSaving(false);
        }
    }

    const visibles = presupuestos.filter((item) => !solicitudId || String(item.solicitudId) === solicitudId);
    return (
        <Container className="py-5">
            <PageHeader title="Compra / Contrato" description="Revisa las propuestas de tus solicitudes y confirma la que deseas contratar.">
                <Button variant="outline-primary" className="me-2" disabled={cargando || saving} onClick={cargar}>Actualizar propuestas</Button>
                <Button as={Link} to="/cliente/solicitudes" variant="outline-secondary">Mis solicitudes</Button>
            </PageHeader>
            {mensaje && <Alert variant="success" dismissible onClose={() => setMensaje("")}>{mensaje}</Alert>}
            {error && <Alert variant="danger">{error} <Button variant="link" onClick={cargar}>Reintentar</Button></Alert>}
            {solicitudId && <Button as={Link} to="/cliente/compra" variant="link" className="mb-3">Ver todas mis propuestas</Button>}
            {cargando ? <div role="status"><Spinner size="sm" /> Cargando propuestas...</div> : !error && (
                !visibles.length ? (
                    <EmptyState icon="bi-receipt" title="Sin propuestas disponibles"
                        description="Cuando un administrador envíe una propuesta para tu solicitud, podrás revisarla aquí." />
                ) : visibles.map((presupuesto) => {
                    const eventoSolicitud = presupuesto.evento ?? presupuesto.solicitud?.evento;
                    const contratada = presupuesto.solicitud?.estado === "CONTRATADA";
                    const aceptable = propuestaVigente(presupuesto) &&
                        presupuesto.solicitud?.estado === "EN_REVISION" && !presupuesto.evento;
                    return (
                        <Card key={presupuesto.id} className="shadow-sm mb-4">
                            <Card.Body className="p-4">
                                <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                                    <h2 className="h4">{presupuesto.nombreTipoEvento} · Propuesta #{presupuesto.id}</h2>
                                    <Badge bg={eventoSolicitud ? "success" : aceptable ? "primary" : "secondary"}>
                                        {eventoSolicitud ? estadosEvento[eventoSolicitud.estado] : !presupuesto.solicitud ? "Antecedente comercial" : contratada ? "Contratada" : presupuesto.solicitud.estado === "RECHAZADA" ? "Solicitud cerrada" : aceptable ? "Propuesta recibida" : "En revisión"}
                                    </Badge>
                                </div>
                                <p className="text-secondary">
                                    Propuesta: {estadoPropuestaCliente(presupuesto)}
                                    {presupuesto.enviadoAt && ` · Versión ${presupuesto.version}`}
                                </p>
                                <PresupuestoResumen presupuesto={presupuesto} />
                                {presupuesto.evento && <Alert variant="success">Evento contratado #{presupuesto.evento.id}. Puedes consultar su estado desde tu solicitud.</Alert>}
                                {contratada && !presupuesto.evento && <p className="text-secondary">Se contrató otra propuesta de esta solicitud. Esta cotización se conserva como antecedente.</p>}
                                <div className="d-flex flex-wrap gap-2">
                                    {presupuesto.solicitudId && <Button as={Link} to={`/cliente/solicitudes/${presupuesto.solicitudId}`} variant="outline-primary">Ver solicitud</Button>}
                                    {aceptable && <Button onClick={() => {
                                        setPropuesta(presupuesto); setAceptacionExpresa(false); setErrorAceptacion(""); setResultadoIncierto(false);
                                    }}>Revisar y aceptar</Button>}
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })
            )}
            <ConfirmModal show={Boolean(propuesta)} onHide={() => !saving && setPropuesta(null)}
                title={`Aceptar propuesta #${propuesta?.id ?? ""}`} confirmText="Aceptar y contratar"
                variant="primary" loading={saving} confirmDisabled={!aceptacionExpresa || resultadoIncierto} onConfirm={confirmarAceptacion}>
                {errorAceptacion && <Alert variant="danger">
                    {errorAceptacion}
                    <Button variant="link" className="d-block p-0 mt-2" disabled={saving} onClick={() => {
                        setPropuesta(null);
                        cargar();
                    }}>Actualizar propuestas</Button>
                </Alert>}
                {propuesta && <PresupuestoResumen presupuesto={propuesta} />}
                <p>Al aceptar se confirmará la contratación y se creará tu evento. No necesitas realizar un anticipo para este paso.</p>
                <Form.Check id="aceptacion-propuesta" checked={aceptacionExpresa} disabled={saving}
                    onChange={(e) => setAceptacionExpresa(e.target.checked)}
                    label="Acepto las condiciones, el lugar, las fechas y el importe de esta propuesta." />
            </ConfirmModal>
        </Container>
    );
}
