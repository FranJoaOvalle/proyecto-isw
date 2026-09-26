const authService = require("../services/auth.service");

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const me = (req, res) => {
    return res.status(200).json({
        usuario: req.usuario
    });
};

module.exports = { login, me };