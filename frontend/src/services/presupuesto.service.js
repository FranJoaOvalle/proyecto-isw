import api from './api';

const API_URL = '/presupuestos';

export const crearPresupuesto = async (datos) => {
    const response = await api.post(API_URL, datos);
    return response.data;
};

export const obtenerPresupuestos = async () => {
    const response = await api.get(API_URL);
    return response.data;
};
