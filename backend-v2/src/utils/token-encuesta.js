const crypto = require("node:crypto");
const env = require("../config/env");

function generarToken(invitacion) {
    return crypto.createHmac("sha256", env.JWT_SECRET)
        .update(`encuesta:v1:${invitacion.id}:${invitacion.createdAt.toISOString()}`)
        .digest("base64url");
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { generarToken, hashToken };
