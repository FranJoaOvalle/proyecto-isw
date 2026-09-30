import api from './api';
export const crearPresupuesto = async datos => (await api.post('/presupuestos', datos)).data;
export const obtenerPresupuestos = async () => (await api.get('/presupuestos')).data;
export const actualizarPresupuesto = async (id, datos) => (await api.put(`/presupuestos/${id}`, datos)).data;
export const cambiarEstadoPresupuesto = async (id, estado) => (await api.patch(`/presupuestos/${id}/estado`, { estado })).data;
export const archivarPresupuesto = async id => (await api.delete(`/presupuestos/${id}`)).data;
