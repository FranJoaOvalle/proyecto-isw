const usuarioService = require("../services/usuario.service");

const getGestores = async (req, res, next) => {
    try {
        const usuarios = await usuarioService.getGestores();
        return res.status(200).json(usuarios);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGestores
};