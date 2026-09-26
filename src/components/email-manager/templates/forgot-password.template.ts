import { EmailTemplateBodyTypesEnum } from '../enums/email-manager.enum';
import { IEmailTemplate } from '../interfaces/email-manager.interface';

export const FORGOT_PASSWORD_TEMPLATE: IEmailTemplate = {
  subject: 'Bazar - Password Reset Request',
  body: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        background-color: #ffffff;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 0 20px;
      }
      .logo {
        margin-top: 32px;
        display: block;
        width: 250px;
        height: 100px;
      }
      h1 {
        color: #1d1c1d;
        font-size: 36px;
        font-weight: 700;
        margin: 30px 0;
        line-height: 42px;
      }
      p {
        font-size: 20px;
        line-height: 28px;
        margin: 16px 0;
        margin-bottom: 30px;
      }
      .button {
        font-size: 16px;
        color: #ffffff;
        text-decoration: none;
        background-color: #067df7;
        padding: 12px 24px;
        border-radius: 4px;
        display: inline-block;
        font-weight: bold;
      }
      .footer {
        font-size: 12px;
        line-height: 15px;
        color: #b7b7b7;
        margin: 16px 0;
        margin-bottom: 50px;
      }
      .social-icons {
        text-align: right;
        margin-top: 20px;
      }
      .social-icons img {
        width: 32px;
        height: 32px;
        margin-left: 16px;
      }
      .footer-links a {
        color: #b7b7b7;
        text-decoration: underline;
        margin-right: 16px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <table role="presentation" width="100%">
        <tr>
          <td>
            <img class="logo" alt="Bazar" src="https://pub-7d93963c935c4f678cba0286e55d4b1d.r2.dev/Screenshot%202024-09-20%20at%201.55.04%E2%80%AFAM.png" />
            <h1>Reset your password</h1>
            <p>Hi <%= user.first_name %>,</p>
            <p>We received a request to reset your Bazar password. If you didn’t make this request, you can ignore this email.</p>
            <p>Otherwise, click the button below to reset your password:</p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr>
                <td align="center">
                  <a href="<%= user.reset_link %>" class="button">Reset Password</a>
                </td>
              </tr>
            </table>
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p style="font-size:18px;line-height:26px;margin:16px 0;margin-bottom:30px;color:#067df7;"><%= user.reset_link %></p>
            <p>Thank you,<br>Bazar Support Team</p>
            <div class="social-icons">
              <a href="https://twitter.com/" target="_blank"><img alt="Twitter" src="https://react-email-demo-ijnnx5hul-resend.vercel.app/static/slack-twitter.png" /></a>
              <a href="https://www.facebook.com/" target="_blank"><img alt="Facebook" src="https://react-email-demo-ijnnx5hul-resend.vercel.app/static/slack-facebook.png" /></a>
              <a href="https://www.linkedin.com/company/" target="_blank"><img alt="LinkedIn" src="https://react-email-demo-ijnnx5hul-resend.vercel.app/static/slack-linkedin.png" /></a>
            </div>
            <div class="footer">
              <div class="footer-links">
                <a href="https://www.bazar.com/blog" target="_blank" rel="noopener noreferrer">Our blog</a>
                <a href="https://www.bazar.com/policy" target="_blank" rel="noopener noreferrer">Policies</a>
                <a href="https://www.bazar.com/contact" target="_blank" rel="noopener noreferrer">Contact Us</a>
              </div>
              <p>©2024 Bazar | All rights reserved.</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`,
  body_type: EmailTemplateBodyTypesEnum.HTML,
};
