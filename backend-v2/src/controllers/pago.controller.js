const service = require("../services/pago.service");

const listar = async (req, res, next) => {
    try {
        const pagos = await service.listar();
        return res.status(200).json(pagos);
    } catch (error) {
        return next(error);
    }
};

module.exports = { listar };
