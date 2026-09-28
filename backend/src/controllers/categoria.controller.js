const categoriaService = require("../services/categoria.service");

const getAll = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.usuario.rol === "ADMIN" && req.validated.query?.incluirInactivos === true;

        const categorias = await categoriaService.getAll(incluirInactivos);

        return res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const categoria = await categoriaService.getById(req.validated.params.id);
        return res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const categoria = await categoriaService.create(req.body);
        return res.status(201).json(categoria);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const categoria = await categoriaService.update(
            req.validated.params.id,
            req.body
        );

        return res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const categoria = await categoriaService.remove(req.validated.params.id);
        return res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const categoria = await categoriaService.reactivate(req.validated.params.id);
        return res.status(200).json(categoria);
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
    reactivate
};