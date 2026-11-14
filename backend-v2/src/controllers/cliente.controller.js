const clienteService = require("../services/cliente.service");

const listar = async (req, res) => {
    const clientes = await clienteService.listarClientes();
    return res.status(200).json({ clientes });
};

const obtener = async (req, res) => {
    const cliente = await clienteService.obtenerCliente(req.validated.params.id);
    return res.status(200).json({ cliente });
};

const cambiarEstado = async (req, res) => {
    const cliente = await clienteService.cambiarEstadoCliente(
        req.validated.params.id,
        req.validated.body.activo
    );

    return res.status(200).json({
        message: req.validated.body.activo
            ? "Cliente activado correctamente."
            : "Cliente desactivado correctamente.",
        cliente
    });
};

module.exports = {
    listar,
    obtener,
    cambiarEstado
};