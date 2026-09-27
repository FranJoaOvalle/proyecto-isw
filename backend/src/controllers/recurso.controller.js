const recursoService = require("../services/recurso.service");

const create = async (req, res, next) => {
    try {
        const recurso = await recursoService.create(req.validated.body);
        return res.status(201).json(recurso);
    } catch (error) {
        next(error);
    }
};

module.exports = { create };
