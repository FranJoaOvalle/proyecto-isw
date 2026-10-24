export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const TIPOS_ACTIVIDAD = [
    { value: "TAREA", label: "Tarea" },
    { value: "REUNION", label: "Reunión" },
    { value: "VISITA_RECINTO", label: "Visita a recinto" }
];

export const obtenerFechaLocal = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};

export const convertirAFechaHoraLocal = (fecha) => {
    if (!fecha) return "";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return "";

    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    const horas = String(valor.getHours()).padStart(2, "0");
    const minutos = String(valor.getMinutes()).padStart(2, "0");

    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
};

export const obtenerNombre = (registro) => {
    if (registro.tipoRegistro === "ACTIVIDAD") {
        return registro.titulo || "Actividad";
    }

    return registro.tipoEvento?.nombre || "Evento";
};

export const obtenerProductoresAsignados = (registro) => {
    if (!Array.isArray(registro.productores)) {
        return [];
    }

    return registro.productores.map((asignacion) => {
        const productor = asignacion.productor;

        return {
            id: asignacion.productorId,
            nombre: productor
                ? `${productor.nombres} ${productor.apellidos}`.trim()
                : "Productor sin nombre",
            esResponsable: asignacion.esResponsable
        };
    });
};

export const formatearFecha = (fecha) => {
    if (!fecha) return "Sin definir";

    return new Date(fecha).toLocaleString("es-CL", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

export const formatearDia = (fecha) =>
    new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

export const obtenerVarianteEstado = (estado) => {
    const variantes = {
        PENDIENTE: "warning",
        COMPLETADA: "success",
        CANCELADA: "danger",
        ORGANIZACION: "info",
        CONFIRMADO: "success",
        POSPUESTO: "warning",
        EN_CURSO: "primary",
        COMPLETADO: "success",
        CANCELADO: "danger",
        FINALIZADO: "success"
    };

    return variantes[estado] || "secondary";
};

export const formatearEstado = (estado) => {
    if (!estado) return "";

    const texto = estado.replaceAll("_", " ").toLowerCase();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const obtenerRegistrosDelDia = (registros, fecha) => {
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(inicioDia);
    finDia.setDate(finDia.getDate() + 1);

    return registros.filter((registro) => {
        const inicioRegistro = new Date(registro.inicio);

        if (Number.isNaN(inicioRegistro.getTime())) {
            return false;
        }

        const finRegistro = registro.fin
            ? new Date(registro.fin)
            : inicioRegistro;

        return inicioRegistro < finDia && finRegistro >= inicioDia;
    });
};

