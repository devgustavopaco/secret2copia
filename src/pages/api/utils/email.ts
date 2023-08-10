// utils/email.ts

import nodemailer from "nodemailer";

// Configure your email settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendResetPasswordEmail(
  email: string,
  newPassword: string
) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: "NextGain - Sua solicitação de redefinição de senha",
    text: `Prezado usuário da NextGain,\n\nRecebemos uma solicitação para redefinir sua senha. Sua nova senha é:\n\n${newPassword}\n\nFaça o login com esta nova senha e altere-a imediatamente. Se você não solicitou uma redefinição de senha, entre em contato com nossa equipe de suporte.\n\nAtenciosamente,\nEquipe NextGain`,
    html: `
            <p>Prezado usuário da NextGain,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Sua nova senha é:</p>
            <p><strong>${newPassword}</strong></p>
            <p>Faça o login com esta nova senha e altere-a imediatamente. Se você não solicitou uma redefinição de senha, entre em contato com nossa equipe de suporte.</p>
            <p>Atenciosamente,<br>NextGain</p>
        `,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending email: %s", error.message);
    } else {
      console.error("Error sending email:", error);
    }
  }
}
export async function sendWelcomeEmail(email: string, password: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: "NextGain - Bem-vindo à NextGain",
    text: `Prezado(a) usuário(a) da NextGain,\n\nSeja bem-vindo(a) à maior plataforma de arbitragem manual do Brasil. Seu email de acesso é:\n\n${email}\n\nE sua senha é:\n\n${password}\n\nFaça o login com essas credenciais e altere a senha imediatamente. Se você não solicitou essas credenciais, entre em contato com nossa equipe de suporte.\n\nAtenciosamente,\nEquipe NextGain`,
    html: `
            <p>Prezado(a) usuário(a) da NextGain,</p>
            <p>Seja bem-vindo(a) à maior plataforma de arbitragem manual do Brasil. Seu email de acesso é:</p>
            <p><strong>${email}</strong></p>
            <p>E sua senha é:</p>
            <p><strong>${password}</strong></p>
            <p>Faça o login com essas credenciais e altere a senha imediatamente. Se você não solicitou essas credenciais, entre em contato com nossa equipe de suporte.</p>
            <p>Atenciosamente,<br>NextGain</p>
        `,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending email: %s", error.message);
    } else {
      console.error("Error sending email:", error);
    }
  }
}

