import { EmailTemplateBodyTypesEnum } from '../enums/email-manager.enum';
import { IEmailTemplate } from '../interfaces/email-manager.interface';

export const REGISTER_TEMPLATE: IEmailTemplate = {
  subject: 'Bazar - Registration Successful',
  body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
          <h1>Welcome to Bazar!</h1>
          <p>Hi <%= user.first_name %>, your registration was successful. Thank you for joining Bazar. We're excited to have you on board.</p>
          <p>Please keep this email for your records. If you have any questions or need assistance, feel free to reach out to our support team.</p>
          
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
