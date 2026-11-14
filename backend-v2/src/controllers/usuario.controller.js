const usuarioService = require("../services/usuario.service");

const obtenerPerfil = async (req, res) => {
    const usuario = await usuarioService.obtenerPerfil(req.usuario.id);
    return res.status(200).json({ usuario });
};

const actualizarPerfil = async (req, res) => {
    const usuario = await usuarioService.actualizarPerfil(
        req.usuario.id,
        req.validated.body
    );

    return res.status(200).json({
        message: "Perfil actualizado correctamente.",
        usuario
    });
};

const cambiarPassword = async (req, res) => {
    const { passwordActual, passwordNueva } = req.validated.body;

    await usuarioService.cambiarPassword(
        req.usuario.id,
        passwordActual,
        passwordNueva
    );

    return res.status(200).json({
        message: "Contraseña actualizada correctamente."
    });
};

const desactivarCuenta = async (req, res) => {
    await usuarioService.desactivarCuenta(req.usuario.id);

    return res.status(200).json({
        message: "Cuenta desactivada correctamente."
    });
};

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    desactivarCuenta
};