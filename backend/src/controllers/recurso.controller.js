const recursoService = require("../services/recurso.service");

const getAll = async (req, res, next) => {
    try {
        const recursos = await recursoService.getAll();
        return res.status(200).json(recursos);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const recurso = await recursoService.getById(req.validated.params.id);
        return res.status(200).json(recurso);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const recurso = await recursoService.create(req.validated.body);
        return res.status(201).json(recurso);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create
};
