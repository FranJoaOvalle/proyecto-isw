const unidades = { HORA: "hora", DIA: "día", EVENTO: "evento" };
export default function TarifaArriendo({ form, onChange, equipo = false }) {
    const input = "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3";
    return <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
        {equipo && <label>Origen del equipo<select className={input} value={form.origen ?? "SIN_DEFINIR"} onChange={e => onChange({ ...form, origen: e.target.value, costoArriendo: "", unidadArriendo: "" })}>
            <option value="SIN_DEFINIR">Por definir</option><option value="PROPIO">Propio</option><option value="ARRENDADO">Arrendado</option>
        </select></label>}
        {(!equipo || form.origen === "ARRENDADO") && <>
            <label>Costo de arriendo (CLP){equipo && " por unidad"}<input type="number" min={0} max={999999999999} step={1} className={input} value={form.costoArriendo ?? ""} placeholder="Sin informar" onChange={e => onChange({ ...form, costoArriendo: e.target.value })} /></label>
            <label>Unidad de cobro<select className={input} required={String(form.costoArriendo ?? "").trim() !== ""} value={form.unidadArriendo ?? ""} onChange={e => onChange({ ...form, unidadArriendo: e.target.value })}>
                <option value="">Seleccionar</option>{Object.entries(unidades).map(([v,t]) => <option key={v} value={v}>{t}</option>)}
            </select></label>
        </>}
        <p className="text-sm text-gray-500 sm:col-span-2">{equipo && form.origen === "PROPIO" ? "Equipo propio: no genera arriendo externo. Su uso puede tener otros costos o un precio de venta." : "Costo de referencia para NES, no precio de venta. Deja vacío si aún no se conoce; cero indica arriendo gratuito. Montos en pesos chilenos enteros."}</p>
    </div>;
}
