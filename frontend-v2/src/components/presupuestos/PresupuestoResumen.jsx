import { Table } from "react-bootstrap";
import { fechaSeguimiento } from "../eventos/seguimiento.utils";
import { monedaPresupuesto } from "./presupuesto.utils";

export default function PresupuestoResumen({ presupuesto }) {
    return (
        <>
            <p className="mb-1">{fechaSeguimiento(presupuesto.inicio)} — {fechaSeguimiento(presupuesto.fin)}</p>
            <p className="mb-1">{presupuesto.lugar} · {presupuesto.asistentes} asistentes</p>
            {presupuesto.direccion && (
                <p className="text-secondary mb-1">{presupuesto.direccion}, {presupuesto.comuna}</p>
            )}
            {presupuesto.referenciaDireccion && <p className="text-secondary">{presupuesto.referenciaDireccion}</p>}
            {presupuesto.venceAt && <p>Válida hasta: {fechaSeguimiento(presupuesto.venceAt)}</p>}
            <div className="table-responsive">
                <Table size="sm" className="align-middle">
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
                        <tr><td colSpan={2}>Subtotal</td><td className="text-end">{monedaPresupuesto(presupuesto.subtotal)}</td></tr>
                        <tr><td colSpan={2}>Descuento</td><td className="text-end">−{monedaPresupuesto(presupuesto.descuento)}</td></tr>
                        <tr><td colSpan={2}>Recargo</td><td className="text-end">{monedaPresupuesto(presupuesto.recargoCliente)}</td></tr>
                        <tr className="fw-semibold"><td colSpan={2}>Total</td><td className="text-end">{monedaPresupuesto(presupuesto.total)}</td></tr>
                    </tbody>
                </Table>
            </div>
        </>
    );
}
