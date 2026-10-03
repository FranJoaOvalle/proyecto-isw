require("dotenv").config();

const env = require("./config/env");
const app = require("./app");

app.listen(env.PORT, () => {
    console.log(`API V2 funcionando en puerto ${env.PORT}`);
});