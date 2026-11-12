import { Col, Row, Table } from "react-bootstrap";
import { direccionConComuna, fechaSeguimiento } from "../eventos/seguimiento.utils";
import { monedaPresupuesto } from "./presupuesto.utils";

export default function PresupuestoResumen({ presupuesto }) {
    const totalEstimado = presupuesto.estado === "BORRADOR" && presupuesto.subtotalArriendoEspacio == null;
    return (
        <>
            <Row className="g-3 mb-3">
                <Col sm={6}>
                    <small className="d-block text-body-secondary">Inicio</small>
                    <span>{fechaSeguimiento(presupuesto.inicio)}</span>
                </Col>
                <Col sm={6}>
                    <small className="d-block text-body-secondary">Término</small>
                    <span>{fechaSeguimiento(presupuesto.fin)}</span>
                </Col>
                <Col sm={6}>
                    <small className="d-block text-body-secondary">Recinto</small>
                    <span>{presupuesto.lugar}</span>
                    {presupuesto.direccion && <small className="d-block text-body-secondary">{direccionConComuna(presupuesto.direccion, presupuesto.comuna)}</small>}
                    {presupuesto.referenciaDireccion && <small className="d-block text-body-secondary">{presupuesto.referenciaDireccion}</small>}
                </Col>
                <Col sm={6}>
                    <small className="d-block text-body-secondary">Asistentes</small>
                    <span>{presupuesto.asistentes} personas</span>
                </Col>
                {presupuesto.venceAt && <Col sm={6}>
                    <small className="d-block text-body-secondary">Vigencia de la propuesta</small>
                    <span>{fechaSeguimiento(presupuesto.venceAt)}</span>
                </Col>}
            </Row>
            <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                    <thead>
                        <tr><th>Concepto</th><th className="text-end">Cantidad</th><th className="text-end">Importe</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{presupuesto.nombreTipoEvento}</td><td className="text-end">1</td>
                            <td className="text-end">{monedaPresupuesto(presupuesto.precioBaseTipoEvento)}</td>
                        </tr>
                        {(presupuesto.recursos ?? []).map((recurso) => (
                            <tr key={recurso.recursoId}>
                                <td>{recurso.nombreRecurso}</td><td className="text-end">{recurso.cantidad}</td>
                                <td className="text-end">{monedaPresupuesto(recurso.subtotal)}</td>
                            </tr>
                        ))}
                        {presupuesto.subtotalArriendoEspacio != null && <tr>
                            <td colSpan={2}>{presupuesto.arriendoIncluido ? "Arriendo incluido en el precio base" : "Arriendo del recinto"}</td>
                            <td className="text-end">{monedaPresupuesto(presupuesto.subtotalArriendoEspacio)}</td>
                        </tr>}
                        <tr className="text-body-secondary"><td colSpan={2}>Subtotal</td><td className="text-end">{monedaPresupuesto(presupuesto.subtotal)}</td></tr>
                        <tr className="text-body-secondary"><td colSpan={2}>Descuento</td><td className="text-end">−{monedaPresupuesto(presupuesto.descuento)}</td></tr>
                        <tr className="text-body-secondary"><td colSpan={2}>Recargo</td><td className="text-end">{monedaPresupuesto(presupuesto.recargoCliente)}</td></tr>
                        <tr className="fw-bold border-top">
                            <td colSpan={2}>{totalEstimado ? "Total estimado sin arriendo" : "Total"}</td>
                            <td className="text-end">{monedaPresupuesto(presupuesto.total)}</td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        </>
    );
}
