const authService = require("../services/auth.service");
const emailService = require("../services/email.service");

const registrar = async (req, res) => {
    const usuario = await authService.registrarCliente(req.validated.body);

    return res.status(201).json({
        message: "Cuenta creada correctamente.",
        usuario
    });
};

const login = async (req, res) => {
    const resultado = await authService.login(req.validated.body);
    return res.status(200).json(resultado);
};

const forgotPassword = async (req, res) => {
    const { email } = req.validated.body;

    const token = await authService.solicitarRecuperacionPassword(email);
    if (token) await emailService.sendPasswordResetEmail(email, token);

    return res.status(200).json({
        message:
            "Si existe una cuenta asociada al correo, recibirás instrucciones para restablecer tu contraseña."
    });
};

const resetPassword = async (req, res) => {
    const { token, password } = req.validated.body;

    await authService.restablecerPassword(token, password);

    return res.status(200).json({
        message: "La contraseña fue restablecida correctamente."
    });
};

module.exports = {
    registrar,
    login,
    forgotPassword,
    resetPassword
};