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

        req.validated = result.data;
        next();
    };
};

module.exports = validate;