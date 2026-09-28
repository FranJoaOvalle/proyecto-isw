import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEspacios, saveEspacio, getReservas, reservarEspacio, cancelarReserva } from "../services/espacio.service";

const inicial = { nombre: "", direccion: "", capacidad: "", habilitado: true, observaciones: "" };
const input = "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const boton = "rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50";
const fecha = valor => new Date(valor).toLocaleString();
const intervaloISO = ({ inicio, fin }) => {
    if (!inicio || !fin || new Date(fin) <= new Date(inicio)) throw new Error("Indica un inicio y un fin posterior.");
    return { inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString() };
};

export default function Espacios() {
    const [espacios, setEspacios] = useState([]);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(null);
    const [seleccionado, setSeleccionado] = useState(null);
    const [reservas, setReservas] = useState([]);
    const [horario, setHorario] = useState({ inicio: "", fin: "" });
    const [consulta, setConsulta] = useState(null);
    const [reserva, setReserva] = useState({ referencia: "", inicio: "", fin: "" });
    useEffect(() => {
        let activo = true;
        getEspacios().then(data => { if (activo) setEspacios(data); })
            .catch(() => { if (activo) setError("No se pudieron cargar los espacios."); })
            .finally(() => { if (activo) setLoading(false); });
        return () => { activo = false; };
    }, []);

    const ejecutar = async accion => {
        if (busy) return;
        setBusy(true); setError(""); setMensaje("");
        try { await accion(); } catch (e) { setError(e.response?.data?.error?.message || e.message || "No se pudo completar la operación."); }
        finally { setBusy(false); }
    };
    const cargar = async () => setEspacios(await getEspacios(consulta));
    const guardar = event => {
        event.preventDefault();
        ejecutar(async () => {
            await saveEspacio(form.id, { nombre: form.nombre.trim(), direccion: form.direccion.trim(), capacidad: Number(form.capacidad), habilitado: form.habilitado, observaciones: form.observaciones.trim() || null });
            setForm(null); setMensaje("Espacio guardado."); await cargar();
        });
    };

    return <div className="min-h-screen bg-gray-50">
        <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4"><Link className="text-xl font-bold text-blue-600" to="/dashboard">NES Eventos</Link><Link className="text-sm font-medium text-gray-600 transition hover:text-blue-600" to="/dashboard">Volver al dashboard</Link></nav>
        <main className="p-4 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900">Recursos · Espacios</h1>
            <div className="my-8 flex gap-8 border-b border-gray-200"><Link to="/recursos" className="pb-4 text-sm font-semibold text-gray-500 transition hover:text-gray-900">Equipos</Link><span className="border-b-2 border-blue-600 pb-4 text-sm font-semibold text-blue-600">Espacios</span></div>
            <p className="text-gray-600">Consulta disponibilidad para un horario concreto. Las horas se muestran en la zona local de tu navegador.</p>
            <p className="mt-1 text-sm text-gray-500">Las reservas usan una referencia del evento; todavía no están vinculadas al módulo de eventos.</p>
            {error && <p role="alert" className="my-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
            {mensaje && <p role="status" className="my-4 rounded bg-green-50 p-3 text-green-800">{mensaje}</p>}
            <button disabled={busy || !!form} className={`${boton} mt-5`} onClick={() => setForm({ ...inicial })}>+ Agregar espacio</button>
            {form && <form onSubmit={guardar} className="my-5 rounded-xl border bg-white p-5">
                <h2 className="text-xl font-semibold">{form.id ? "Editar espacio" : "Nuevo espacio"}</h2>
                <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
                    <label>Nombre del espacio<input required minLength={2} maxLength={100} className={input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></label>
                    <label>Dirección<input required minLength={2} maxLength={250} className={input} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></label>
                    <label>Capacidad<input required type="number" min={1} max={2147483647} step={1} className={input} value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} /></label>
                    <label className="self-center"><input type="checkbox" checked={form.habilitado} onChange={e => setForm({ ...form, habilitado: e.target.checked })} /> Habilitado para nuevas reservas</label>
                    <label className="sm:col-span-2">Observaciones<textarea maxLength={2000} className={input} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></label>
                    <p className="text-sm text-gray-500 sm:col-span-2">Deshabilitar impide nuevas reservas; las existentes se conservan y deben revisarse.</p>
                    <div className="flex gap-3"><button className={boton}>Guardar espacio</button><button type="button" onClick={() => setForm(null)}>Cancelar</button></div>
                </fieldset>
            </form>}
            <form className="my-5 flex flex-wrap items-end gap-4 rounded-xl border bg-white p-5" onSubmit={e => { e.preventDefault(); ejecutar(async () => { const rango = intervaloISO(horario); const data = await getEspacios(rango); setConsulta(rango); setEspacios(data); }); }}>
                <label>Inicio de consulta<input required type="datetime-local" className={input} value={horario.inicio} onChange={e => setHorario({ ...horario, inicio: e.target.value })} /></label>
                <label>Fin de consulta<input required type="datetime-local" className={input} value={horario.fin} onChange={e => setHorario({ ...horario, fin: e.target.value })} /></label>
                <button className={boton} disabled={busy}>Consultar disponibilidad</button>
                <button type="button" disabled={busy} onClick={() => ejecutar(async () => { setEspacios(await getEspacios()); setConsulta(null); })}>Ver todos</button>
            </form>
            {consulta && <p className="mb-3 text-sm">Disponibilidad consultada: {fecha(consulta.inicio)} — {fecha(consulta.fin)}</p>}
            {loading ? <p role="status">Cargando espacios...</p> : <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm">
                <thead className="bg-gray-50"><tr>{["Espacio", "Capacidad", "Estado", "Horario consultado", "Reserva actual o próxima", "Acciones"].map(t => <th className="p-3" key={t}>{t}</th>)}</tr></thead>
                <tbody>{espacios.map(espacio => <tr key={espacio.id} className="border-t border-gray-200 transition hover:bg-gray-50">
                    <td className="p-3"><strong>{espacio.nombre}</strong><p>{espacio.direccion}</p><p className="text-gray-500">{espacio.observaciones}</p></td><td className="p-3">{espacio.capacidad} personas</td>
                    <td className="p-3">{espacio.habilitado ? "Habilitado" : "Deshabilitado"}</td>
                    <td className="p-3">{!consulta ? "Selecciona fechas" : !espacio.habilitado ? "No habilitado" : espacio.disponible ? "Disponible" : "Reservado"}</td>
                    <td className="p-3">{espacio.proximaReserva ? `${fecha(espacio.proximaReserva.inicio)} — ${fecha(espacio.proximaReserva.fin)}` : "Sin reservas próximas"}</td>
                    <td className="p-3"><button className="mr-3 text-blue-600" disabled={busy || !!form} onClick={() => setForm({ ...espacio, capacidad: String(espacio.capacidad), observaciones: espacio.observaciones || "" })}>Editar</button><button className="text-blue-600" disabled={busy} onClick={() => ejecutar(async () => { const data = await getReservas(espacio.id); setReservas(data); setSeleccionado(espacio); setReserva({ referencia: "", inicio: "", fin: "" }); })}>Reservas</button></td>
                </tr>)}{espacios.length === 0 && <tr><td className="p-6 text-center" colSpan={6}>No hay espacios registrados.</td></tr>}</tbody>
            </table></div>}
            {seleccionado && <section className="mt-5 rounded-xl border bg-white p-5">
                <div className="flex justify-between"><h2 className="text-xl font-semibold">Reservas de {seleccionado.nombre}</h2><button disabled={busy} onClick={() => setSeleccionado(null)}>Cerrar</button></div>
                <form onSubmit={e => { e.preventDefault(); ejecutar(async () => { await reservarEspacio(seleccionado.id, { referencia: reserva.referencia.trim(), ...intervaloISO(reserva) }); setReserva({ referencia: "", inicio: "", fin: "" }); setReservas(await getReservas(seleccionado.id)); await cargar(); setMensaje("Reserva registrada."); }); }}>
                    <fieldset disabled={busy} className="my-4 grid gap-3 sm:grid-cols-3">
                        <label>Referencia del evento<input required minLength={2} maxLength={150} className={input} value={reserva.referencia} onChange={e => setReserva({ ...reserva, referencia: e.target.value })} /></label>
                        <label>Inicio de reserva<input required type="datetime-local" className={input} value={reserva.inicio} onChange={e => setReserva({ ...reserva, inicio: e.target.value })} /></label>
                        <label>Fin de reserva<input required type="datetime-local" className={input} value={reserva.fin} onChange={e => setReserva({ ...reserva, fin: e.target.value })} /></label>
                        <button className={boton}>Reservar espacio</button>
                    </fieldset>
                </form>
                <p className="text-sm text-gray-500">Se permiten horarios consecutivos: una reserva puede comenzar cuando termina otra.</p>
                <ul className="mt-3 divide-y">{reservas.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-3 py-3"><span>{r.referencia} · {fecha(r.inicio)} — {fecha(r.fin)} · {r.cancelada ? "Cancelada" : "Confirmada"}</span>{!r.cancelada && <button disabled={busy} className="text-red-700" onClick={() => { if (window.confirm("¿Cancelar esta reserva? Se conservará su historial.")) ejecutar(async () => { await cancelarReserva(r.id); setReservas(await getReservas(seleccionado.id)); await cargar(); setMensaje("Reserva cancelada."); }); }}>Cancelar reserva</button>}</li>)}</ul>
                {reservas.length === 0 && <p>No hay reservas para este espacio.</p>}
            </section>}
        </main>
    </div>;
}
