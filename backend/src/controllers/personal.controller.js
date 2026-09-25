const personalService = require("../services/personal.service");

const getAll = async (req, res, next) => {
    try {
        const personal = await personalService.getAll();
        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const personal = await personalService.getById(req.params.id);
        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const personal = await personalService.create(req.body);
        return res.status(201).json(personal);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const personal = await personalService.update(
            req.params.id,
            req.body
        );

        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const personal = await personalService.remove(req.params.id);
        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const createUsuario = async (req, res, next) => {
    try {
        const { email, password, rol } = req.body;

        const usuario = await personalService.createUsuario(
            req.params.id,
            email,
            password,
            rol
        );

        return res.status(201).json(usuario);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    createUsuario,
};