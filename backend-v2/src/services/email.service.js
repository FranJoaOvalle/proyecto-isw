const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
});

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl =
        `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
        from: `NES Eventos <${env.SMTP_FROM}>`,
        to: email,
        subject: "Restablecer contraseña - NES Eventos",
        text: [
            "Recibimos una solicitud para restablecer tu contraseña.",
            "",
            `Puedes crear una nueva contraseña aquí: ${resetUrl}`,
            "",
            "Este enlace expirará en 30 minutos.",
            "",
            "Si no solicitaste este cambio, puedes ignorar este correo."
        ].join("\n"),
        html: `
            <h2>Restablecer contraseña</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>

            <p>
                <a href="${resetUrl}">
                    Crear nueva contraseña
                </a>
            </p>

            <p>Este enlace expirará en 30 minutos.</p>

            <p>
                Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
        `
    });
};

module.exports = {
    sendPasswordResetEmail
};