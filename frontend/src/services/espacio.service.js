import api from "./api";
const base = "/recursos/espacios";
export const getEspacios = async intervalo => (await api.get(intervalo ? `${base}/disponibilidad` : base, { params: intervalo })).data;
export const saveEspacio = async (id, data) => (await (id ? api.put(`${base}/${id}`, data) : api.post(base, data))).data;
export const getReservas = async id => (await api.get(`${base}/${id}/reservas`)).data;
export const reservarEspacio = async (id, data) => (await api.post(`${base}/${id}/reservas`, data)).data;
export const cancelarReserva = async id => (await api.patch(`${base}/reservas/${id}/cancelar`)).data;
