const clienteService = require("../services/cliente.service");

const getAll = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.usuario.rol === "ADMIN" && req.validated.query?.incluirInactivos === true;

        const clientes = await clienteService.getAll(incluirInactivos);

        return res.status(200).json(clientes);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const cliente = await clienteService.getById(req.validated.params.id);
        return res.status(200).json(cliente);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const cliente = await clienteService.create(req.body);
        return res.status(201).json(cliente);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const cliente = await clienteService.update(
            req.validated.params.id,
            req.body
        );

        return res.status(200).json(cliente);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const cliente = await clienteService.remove(req.validated.params.id);
        return res.status(200).json(cliente);
    } catch (error) {
        next(error);
    }
};

const createUsuario = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const usuario = await clienteService.createUsuario(
            req.validated.params.id,
            email,
            password
        );

        return res.status(201).json(usuario);
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const cliente = await clienteService.reactivate(req.validated.params.id);
        return res.status(200).json(cliente);
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