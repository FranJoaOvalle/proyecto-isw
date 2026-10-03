const ValidationException = require("../exceptions/ValidationException");

const validator = (...schemas) => (req, res, next) => {
    const input = {
        body: req.body,
        params: req.params,
        query: req.query
    };

    let validated = {};

    for (const schema of schemas) {
        const result = schema.safeParse(input);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.filter((part) => part !== "body").join("."),
                message: issue.message
            }));
            throw new ValidationException("Uno o más datos proporcionados no son válidos.", details);
        }

        validated = {
            ...validated,
            ...result.data,
            body: {
                ...validated.body,
                ...result.data.body
            },
            params: {
                ...validated.params,
                ...result.data.params
            },
            query: {
                ...validated.query,
                ...result.data.query
            }
        };
    }

    req.validated = validated;
    next();
};

module.exports = validator;