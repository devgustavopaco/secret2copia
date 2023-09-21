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

export async function sendResetPasswordEmail(email: string, password: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: "Bem-vindo(a) à NextGain!",
    text: `Prezado(a) usuário(a) da NextGain,

É com grande prazer que lhe damos as boas-vindas à maior plataforma de arbitragem manual do Brasil!

Aqui estão suas informações de acesso:
Nome de Usuário: ${email}
Senha Temporária: ${password}

Passo Importante: Altere sua Senha
// ... (you can continue the text version here)`,
    html: `
            <p>Prezado(a) usuário(a) da NextGain,</p>
            <p>É com grande prazer que lhe damos as boas-vindas à maior plataforma de arbitragem manual do Brasil!</p>
            <p>Aqui estão suas informações de acesso:</p>
            <p>Nome de Usuário: <strong>${email}</strong></p>
            <p>Senha Temporária: <strong>${password}</strong></p>
            <p><strong>Passo Importante: Altere sua Senha</strong></p>
            <p>Para garantir a segurança da sua conta, recomendamos que você altere sua senha imediatamente após o primeiro login. Para fazer isso, siga estas etapas simples:</p>
            <ul>
              <li>Acesse nextgain.com.br</li>
              <li>Faça login com o nome de usuário fornecido acima e a senha temporária.</li>
              <li>Crie uma nova senha na área de privacidade, que seja segura e exclusiva para a sua conta.</li>
            </ul>
            <p>Se por algum motivo você não solicitou essas credenciais, entre em contato imediatamente com nossa equipe de suporte para investigarmos qualquer atividade suspeita em sua conta.</p>
            <p>Estamos empolgados em tê-lo(a) conosco na NextGain e esperamos que você aproveite ao máximo nossa plataforma!</p>
            <p>Se você tiver alguma dúvida ou precisar de assistência, não hesite em nos contatar a qualquer momento. Eu estarei à disposição para ajudar.</p>
            <p>Atenciosamente,<br>Gustavo Nigre<br>CEO & Founder<br>NextGain</p>
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
