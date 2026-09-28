export default function AutorizacionSelector({
                                                 gestores,
                                                 autorizaciones,
                                                 gestorSeleccionado,
                                                 setGestorSeleccionado,
                                                 onAsignar
                                             }) {
    return (
        <div className="mt-3 flex gap-2">
            <select
                value={gestorSeleccionado}
                onChange={e => setGestorSeleccionado(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            >
                <option value="">
                    Seleccionar gestor
                </option>

                {gestores
                    .filter(gestor =>
                        !autorizaciones.some(
                            autorizacion =>
                                autorizacion.usuarioId === gestor.id
                        )
                    )
                    .map(gestor => (
                        <option
                            key={gestor.id}
                            value={gestor.id}
                        >
                            {gestor.personal?.nombre ?? gestor.email}
                            {" — "}
                            {gestor.rol}
                        </option>
                    ))}
            </select>

            <button
                type="button"
                onClick={onAsignar}
                disabled={!gestorSeleccionado}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
                Asignar
            </button>
        </div>
    );
}