const authService = require("../services/auth.service");

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

module.exports = {
    registrar,
    login
};