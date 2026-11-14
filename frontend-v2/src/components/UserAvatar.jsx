const getNombre = (usuario) => {
    if (!usuario) return "?";

    if (usuario.rol === "PRODUCTOR")
        return `${usuario.productor?.nombres ?? ""} ${usuario.productor?.apellidos ?? ""}`;

    if (usuario.rol === "CLIENTE") {
        if (usuario.cliente?.tipo === "PERSONA")
            return `${usuario.cliente.persona?.nombres ?? ""} ${usuario.cliente.persona?.apellidos ?? ""}`;

        return usuario.cliente?.empresa?.razonSocial ?? usuario.email;
    }

    return "Administrador";
};

export default function UserAvatar({
                                       nombre,
                                       size = 32
                                   }) {
    const iniciales = (nombre || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join("");

    return (
        <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold flex-shrink-0"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.38
            }}
        >
            {iniciales || "?"}
        </div>
    );
}

