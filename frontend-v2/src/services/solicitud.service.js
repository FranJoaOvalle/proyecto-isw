import api from "./_api";
export const listarSolicitudes = async params => (await api.get("/solicitudes", { params })).data;
export const obtenerSolicitud = async id => (await api.get(`/solicitudes/${id}`)).data;
export const historialSolicitud = async id => (await api.get(`/solicitudes/${id}/historial`)).data;
export const crearSolicitud = async datos => (await api.post("/solicitudes", datos)).data;
export const editarSolicitud = async (id, datos) => (await api.patch(`/solicitudes/${id}`, datos)).data;
export const revisarSolicitud = async id => (await api.post(`/solicitudes/${id}/revision`)).data;
export const cerrarSolicitud = async (id, motivo, retiro) => (await api.post(`/solicitudes/${id}/${retiro ? "retiro" : "rechazo"}`, { motivo })).data;
