const { DIA } = require("./modelo");
const { escenarios } = require("./personas");
const { tokenDemo } = require("./encuestas");

function distribucion(lista, clave = x => x.estado) {
    const totales = {};
    for (const fila of lista) {
        const k = clave(fila);
        totales[k] = (totales[k] ?? 0) + 1;
    }
    return totales;
}
function resumen(s, validacion) {
    const { db, ahora } = s;
    const proximos = db.Evento.filter(e => e.inicio > ahora && ["CONFIRMADO","POSPUESTO"].includes(e.estado));
    const meses = distribucion(db.Evento, e => e.inicio.getFullYear() + "-" + String(e.inicio.getMonth() + 1).padStart(2, "0"));
    const pagos = {};
    for (const p of db.Pago) pagos[p.estado] = (pagos[p.estado] ?? 0) + p.monto;
    return {
        semilla: s.semilla, referencia: ahora.toISOString(), huso: "America/Santiago",
        registros: Object.fromEntries(Object.entries(db).map(([k,v]) => [k,v.length])),
        perfiles: distribucion(db.Usuario, u => u.rol + (u.activo ? " activo" : " inactivo")),
        solicitudes: distribucion(db.SolicitudEvento), presupuestos: distribucion(db.Presupuesto),
        eventos: distribucion(db.Evento), eventosPorMes: Object.fromEntries(Object.entries(meses).sort()),
        proximos: proximos.length, proximos7dias: proximos.filter(e => e.inicio - ahora <= 7 * DIA).length,
        proximos30dias: proximos.filter(e => e.inicio - ahora <= 30 * DIA).length,
        pagos: distribucion(db.Pago), importesCLP: pagos,
        contratadoCLP: db.Presupuesto.filter(p => p.estado === "ACEPTADO").reduce((n,p) => n + p.total, 0),
        contratadoSinCancelacionesCLP: (pagos.PAGADO ?? 0) + (pagos.PENDIENTE ?? 0),
        actividades: distribucion(db.Actividad), encuestas: distribucion(db.Encuesta, x => x.tipo + (x.activo ? " activa" : " inactiva")),
        invitaciones: distribucion(db.InvitacionEncuesta), respuestas: db.Calificacion.length,
        enviadasSinResponder: distribucion(db.InvitacionEncuesta.filter(x => x.estado === "ENVIADA" && !x.respondidoAt), x => x.expiraAt > ahora ? "vigentes" : "expiradas"),
        evaluaciones: db.EvaluacionProductor.length, ranking: distribucion(validacion.ranking, x => x),
        fotografias: validacion.imagenes, cuentasDemo: Object.fromEntries(escenarios), claveDemo: "Prueba123!",
        encuestaDemo: s.web + "/encuesta?token=" + tokenDemo(s.semilla, 1)
    };
}
module.exports = resumen;
