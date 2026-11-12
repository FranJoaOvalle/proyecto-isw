import api from "./_api";

const extraerLista = (data, clave) => data?.[clave] ?? data?.items ?? data;

export const listarPresupuestos = async () => {
    const response = await api.get("/presupuestos");
    return extraerLista(response.data, "presupuestos");
};

export const obtenerPresupuesto = async (id) => {
    const response = await api.get(`/presupuestos/${id}`);
    return response.data?.presupuesto ?? response.data;
};

export const crearPresupuesto = async (datos) => {
    const response = await api.post("/presupuestos", datos);
    return response.data?.presupuesto ?? response.data;
};

export const actualizarPresupuesto = async (id, datos) => {
    const response = await api.patch(`/presupuestos/${id}`, datos);
    return response.data?.presupuesto ?? response.data;
};

export const cancelarPresupuesto = async (id) => {
    const response = await api.patch(`/presupuestos/${id}/estado`, {
        estado: "CANCELADO"
    });
    return response.data?.presupuesto ?? response.data;
};

export const enviarPresupuesto = async (id, datos) => {
    const response = await api.post(`/presupuestos/${id}/enviar`, datos);
    return response.data;
};

export const previsualizarEnvio = async (id, datos) => {
    const response = await api.post(`/presupuestos/${id}/previsualizar-envio`, datos);
    return response.data;
};

export const aceptarPresupuesto = async (id, version) => {
    try {
        const response = await api.post(`/presupuestos/${id}/aceptar`, { version, aceptar: true }, {
            timeout: 70000
        });
        return response.data;
    } catch (error) {
        if (!error.response) {
            try {
                const presupuesto = await obtenerPresupuesto(id);
                if (presupuesto.estado === "ACEPTADO" && presupuesto.versionAceptada === version && presupuesto.evento?.id) {
                    return { presupuesto, evento: presupuesto.evento };
                }
            } catch {
                // Se conserva el error original si tampoco pudo consultarse la contratación.
            }
        }
        throw error;
    }
};
