const RankingProductoresService =
    require("../services/ranking-productores.service");

const obtener = async (req, res, next) => {
    try {
        const resultado =
            await RankingProductoresService.obtener(
                req.validated.query
            );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    obtener
};