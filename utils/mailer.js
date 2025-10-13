// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: 'smtp.zoho.com',
//   port: 465,
//   secure: true, // true for port 465, false for 587
//   auth: {
//     user: process.env.ZOHO_EMAIL_USER, // e.g., 'yourname@yourdomain.com'
//     pass: process.env.ZOHO_EMAIL_PASS,
//   },
// });

// const sendMail = async (to, subject, html) => {
//   const mailOptions = {
//     from: `"Cargo Realm and Logistics" <${process.env.ZOHO_EMAIL_USER}>`, // include a name
//     to,
//     subject,
//     html,
//   };
//   return transporter.sendMail(mailOptions);
// };

// module.exports = sendMail;

const axios = require('axios');

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || process.env.BREVO_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.ZOHO_EMAIL_USER || 'info@cargorealmandlogistics.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Cargo Realm Logistics';

if (!BREVO_API_KEY) {
  console.warn('BREVO_API_KEY not set. Emails will fail unless a valid key is provided in environment.');
}

/**
 * sendMail - send an email using Brevo (Sendinblue) transactional API
 * @param {string} to - recipient email or comma separated list
 * @param {string} subject - email subject
 * @param {string} html - html body
 */
const sendMail = async (to, subject, html) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured in environment');
  }

  const recipients = Array.isArray(to) ? to : String(to).split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: recipients.map(email => ({ email })),
    subject,
    htmlContent: html
  };

  const config = {
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const url = 'https://api.brevo.com/v3/smtp/email';

    try {
      const resp = await axios.post(url, payload, config);
      return resp.data;
    } catch (err) {
      // Enhance error with Brevo response body when available
      if (err.response && err.response.data) {
        const e = new Error(`Brevo API error: ${JSON.stringify(err.response.data)}`);
        e.code = err.code || 'BREVO_ERROR';
        e.response = err.response.data;
        throw e;
      }
      throw err;
    }
  };

  module.exports = sendMail;
