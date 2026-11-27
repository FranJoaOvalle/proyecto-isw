const EncuestaPublicaService =
    require("../services/encuesta-publica.service");

const consultar = async (req, res, next) => {
    try {
        const resultado =
            await EncuestaPublicaService.consultar(
                req.validated.body.token
            );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const responder = async (req, res, next) => {
    try {
        const resultado =
            await EncuestaPublicaService.responder(
                req.validated.body
            );

        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    consultar,
    responder
};