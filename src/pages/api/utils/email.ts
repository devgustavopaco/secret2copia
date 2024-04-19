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
    subject: "NextGain - Sua solicitação de redefinição de senha",
    text: `Prezado usuário da NextGain,\n\nRecebemos uma solicitação para redefinir sua senha. Sua nova senha é:\n\n${password}\n\nFaça o login com esta nova senha e altere-a imediatamente. Se você não solicitou uma redefinição de senha, entre em contato com nossa equipe de suporte.\n\nAtenciosamente,\nEquipe NextGain`,
    html: `
            <p>Prezado usuário da NextGain,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Sua nova senha é:</p>
            <p><strong>${password}</strong></p>
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
    subject: "Bem-vindo(a) à NextGain!",
    text: `Prezado(a) usuário(a) da NextGain,

É com grande prazer que lhe damos as boas-vindas à maior plataforma de arbitragem manual do Brasil!

Aqui estão suas informações de acesso:
Nome de Usuário: ${email}
Senha Temporária: ${password}

Passo Importante: Altere sua Senha
// ... (you can continue the text version here)`,
    html: `
    <!DOCTYPE html>

    <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
    <head>
    <title></title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css?family=Varela+Round" rel="stylesheet" type="text/css"/><!--<![endif]-->
    <style>
            * {
                box-sizing: border-box;
            }
    
            body {
                margin: 0;
                padding: 0;
            }
    
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: inherit !important;
            }
    
            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
            }
    
            p {
                line-height: inherit
            }
    
            .desktop_hide,
            .desktop_hide table {
                mso-hide: all;
                display: none;
                max-height: 0px;
                overflow: hidden;
            }
    
            .image_block img+div {
                display: none;
            }
    
            .menu_block.desktop_hide .menu-links span {
                mso-hide: all;
            }
    
            @media (max-width:620px) {
    
                .desktop_hide table.icons-inner,
                .social_block.desktop_hide .social-table {
                    display: inline-block !important;
                }
    
                .icons-inner {
                    text-align: center;
                }
    
                .icons-inner td {
                    margin: 0 auto;
                }
    
                .image_block div.fullWidth {
                    max-width: 100% !important;
                }
    
                .mobile_hide {
                    display: none;
                }
    
                .row-content {
                    width: 100% !important;
                }
    
                .stack .column {
                    width: 100%;
                    display: block;
                }
    
                .mobile_hide {
                    min-height: 0;
                    max-height: 0;
                    max-width: 0;
                    overflow: hidden;
                    font-size: 0px;
                }
    
                .desktop_hide,
                .desktop_hide table {
                    display: table !important;
                    max-height: none !important;
                }
    
                .reverse {
                    display: table;
                    width: 100%;
                }
    
                .reverse .column.first {
                    display: table-footer-group !important;
                }
    
                .reverse .column.last {
                    display: table-header-group !important;
                }
    
                .row-13 td.column.first .border,
                .row-13 td.column.last .border {
                    padding: 5px 15px;
                    border-top: 0;
                    border-right: 0px;
                    border-bottom: 0;
                    border-left: 0;
                }
            }
        </style>
    </head>
    <body style="background-color: #080324; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #080324;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0d0733;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#393d47;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
    <p style="margin: 0; word-break: break-word;">NEXTGAIN - © 2024. Todos os direitos reservados</p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-position: top center; background-repeat: no-repeat; color: #000000; background-image: url('https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/background_top.png?alt=media&token=5ad6916b-cdb5-4102-bcab-249ca59049d7'); width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
    <div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;"> </div>
    <table border="0" cellpadding="10" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 81px;"><img alt="Your Brand Logo" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/logoNG.svg?alt=media&token=22a07565-8534-4207-9067-d3df39faa256" style="display: block; height: auto; border: 0; width: 100%;" title="Your Brand Logo" width="81"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:22px;line-height:150%;text-align:left;mso-line-height-alt:33px;">
    <p style="margin: 0; word-break: break-word;"><span>Bem vindo à Maior plataforma de Arbitragem do Brasil 🇧🇷</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
    <p style="margin: 0; word-break: break-word;">💡 Estamos felizes em tê-lo(a) a bordo e ansiosos para ajudá-lo(a) a explorar todas as possibilidades que nossa plataforma oferece.</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="left" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:42px;width:167px;v-text-anchor:middle;" arcsize="39%" stroke="false" fillcolor="#fecf07">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#080324; font-family:sans-serif; font-size:16px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:inline-block;color:#080324;background-color:#fecf07;border-radius:16px;width:auto;border-top:0px solid TRANSPARENT;font-weight:undefined;border-right:0px solid TRANSPARENT;border-bottom:0px solid TRANSPARENT;border-left:0px solid TRANSPARENT;padding-top:5px;padding-bottom:5px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:25px;padding-right:25px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;"><strong>Comece Agora!</strong></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 15px; padding-right: 15px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
    <table border="0" cellpadding="10" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 250px;"><img alt="Start Trading Main Image" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/main_image.png?alt=media&token=2e5b217c-c60c-4562-9c21-bcfaf9805fad" style="display: block; height: auto; border: 0; width: 100%;" title="Start Trading Main Image" width="250"/></div>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="width:100%;">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 600px;"><img height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/top.png?alt=media&token=706887e1-23a0-4a8c-afac-ea4cb684dc7b" style="display: block; height: auto; border: 0; width: 100%;" width="600"/></div>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #151030; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #282343; border-bottom: 8px solid #151030; border-left: 16px solid #151030; border-right: 16px solid #151030; border-top: 8px solid #151030; vertical-align: top;" width="33.333333333333336%">
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="width:100%;">
    <div align="center" class="alignment" style="line-height:10px">
    <div class="fullWidth" style="max-width: 168px;"><img height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/light_top.png?alt=media&token=f085a973-10b2-4cdd-a409-0b32d8827033" style="display: block; height: auto; border: 0; width: 100%;" width="168"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 40.32px;"><img alt="BTC Logo Icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/00-icon-btc.png?alt=media&token=082173f5-590d-4bac-8a53-5b44c7600f94" style="display: block; height: auto; border: 0; width: 100%;" title="BTC Logo Icon" width="40.32"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:left;mso-line-height-alt:14.399999999999999px;">
    <p style="margin: 0; word-break: break-word;"><span>BTC/USD</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 127px;"><img alt="Chart Up Reference" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/chart_green.png?alt=media&token=6be17f3a-c208-4269-b2e3-457b230c87de" style="display: block; height: auto; border: 0; width: 100%;" title="Chart Up Reference" width="127"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-right:15px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:10px;line-height:120%;text-align:left;mso-line-height-alt:12px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="width:100%;">
    <div align="center" class="alignment" style="line-height:10px">
    <div class="fullWidth" style="max-width: 168px;"><img height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/bottom.png?alt=media&token=b269d58f-3307-420f-a174-1784d3bd2daf" style="display: block; height: auto; border: 0; width: 100%;" width="168"/></div>
    </div>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <div class="spacer_block block-1" style="height:16px;line-height:16px;font-size:1px;"> </div>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 40.8px;"><img alt="ADA Logo Icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/03-icon-ada.png?alt=media&token=89316bc1-2300-4a19-8160-dff01280b157" style="display: block; height: auto; border: 0; width: 100%;" title="ADA Logo Icon" width="40.8"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:left;mso-line-height-alt:14.399999999999999px;">
    <p style="margin: 0; word-break: break-word;"><span>ADA/USD</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 127px;"><img alt="Chart Up Reference" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/chart_green.png?alt=media&token=6be17f3a-c208-4269-b2e3-457b230c87de" style="display: block; height: auto; border: 0; width: 100%;" title="Chart Up Reference" width="127"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-right:15px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:10px;line-height:120%;text-align:left;mso-line-height-alt:12px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <div class="spacer_block block-1" style="height:16px;line-height:16px;font-size:1px;"> </div>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 40.8px;"><img alt="ETH Logo Icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/01-icon-eth.png?alt=media&token=288694ab-06e4-413b-938f-1807959ae83c" style="display: block; height: auto; border: 0; width: 100%;" title="ETH Logo Icon" width="40.8"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:left;mso-line-height-alt:14.399999999999999px;">
    <p style="margin: 0; word-break: break-word;"><span>ETH/USD</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;width:100%;">
    <div align="left" class="alignment" style="line-height:10px">
    <div style="max-width: 127px;"><img alt="Chart Down Reference" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/chart_red.png?alt=media&token=bc77b428-7c3c-4f61-8ea9-99ac442441b2" style="display: block; height: auto; border: 0; width: 100%;" title="Chart Down Reference" width="127"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-right:15px;">
    <div style="color:#807aa0;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:10px;line-height:120%;text-align:left;mso-line-height-alt:12px;">
    <p style="margin: 0; word-break: break-word;"><span>$33,430.12</span></p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="width:100%;">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 600px;"><img height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/bottom.png?alt=media&token=b269d58f-3307-420f-a174-1784d3bd2daf" style="display: block; height: auto; border: 0; width: 100%;" width="600"/></div>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment">
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #282343;"><span> </span></td>
    </tr>
    </table>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:22px;line-height:120%;text-align:left;mso-line-height-alt:26.4px;">
    <p style="margin: 0; word-break: break-word;"><span>Cotação das melhores moedas</span></p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="41.666666666666664%">
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 10px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 10px;"><img align="center" alt="BTC" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/00-icon-btc.png?alt=media&token=082173f5-590d-4bac-8a53-5b44c7600f94" style="display: block; height: auto; margin: 0 auto; border: 0;" width="32"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">Bitcoin (BTC)</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-top:15px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
    <p style="margin: 0; word-break: break-word;">$33,430.12</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 3px; padding-left: 5px; padding-right: 5px; padding-top: 3px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 5px;"><img align="center" alt="Up" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/arrow_up.png?alt=media&token=b96545d9-c95d-43c2-b409-02548019f224" style="display: block; height: auto; margin: 0 auto; border: 0;" width="16"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">0.15%</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:28px;width:117px;v-text-anchor:middle;" arcsize="15%" stroke="false" fillcolor="#282343">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#ffffff; font-family:sans-serif; font-size:14px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:block;color:#ffffff;background-color:#282343;border-radius:4px;width:90%;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:0px;padding-bottom:0px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:15px;padding-right:15px;font-size:14px;display:inline-block;letter-spacing:normal;"><span style="word-break:break-word;"><span data-mce-style="" style="line-height: 28px;">TRADE</span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="41.666666666666664%">
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 10px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 10px;"><img align="center" alt="ETH" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/01-icon-eth.png?alt=media&token=288694ab-06e4-413b-938f-1807959ae83c" style="display: block; height: auto; margin: 0 auto; border: 0;" width="32"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">Ethereum (ETH)</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-top:15px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
    <p style="margin: 0; word-break: break-word;">$2,430.12</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 3px; padding-left: 5px; padding-right: 5px; padding-top: 3px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 5px;"><img align="center" alt="Down" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/arrow_down.png?alt=media&token=53b02264-c460-44cd-a9a5-78c9ab211336" style="display: block; height: auto; margin: 0 auto; border: 0;" width="16"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">12.5%</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:28px;width:117px;v-text-anchor:middle;" arcsize="15%" stroke="false" fillcolor="#282343">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#ffffff; font-family:sans-serif; font-size:14px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:block;color:#ffffff;background-color:#282343;border-radius:4px;width:90%;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:0px;padding-bottom:0px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:15px;padding-right:15px;font-size:14px;display:inline-block;letter-spacing:normal;"><span style="word-break:break-word;"><span data-mce-style="" style="line-height: 28px;">TRADE</span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="41.666666666666664%">
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 10px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 10px;"><img align="center" alt="USDT" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/02-icon-usd.png?alt=media&token=91408d2f-bb5f-48df-85f9-229f2747c35f" style="display: block; height: auto; margin: 0 auto; border: 0;" width="32"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">Tether (USDT)</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-top:15px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
    <p style="margin: 0; word-break: break-word;">$1,555.12</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 3px; padding-left: 5px; padding-right: 5px; padding-top: 3px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 5px;"><img align="center" alt="Up" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/arrow_up.png?alt=media&token=b96545d9-c95d-43c2-b409-02548019f224" style="display: block; height: auto; margin: 0 auto; border: 0;" width="16"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">0.1%</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:28px;width:117px;v-text-anchor:middle;" arcsize="15%" stroke="false" fillcolor="#282343">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#ffffff; font-family:sans-serif; font-size:14px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:block;color:#ffffff;background-color:#282343;border-radius:4px;width:90%;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:0px;padding-bottom:0px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:15px;padding-right:15px;font-size:14px;display:inline-block;letter-spacing:normal;"><span style="word-break:break-word;"><span data-mce-style="" style="line-height: 28px;">TRADE</span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="41.666666666666664%">
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 10px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 10px;"><img align="center" alt="BNB" class="icon" height="auto" src="https://console.firebase.google.com/project/beeasy-bb04c/storage/beeasy-bb04c.appspot.com/files?hl=pt" style="display: block; height: auto; margin: 0 auto; border: 0;" width="32"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">Binance Coin (BNB)</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 15px; padding-right: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="33.333333333333336%">
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad" style="padding-left:15px;padding-top:15px;">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
    <p style="margin: 0; word-break: break-word;">$316.97</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #ffffff; font-family: inherit; font-size: 14px; padding-bottom: 3px; padding-left: 5px; padding-right: 5px; padding-top: 3px; text-align: left;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: left;"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 5px;"><img align="center" alt="Down" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/arrow_down.png?alt=media&token=53b02264-c460-44cd-a9a5-78c9ab211336" style="display: block; height: auto; margin: 0 auto; border: 0;" width="16"/></td>
    <td style="font-family: Varela Round, Trebuchet MS, Helvetica, sans-serif; font-size: 14px; font-weight: undefined; color: #ffffff; vertical-align: middle; letter-spacing: undefined; text-align: left;">0.78%</td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:28px;width:117px;v-text-anchor:middle;" arcsize="15%" stroke="false" fillcolor="#282343">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#ffffff; font-family:sans-serif; font-size:14px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:block;color:#ffffff;background-color:#282343;border-radius:4px;width:90%;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:0px;padding-bottom:0px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:15px;padding-right:15px;font-size:14px;display:inline-block;letter-spacing:normal;"><span style="word-break:break-word;"><span data-mce-style="" style="line-height: 28px;">TRADE</span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-11" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:14px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
    <p style="margin: 0; word-break: break-word;">Essa são apenas algumas moedas que estão na Nextgain!</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:42px;width:161px;v-text-anchor:middle;" arcsize="39%" stroke="false" fillcolor="#fecf07">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#080324; font-family:sans-serif; font-size:16px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:inline-block;color:#080324;background-color:#fecf07;border-radius:16px;width:auto;border-top:0px solid TRANSPARENT;font-weight:undefined;border-right:0px solid TRANSPARENT;border-bottom:0px solid TRANSPARENT;border-left:0px solid TRANSPARENT;padding-top:5px;padding-bottom:5px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:25px;padding-right:25px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;"><strong>Iniciar Jornada</strong></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-12" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment">
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #282343;"><span> </span></td>
    </tr>
    </table>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:22px;line-height:120%;text-align:left;mso-line-height-alt:26.4px;">
    <p style="margin: 0; word-break: break-word;">Transforme volatilidade em oportunidade!</p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-13" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr class="reverse">
    <td class="column column-1 first" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
    <div class="border">
    <table border="0" cellpadding="15" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 202.5px;"><img alt="Chart Pie Reference Image" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/chart-01.png?alt=media&token=c7259f9c-6b50-4887-8fc5-b4369fccdce4" style="display: block; height: auto; border: 0; width: 100%;" title="Chart Pie Reference Image" width="202.5"/></div>
    </div>
    </td>
    </tr>
    </table>
    </div>
    </td>
    <td class="column column-2 last" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 15px; padding-right: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
    <div class="border">
    <div class="spacer_block block-1" style="height:30px;line-height:30px;font-size:1px;"> </div>
    <table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#ffffff;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;line-height:150%;text-align:left;mso-line-height-alt:24px;">
    <p style="margin: 0; word-break: break-word;">Descubra a praticidade e o potencial das operações de arbitragem manual na NextGain. Sua jornada rumo ao lucro aproveitando a volatilidade do mercado começa aqui!</p>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="left" class="alignment"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com" style="height:42px;width:164px;v-text-anchor:middle;" arcsize="39%" stroke="false" fillcolor="#fecf07">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#080324; font-family:sans-serif; font-size:16px">
    <![endif]--><a href="http://www.example.com" style="text-decoration:none;display:inline-block;color:#080324;background-color:#fecf07;border-radius:16px;width:auto;border-top:0px solid TRANSPARENT;font-weight:undefined;border-right:0px solid TRANSPARENT;border-bottom:0px solid TRANSPARENT;border-left:0px solid TRANSPARENT;padding-top:5px;padding-bottom:5px;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:25px;padding-right:25px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;"><strong>Comece agora!</strong></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
    </td>
    </tr>
    </table>
    </div>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-position: top center; background-repeat: no-repeat; color: #000000; background-image: url('https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/background_bottom.png?alt=media&token=22a12898-70fd-42ca-afb4-1952b5da0b7f'); width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment">
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #282343;"><span> </span></td>
    </tr>
    </table>
    </div>
    </td>
    </tr>
    </table>
    <div class="spacer_block block-2" style="height:20px;line-height:20px;font-size:1px;"> </div>
    <table border="0" cellpadding="10" cellspacing="0" class="image_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 84px;"><img alt="Your Brand Logo" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/logoNG.svg?alt=media&token=22a07565-8534-4207-9067-d3df39faa256" style="display: block; height: auto; border: 0; width: 100%;" title="Your Brand Logo" width="84"/></div>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="menu_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="color:#7b7b7b;font-family:inherit;font-size:12px;padding-bottom:5px;padding-top:5px;text-align:center;">
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="text-align:center;font-size:0px;">
    <div class="menu-links"><!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style=""><tr style="text-align:center;"><![endif]--><!--[if mso]><td style="padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px"><![endif]--><a href="http://www.example.com" style="mso-hide:false;padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px;display:inline-block;color:#7b7b7b;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;text-decoration:none;letter-spacing:normal;" target="_blank">Cryptocurrencies</a><!--[if mso]></td><![endif]--><!--[if mso]><td style="padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px"><![endif]--><a href="http://www.example.com" style="mso-hide:false;padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px;display:inline-block;color:#7b7b7b;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;text-decoration:none;letter-spacing:normal;" target="_blank">Exchanges</a><!--[if mso]></td><![endif]--><!--[if mso]><td style="padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px"><![endif]--><a href="http://www.example.com" style="mso-hide:false;padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px;display:inline-block;color:#7b7b7b;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;text-decoration:none;letter-spacing:normal;" target="_self">NFT</a><!--[if mso]></td><![endif]--><!--[if mso]><td style="padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px"><![endif]--><a href="http://www.example.com" style="mso-hide:false;padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px;display:inline-block;color:#7b7b7b;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;text-decoration:none;letter-spacing:normal;" target="_self">Portfolio</a><!--[if mso]></td><![endif]--><!--[if mso]></tr></table><![endif]--></div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" class="social_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:10px;text-align:center;">
    <div align="center" class="alignment">
    <table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="208px">
    <tr>
    <td style="padding:0 10px 0 10px;"><a href="https://www.twitter.com" target="_blank"><img alt="Twitter" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/twitter2x.png?alt=media&token=96e97ba6-fba9-41e5-9412-86d74b8355ec" style="display: block; height: auto; border: 0;" title="Twitter" width="32"/></a></td>
    <td style="padding:0 10px 0 10px;"><a href="https://www.instagram.com" target="_blank"><img alt="Instagram" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/instagram2x.png?alt=media&token=66a0fd4e-1973-4c5b-a7d8-bd1d7e51bf8c" style="display: block; height: auto; border: 0;" title="Instagram" width="32"/></a></td>
    <td style="padding:0 10px 0 10px;"><a href="https://www.medium.com" target="_blank"><img alt="Medium" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/medium2x.png?alt=media&token=f994433b-e1a3-4a5f-90c2-aca4c7f202e7" style="display: block; height: auto; border: 0;" title="Medium" width="32"/></a></td>
    <td style="padding:0 10px 0 10px;"><a href="https://www.linkedin.com/shareArticle?mini=true&url=[ShareOn]" target="_blank"><img alt="LinkedIn" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/linkedin2x.png?alt=media&token=36153dda-a1df-452d-9dcc-09bab0a3e3bb" style="display: block; height: auto; border: 0;" title="LinkedIn" width="32"/></a></td>
    </tr>
    </table>
    </div>
    </td>
    </tr>
    </table>
    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#7b7b7b;font-family:Varela Round, Trebuchet MS, Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
    <p style="margin: 0; word-break: break-word;"><span>© 2024 Nextgain. Todos direitos reservados.</span></p>
    </div>
    </td>
    </tr>
    </table>
    <div class="spacer_block block-7" style="height:20px;line-height:20px;font-size:1px;"> </div>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-15" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #ffffff; width: 600px; margin: 0 auto;" width="600">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center;" width="100%">
    <tr>
    <td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="alignment" style="vertical-align: middle; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
    <!--[if !vml]><!-->
    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
    <tr>
    <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="http://designedwithbeefree.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Beefree Logo" class="icon" height="auto" src="https://firebasestorage.googleapis.com/v0/b/beeasy-bb04c.appspot.com/o/Beefree-logo.png?alt=media&token=6b0a8380-58a9-4457-b898-655c038d61b3" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"/></a></td>
    <td style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: undefined; color: #1e0e4b; vertical-align: middle; letter-spacing: undefined; text-align: center;"><a href="http://designedwithbeefree.com/" style="color: #1e0e4b; text-decoration: none;" target="_blank">Designed with Beefree</a></td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table><!-- End -->
    </body>
    </html>
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
