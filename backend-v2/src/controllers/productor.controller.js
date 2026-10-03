const productorService = require("../services/productor.service");

const crear = async (req, res) => {
    const productor = await productorService.crearProductor(req.validated.body);

    return res.status(201).json({
        message: "Productor creado correctamente.",
        productor
    });
};

const listar = async (req, res) => {
    const productores = await productorService.listarProductores();
    return res.status(200).json({ productores });
};

const obtener = async (req, res) => {
    const productor = await productorService.obtenerProductor(req.validated.params.id);
    return res.status(200).json({ productor });
};

const actualizar = async (req, res) => {
    const productor = await productorService.actualizarProductor(
        req.validated.params.id,
        req.validated.body
    );

    return res.status(200).json({
        message: "Productor actualizado correctamente.",
        productor
    });
};

const cambiarEstado = async (req, res) => {
    const productor = await productorService.cambiarEstadoProductor(
        req.validated.params.id,
        req.validated.body.activo
    );

    return res.status(200).json({
        message: req.validated.body.activo
            ? "Productor activado correctamente."
            : "Productor desactivado correctamente.",
        productor
    });
};

module.exports = {
    crear,
    listar,
    obtener,
    actualizar,
    cambiarEstado
};