const ValidationException = require("../exceptions/ValidationException");

const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        if (!result.success) {
            const message = result.error.issues
                .map(issue => issue.message)
                .join(", ");

            return next(new ValidationException(message));
        }

        if (result.data.body) req.body = result.data.body;
        if (result.data.params) req.params = result.data.params;
        if (result.data.query) req.query = result.data.query;

        next();
    };
};

module.exports = validate;