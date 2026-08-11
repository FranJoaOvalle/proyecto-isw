const app = require("./app");
const config = require("./config");

app.listen(config.PORT, () => {
    console.log(
        `Servidor ejecutándose en http://localhost:${config.PORT}`
    );
});