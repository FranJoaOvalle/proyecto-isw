export const ESTADOS_RANKING = {
    CLASIFICADO: {
        label: "Clasificado",
        variant: "success"
    },
    PROVISIONAL: {
        label: "Provisional",
        variant: "warning"
    },
    SIN_DATOS: {
        label: "Sin datos suficientes",
        variant: "secondary"
    }
};

export const formatearPuntuacion = (valor) =>
    valor == null ? "—" : valor.toFixed(2);

export const construirPeriodo = (desde, hasta) => {
    const periodo = {};

    if (desde) {
        periodo.desde = new Date(`${desde}T00:00:00`).toISOString();
    }

    if (hasta) {
        const fecha = new Date(`${hasta}T00:00:00`);
        fecha.setDate(fecha.getDate() + 1);
        periodo.hasta = fecha.toISOString();
    }

    return periodo;
};