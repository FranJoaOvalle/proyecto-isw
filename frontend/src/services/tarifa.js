const unidades = { HORA: "hora", DIA: "día", EVENTO: "evento" };
export function textoTarifa(item) {
    if (item.origen === "PROPIO") return "Propio · sin costo de arriendo";
    if (item.origen === "SIN_DEFINIR") return "Origen por definir";
    if (item.costoArriendo == null) return "Costo sin informar";
    return `${Number(item.costoArriendo).toLocaleString("es-CL")} CLP / ${unidades[item.unidadArriendo] ?? item.unidadArriendo}${item.origen ? " por unidad" : ""}`;
}
export function datosTarifa(form) {
    const aplica = !form.origen || form.origen === "ARRENDADO";
    const valor = String(form.costoArriendo ?? "").trim();
    return {
        costoArriendo: aplica && valor !== "" ? Number(valor) : null,
        unidadArriendo: aplica && valor !== "" ? form.unidadArriendo || null : null
    };
}
