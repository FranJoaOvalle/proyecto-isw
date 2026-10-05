import api from "./_api";

const extraerLista = (data) =>
    data.tiposEvento ??
    data.data ??
    data;

export const getTiposEvento = async (
    incluirInactivos = false
) => {
    const response = await api.get("/tipos-evento", {
        params: {
            incluirInactivos
        }
    });

    return extraerLista(response.data);
};

export const createTipoEvento = async (data) => {
    const response = await api.post(
        "/tipos-evento",
        data
    );

    return response.data;
};

export const updateTipoEvento = async (
    id,
    data
) => {
    const response = await api.patch(
        `/tipos-evento/${id}`,
        data
    );

    return response.data;
};

export const updateTipoEventoEstado = async (
    id,
    activo
) => {
    const response = await api.patch(
        `/tipos-evento/${id}/estado`,
        { activo }
    );

    return response.data;
};