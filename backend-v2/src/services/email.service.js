const nodemailer = require("nodemailer");
const env = require("../config/env");

const smtpConfigurado = Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM
);
const transporter = smtpConfigurado
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    })
    : null;

const sendPasswordResetEmail = async (email, token) => {
    if (!transporter) throw new Error("El servicio SMTP no está configurado.");
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

const sendEncuestaSatisfaccion = async (email, encuestaUrl) => {
    if (!env.SURVEY_URL) {
        return {
            estado: "NO_ENVIADO_CORREO",
            motivo: "La URL de la encuesta no está configurada."
        };
    }
    if (!transporter) {
        return env.NODE_ENV === "development" || env.NODE_ENV === "test"
            ? { estado: "SIMULADO", motivo: "SMTP no está configurado; no se envió ningún correo." }
            : { estado: "NO_ENVIADO_CORREO", motivo: "El servicio SMTP no está configurado." };
    }

    const resultado = await transporter.sendMail({
        from: `NES Eventos <${env.SMTP_FROM}>`,
        to: email,
        subject: "¿Cómo fue tu experiencia con NES Eventos?",
        text: `Queremos conocer tu experiencia. Responde esta encuesta: ${encuestaUrl}`,
        html: `<p>Queremos conocer tu experiencia con NES Eventos.</p><p><a href="${encuestaUrl}">Responder encuesta</a></p>`
    });
    const aceptado = (resultado.accepted ?? []).some(
        (destinatario) => String(destinatario).toLowerCase() === email.toLowerCase()
    );
    return aceptado
        ? { estado: "ENVIADO", motivo: null }
        : { estado: "NO_ENVIADO_CORREO", motivo: "El proveedor no aceptó el destinatario." };
};

module.exports = {
    sendPasswordResetEmail,
    sendEncuestaSatisfaccion
};
