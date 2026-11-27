const nodemailer = require("nodemailer");
const env = require("../config/env");
const { esCorreoDemo } = require("../utils/correo-demo");

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
    if (esCorreoDemo(email)) return;
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

const sendEncuestaEmail = async (email, token) => {
    const encuestaUrl =
        `${env.FRONTEND_URL}/encuesta?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
        from: `NES Eventos <${env.SMTP_FROM}>`,
        to: email,
        subject: "Cuéntanos tu experiencia - NES Eventos",
        text: [
            "Gracias por confiar en NES Eventos.",
            "",
            "Queremos conocer tu opinión sobre el evento realizado.",
            "",
            `Responde nuestra encuesta aquí: ${encuestaUrl}`,
            "",
            "Este enlace es personal y expirará en 7 días.",
            "",
            "Tu opinión nos ayuda a mejorar nuestros servicios."
        ].join("\n"),
        html: `
            <h2>Gracias por confiar en NES Eventos</h2>

            <p>
                Queremos conocer tu opinión sobre el evento realizado.
                Tu experiencia nos ayuda a mejorar nuestros servicios.
            </p>

            <p>
                <a href="${encuestaUrl}"
                   style="
                       display: inline-block;
                       padding: 12px 24px;
                       background-color: #0d6efd;
                       color: white;
                       text-decoration: none;
                       border-radius: 6px;
                   ">
                    Responder encuesta
                </a>
            </p>

            <p>
                Este enlace es personal y expirará en 7 días.
            </p>

            <p>Equipo NES Eventos.</p>
        `
    });
};

module.exports = {
    sendPasswordResetEmail,
    sendEncuestaEmail
};
