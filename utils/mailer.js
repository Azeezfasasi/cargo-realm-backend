const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true, // true for port 465, false for 587
  auth: {
    user: process.env.ZOHO_EMAIL_USER, // e.g., 'yourname@yourdomain.com'
    pass: process.env.ZOHO_EMAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Cargo Realm and Logistics" <${process.env.ZOHO_EMAIL_USER}>`, // include a name
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = sendMail;
