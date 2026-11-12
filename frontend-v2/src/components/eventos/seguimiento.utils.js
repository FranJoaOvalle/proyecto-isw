export const tiposSeguimiento = {
    NOVEDAD: "Novedad",
    INCIDENCIA: "Incidencia",
    OBSERVACION: "Observación",
    MODIFICACION: "Modificación",
    HITO: "Hito"
};
export const importanciasSeguimiento = {
    BAJA: "Baja",
    MEDIA: "Media",
    ALTA: "Alta"
};
export const estadosEvento = {
    CONFIRMADO: "Confirmado",
    POSPUESTO: "Pospuesto",
    EN_CURSO: "En curso",
    COMPLETADO: "Completado",
    CANCELADO: "Cancelado"
};
export const varianteEstado = {
    CONFIRMADO: "primary",
    POSPUESTO: "warning",
    EN_CURSO: "info",
    COMPLETADO: "success",
    CANCELADO: "danger"
};
export const nombreAutor = (usuario) =>
    usuario?.productor
        ? `${usuario.productor.nombres} ${usuario.productor.apellidos}`
        : usuario?.email;
export const fechaSeguimiento = (fecha) =>
    new Date(fecha).toLocaleString("es-CL");
export const direccionConComuna = (direccion, comuna) => {
    if (!direccion || !comuna) return direccion || comuna || "";
    const repetida = direccion.split(",").some((parte) =>
        parte.trim().toLocaleLowerCase("es-CL") === comuna.trim().toLocaleLowerCase("es-CL")
    );
    return repetida ? direccion : `${direccion}, ${comuna}`;
};
export const mensajeError = (error, fallback) =>
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    fallback;

// La fecha final del filtro incluye el día completo en la zona local del navegador.
export function parametrosSeguimiento(filtros) {
    const params = Object.fromEntries(
        Object.entries(filtros).filter(([, value]) => value !== "")
    );
    if (params.desde)
        params.desde = new Date(`${params.desde}T00:00:00`).toISOString();
    if (params.hasta) {
        const fin = new Date(`${params.hasta}T00:00:00`);
        fin.setDate(fin.getDate() + 1);
        params.hasta = fin.toISOString();
    }
    return params;
}
