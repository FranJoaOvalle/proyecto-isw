const personalService = require("../services/personal.service");

const getAll = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.usuario.rol === "ADMIN" && req.validated.query?.incluirInactivos === true;

        const personal = await personalService.getAll(incluirInactivos);

        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const personal = await personalService.getById(req.validated.params.id);
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
            req.validated.params.id,
            req.body
        );

        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const personal = await personalService.remove(req.validated.params.id);
        return res.status(200).json(personal);
    } catch (error) {
        next(error);
    }
};

const createUsuario = async (req, res, next) => {
    try {
        const { email, password, rol } = req.body;

        const usuario = await personalService.createUsuario(
            req.validated.params.id,
            email,
            password,
            rol
        );

        return res.status(201).json(usuario);
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const personal = await personalService.reactivate(req.validated.params.id);
        return res.status(200).json(personal);
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
    reactivate
};