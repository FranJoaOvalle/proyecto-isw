import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

import {
    getPersonal,
    createPersonal,
    updatePersonal,
    deactivatePersonal,
    reactivatePersonal,
    createPersonalUsuario,
    getAutorizacionesPersonal,
    asignarAutorizacionPersonal,
    quitarAutorizacionPersonal
} from "../services/personal.service";
import {getGestores} from "../services/usuario.service";
import {useAuth} from "../context/AuthContext";
import AutorizacionSelector from "../components/AutorizacionSelector.jsx";

const emptyForm = {
    nombre: "",
    email: "",
    telefono: "",
    tipo: "",
    especialidad: "",
    notas: ""
};

function PersonalModal({
                            title,
                            form,
                            onChange,
                            onClose,
                            onSubmit,
                            saving,
                            disabled = false,
                            footer,
                            extra
                        }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {title}
                        </h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        {[
                            ["nombre", "Nombre"],
                            ["email", "Correo"],
                            ["telefono", "Teléfono"],
                            ["tipo", "Tipo de personal"],
                            ["especialidad", "Especialidad"]
                        ].map(([name, placeholder]) => (
                            <input
                                key={name}
                                name={name}
                                value={form[name]}
                                onChange={onChange}
                                placeholder={placeholder}
                                required={name === "nombre"}
                                disabled={disabled}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                            />
                        ))}

                        <textarea
                            name="notas"
                            value={form.notas}
                            onChange={onChange}
                            placeholder="Notas"
                            rows="3"
                            disabled={disabled}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                        />

                        {extra}

                        <div className="flex items-center justify-between pt-2">
                            <div>{footer}</div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg border border-gray-300 px-4 py-2"
                                >
                                    Cancelar
                                </button>

                                {!disabled && (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                                    >
                                        {saving ? "Guardando..." : "Guardar"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function Personal() {
    const {usuario} = useAuth();

    const [personal, setPersonal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [incluirInactivos, setIncluirInactivos] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedPersonal, setSelectedPersonal] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [editForm, setEditForm] = useState(emptyForm);

    const [showUsuarioForm, setShowUsuarioForm] = useState(false);

    const [gestores, setGestores] = useState([]);
    const [autorizaciones, setAutorizaciones] = useState([]);
    const [gestorSeleccionado, setGestorSeleccionado] = useState("");
    const [loadingAutorizaciones, setLoadingAutorizaciones] = useState(false);

    const [usuarioForm, setUsuarioForm] = useState({
        email: "",
        password: "",
        rol: "PRODUCCION"
    });

    const loadPersonal = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getPersonal(incluirInactivos);
            setPersonal(data);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar el personal."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadAutorizaciones = async personalId => {
        if (usuario?.rol !== "ADMIN")
            return;

        try {
            setLoadingAutorizaciones(true);

            const [gestoresData, autorizacionesData] = await Promise.all([
                getGestores(),
                getAutorizacionesPersonal(personalId)
            ]);

            setGestores(gestoresData);
            setAutorizaciones(autorizacionesData);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible cargar las autorizaciones."
            );
        } finally {
            setLoadingAutorizaciones(false);
        }
    };

    useEffect(() => {
        loadPersonal();
    }, [incluirInactivos]);

    const handleChange = e => {
        const {name, value} = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditChange = e => {
        const {name, value} = e.target;

        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreate = async e => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await createPersonal({
                nombre: form.nombre,
                email: form.email || null,
                telefono: form.telefono || null,
                tipo: form.tipo || null,
                especialidad: form.especialidad || null,
                notas: form.notas || null
            });

            setForm(emptyForm);
            setShowForm(false);

            await loadPersonal();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible registrar el personal."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleManage = item => {
        setSelectedPersonal(item);

        setEditForm({
            nombre: item.nombre ?? "",
            email: item.email ?? "",
            telefono: item.telefono ?? "",
            tipo: item.tipo ?? "",
            especialidad: item.especialidad ?? "",
            notas: item.notas ?? ""
        });

        if (usuario?.rol === "ADMIN")
            loadAutorizaciones(item.id);
    };

    const handleUpdate = async e => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await updatePersonal(selectedPersonal.id, {
                nombre: editForm.nombre,
                email: editForm.email || null,
                telefono: editForm.telefono || null,
                tipo: editForm.tipo || null,
                especialidad: editForm.especialidad || null,
                notas: editForm.notas || null
            });

            setSelectedPersonal(null);
            await loadPersonal();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible modificar el personal."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm("¿Deseas desactivar este registro de personal?"))
            return;

        try {
            setError("");
            await deactivatePersonal(selectedPersonal.id);

            setSelectedPersonal(null);
            await loadPersonal();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible desactivar el personal."
            );
        }
    };

    const handleReactivate = async () => {
        try {
            setError("");
            await reactivatePersonal(selectedPersonal.id);

            setSelectedPersonal(null);
            await loadPersonal();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible reactivar el personal."
            );
        }
    };

    const handleUsuarioChange = e => {
        const {name, value} = e.target;

        setUsuarioForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateUsuario = async e => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await createPersonalUsuario(
                selectedPersonal.id,
                usuarioForm
            );

            setUsuarioForm({
                email: "",
                password: "",
                rol: "PRODUCCION"
            });

            setShowUsuarioForm(false);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible crear la cuenta del personal."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleAsignarAutorizacion = async () => {
        if (!gestorSeleccionado)
            return;

        try {
            setError("");

            await asignarAutorizacionPersonal(
                selectedPersonal.id,
                Number(gestorSeleccionado)
            );

            setGestorSeleccionado("");
            await loadAutorizaciones(selectedPersonal.id);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible asignar la autorización."
            );
        }
    };

    const handleQuitarAutorizacion = async usuarioId => {
        try {
            setError("");

            await quitarAutorizacionPersonal(
                selectedPersonal.id,
                usuarioId
            );

            await loadAutorizaciones(selectedPersonal.id);
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible quitar la autorización."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <Link
                    to="/dashboard"
                    className="text-xl font-bold text-blue-600"
                >
                    NES Eventos
                </Link>

                <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600"
                >
                    Volver al dashboard
                </Link>
            </nav>

            <main className="p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Personal
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Gestiona el personal asociado a NES Eventos.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                        Nuevo personal
                    </button>
                </div>

                {usuario?.rol === "ADMIN" && (
                    <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={incluirInactivos}
                            onChange={e => setIncluirInactivos(e.target.checked)}
                        />

                        Mostrar personal inactivo
                    </label>
                )}

                {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="mt-8 text-gray-500">
                        Cargando personal...
                    </p>
                ) : (
                    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-sm text-gray-600">
                            <tr>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Especialidad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                            {personal.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.nombre}
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">
                                        {item.tipo ?? "—"}
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">
                                        {item.especialidad ?? "—"}
                                    </td>

                                    <td className="px-6 py-4">
                                        {item.activo ? "Activo" : "Inactivo"}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleManage(item)}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {personal.length === 0 && (
                            <p className="p-8 text-center text-gray-500">
                                No hay personal registrado.
                            </p>
                        )}
                    </div>
                )}
            </main>

            {showForm && (
                <PersonalModal
                    title="Nuevo personal"
                    form={form}
                    onChange={handleChange}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleCreate}
                    saving={saving}
                />
            )}

            {selectedPersonal && (
                <PersonalModal
                    title="Gestionar personal"
                    form={editForm}
                    onChange={handleEditChange}
                    onClose={() => setSelectedPersonal(null)}
                    onSubmit={handleUpdate}
                    saving={saving}
                    disabled={!selectedPersonal.activo}

                    extra={
                        <>
                            {usuario?.rol === "ADMIN" && selectedPersonal.activo && (
                                <div className="border-t border-gray-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowUsuarioForm(true)}
                                        className="text-sm font-semibold text-blue-600 hover:underline"
                                    >
                                        Crear cuenta de acceso
                                    </button>
                                </div>
                            )}

                            {usuario?.rol === "ADMIN" && (
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-900">
                                        Autorizaciones
                                    </h3>

                                    {loadingAutorizaciones ? (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Cargando autorizaciones...
                                        </p>
                                    ) : (
                                        <>
                                            <AutorizacionSelector
                                                gestores={gestores}
                                                autorizaciones={autorizaciones}
                                                gestorSeleccionado={gestorSeleccionado}
                                                setGestorSeleccionado={setGestorSeleccionado}
                                                onAsignar={handleAsignarAutorizacion}
                                            />

                                            <div className="mt-4 space-y-2">
                                                {autorizaciones.map(autorizacion => (
                                                    <div
                                                        key={autorizacion.usuarioId}
                                                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {autorizacion.usuario.email}
                                                            </p>

                                                            <p className="text-xs text-gray-500">
                                                                {autorizacion.usuario.rol}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuitarAutorizacion(
                                                                    autorizacion.usuarioId
                                                                )
                                                            }
                                                            className="text-sm font-medium text-red-600 hover:underline"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                ))}

                                                {autorizaciones.length === 0 && (
                                                    <p className="text-sm text-gray-500">
                                                        Ningún gestor tiene autorización para este registro.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    }

                    footer={
                        selectedPersonal.activo ? (
                            <button
                                type="button"
                                onClick={handleDeactivate}
                                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                            >
                                Desactivar
                            </button>
                        ) : (
                            usuario?.rol === "ADMIN" && (
                                <button
                                    type="button"
                                    onClick={handleReactivate}
                                    className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                                >
                                    Reactivar
                                </button>
                            )
                        )
                    }
                />
            )}

            {showUsuarioForm && selectedPersonal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Crear cuenta
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowUsuarioForm(false)}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                            Crear cuenta para {selectedPersonal.nombre}.
                        </p>

                        <form
                            onSubmit={handleCreateUsuario}
                            className="mt-6 space-y-4"
                        >
                            <input
                                name="email"
                                type="email"
                                value={usuarioForm.email}
                                onChange={handleUsuarioChange}
                                placeholder="Correo de acceso"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3"
                            />

                            <input
                                name="password"
                                type="password"
                                value={usuarioForm.password}
                                onChange={handleUsuarioChange}
                                placeholder="Contraseña"
                                minLength={8}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3"
                            />

                            <select
                                name="rol"
                                value={usuarioForm.rol}
                                onChange={handleUsuarioChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3"
                            >
                                <option value="PRODUCCION">Producción</option>
                                <option value="COMERCIAL">Comercial</option>
                                <option value="ADMIN">Administrador</option>
                            </select>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUsuarioForm(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                                >
                                    {saving ? "Creando..." : "Crear cuenta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}