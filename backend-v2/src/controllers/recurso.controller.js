const service = require("../services/recurso.service");

module.exports = {
    listar: async (req, res, next) => {
        try {
            res.json(await service.listarActivos());
        } catch (error) {
            next(error);
        }
    }
};
