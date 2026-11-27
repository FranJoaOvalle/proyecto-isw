require("./config/loadEnv");

const env = require("./config/env");
const app = require("./app");

const {
    iniciarEncuestasJob
} = require("./jobs/encuestas.job");

app.listen(env.PORT, () => {
    console.log(`API V2 funcionando en puerto ${env.PORT}`);

    iniciarEncuestasJob();
});