const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        req.validated = result;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = validate;