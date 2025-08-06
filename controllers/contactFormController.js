// const ContactForm = require('../models/ContactForm');
// const sendMail = require('../utils/mailer');
// const User = require('../models/User'); // Assuming User model is available for populating repliedBy

// exports.submitContactForm = async (req, res) => {
//   try {
//     const { name, email, phoneNumber, message } = req.body;
//     const contact = new ContactForm({ name, email, phoneNumber, message });
//     await contact.save();
//     // Email to user (sender)
//     await sendMail(email, 'Quote Request Received - Cargo Realm and Logistics',
//       `<p>Hi ${name},</p>
//        <p>Thank you for contacting Cargo Realm and Logistics. We have received your quote request and will get back to you as soon as possible.</p>
//        <p>Your message:</p>
//        <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
//          <p>${message}</p>
//        </blockquote>
//        <p>Sincerely,</p>
//        <p>Cargo Realm and Logistics Team</p>`
//     );
//     // Email to admin
//     await sendMail(process.env.ZOHO_EMAIL_USER, 'New Quote Request Submission',
//       `<p>New message from ${name} (${email}):</p>
//        <p>Phone: ${phoneNumber || 'N/A'}</p>
//        <p>Message:</p>
//        <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
//          <p>${message}</p>
//        </blockquote>
//        <p>Contact ID: ${contact._id}</p>
//        <p>Please log in to the admin panel to reply.</p>`
//     );
//     res.status(201).json(contact);
//   } catch (err) {
//     console.error('Error submitting contact form:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getAllContactForms = async (req, res) => {
//   try {
//     // Populate repliedBy field to show who replied
//     const contacts = await ContactForm.find().populate('repliedBy', 'name email').sort({ createdAt: -1 });
//     res.json(contacts);
//   } catch (err) {
//     console.error('Error fetching all contact forms:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.editContactForm = async (req, res) => {
//   try {
//     const contact = await ContactForm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!contact) return res.status(404).json({ message: 'Contact form not found' });
//     res.json(contact);
//   } catch (err) {
//     console.error('Error editing contact form:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.deleteContactForm = async (req, res) => {
//   try {
//     const contact = await ContactForm.findByIdAndDelete(req.params.id);
//     if (!contact) return res.status(404).json({ message: 'Contact form not found' });
//     res.json({ message: 'Contact form deleted' });
//   } catch (err) {
//     console.error('Error deleting contact form:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // Function to reply to a contact form submission
// exports.replyToContactForm = async (req, res) => {
//   try {
//     const { id } = req.params; // Contact form ID
//     const { subject, replyContent } = req.body;

//     const contactForm = await ContactForm.findById(id);
//     if (!contactForm) {
//       return res.status(404).json({ message: 'Contact form not found.' });
//     }
//     if (!contactForm.email) {
//       return res.status(400).json({ message: 'Cannot reply: Sender email not available.' });
//     }

//     // Send email to the sender
//     const emailContent = `
//       <p>Hi ${contactForm.name || 'Valued Member'},</p>
//       <p>Thank you for your message. Here is a reply from Cargo Realm and Logistics:</p>
//       <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
//         <p>${replyContent}</p>
//       </blockquote>
//       <p>Original Message:</p>
//       <blockquote style="border-left: 4px solid #eee; margin: 0; padding-left: 10px; color: #777;">
//         <p>${contactForm.message}</p>
//       </blockquote>
//       <p>Sincerely,</p>
//       <p>Cargo Realm and Logistics Team</p>
//     `;
//     await sendMail(contactForm.email, subject, emailContent);

//     // Update contact form status, repliedBy, and repliedAt
//     contactForm.status = 'replied';
//     contactForm.repliedBy = req.user.id; // User who is logged in and replying
//     contactForm.repliedAt = new Date();
//     await contactForm.save();

//     res.json({ message: 'Reply sent successfully and contact form updated.', contactForm });

//   } catch (err) {
//     console.error('Error replying to contact form:', err);
//     res.status(500).json({ message: 'Server error: ' + err.message });
//   }
// };


const ContactForm = require('../models/ContactForm');
const sendMail = require('../utils/mailer');
const User = require('../models/User'); // Ensure User model is imported

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phoneNumber, message } = req.body;
    const contact = new ContactForm({ name, email, phoneNumber, message });
    await contact.save();

    // 1. Email to user (sender)
    const clientEmailContent = `
    <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif; line-height: 1.6; color: #333333;">
      <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(0, 0, 0, 0.05); margin: 20px auto;">
        <tr>
          <td style="padding: 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  <h2 style="margin: 0; font-size: 28px; font-weight: bold;">Quote Request Received</h2>
                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 20px 30px;">
                  <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hi ${name},</p>
                  <p style="margin-bottom: 15px; font-size: 16px;">Thank you for contacting Cargo Realm and Logistics. We have received your quote request and will get back to you as soon as possible.</p>
                  <p style="margin-bottom: 15px; font-size: 16px;">Your message:</p>
                  <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555; font-style: italic;">
                    <p>${message}</p>
                  </blockquote>
                  <p style="margin-top: 25px; margin-bottom: 0; font-size: 16px;">Sincerely,</p>
                  <p style="margin-top: 5px; margin-bottom: 0; font-size: 16px; font-weight: bold;">Cargo Realm and Logistics Team</p>
                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #777777;">
                  <p style="margin: 0;">This is an automated email. Please do not reply to this email.</p>
                    <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Cargo Realm and Logistics. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `;
    await sendMail(email, 'Quote Request Received - Cargo Realm and Logistics', clientEmailContent);

    // 2. Fetch all admin users
    const adminUsers = await User.find({ role: 'admin' });
    const adminEmails = adminUsers.map(admin => admin.email);

    if (adminEmails.length > 0) {
      // 3. Email to all admins - Using the styled template concept
      const adminEmailContent = `
      <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif; line-height: 1.6; color: #333333;">
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(0, 0, 0, 0.05); margin: 20px auto;">
          <tr>
            <td style="padding: 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: bold;">Admin Alert: New Quote Request Submission</h2>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 20px 30px;">
                    <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">A new quote request has been submitted:</p>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse; font-size: 15px;">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Sender Name:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Sender Email:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Phone Number:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${phoneNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Contact ID:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${contact._id}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 8px 0;"></td>
                      </tr>
                    </table>

                    <p style="margin-top: 20px; margin-bottom: 15px; font-size: 16px;">Message:</p>
                      <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555; font-style: italic;">
                        <p>${message}</p>
                      </blockquote>

                    <p style="margin-top: 25px; margin-bottom: 0; text-align: center;">
                      <a href="${process.env.ADMIN_PANEL_URL || 'https://cargorealmandlogistics.com/app/account/contactformresponses'}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Log in to Admin Panel
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #777777;">
                    <p style="margin: 0;">This is an automated alert. Please do not reply to this email.</p>
                    <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Cargo Realm and Logistics. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      `;
      await sendMail(adminEmails.join(','), 'New Quote Request Submission', adminEmailContent);
      console.log(`Email sent to admins: ${adminEmails.join(', ')}`);
    } else {
      console.warn('No admin users found to send new quote request notification.');
    }

    res.status(201).json(contact);
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllContactForms = async (req, res) => {
  try {
    // Populate repliedBy field to show who replied
    const contacts = await ContactForm.find().populate('repliedBy', 'name email').sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching all contact forms:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.editContactForm = async (req, res) => {
  try {
    const contact = await ContactForm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contact) return res.status(404).json({ message: 'Contact form not found' });
    res.json(contact);
  } catch (err) {
    console.error('Error editing contact form:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteContactForm = async (req, res) => {
  try {
    const contact = await ContactForm.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact form not found' });
    res.json({ message: 'Contact form deleted' });
  } catch (err) {
    console.error('Error deleting contact form:', err);
    res.status(500).json({ message: err.message });
  }
};

// Function to reply to a contact form submission
exports.replyToContactForm = async (req, res) => {
  try {
    const { id } = req.params; // Contact form ID
    const { subject, replyContent } = req.body;

    const contactForm = await ContactForm.findById(id);
    if (!contactForm) {
      return res.status(404).json({ message: 'Contact form not found.' });
    }
    if (!contactForm.email) {
      return res.status(400).json({ message: 'Cannot reply: Sender email not available.' });
    }

    // Send email to the sender
    const emailContent = `
    <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif; line-height: 1.6; color: #333333;">
      <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(0, 0, 0, 0.05); margin: 20px auto;">
        <tr>
          <td style="padding: 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  <h2 style="margin: 0; font-size: 28px; font-weight: bold;">${subject}</h2>
                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 20px 30px;">
                  <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hi ${contactForm.name || 'Valued Member'},</p>
                  <p style="margin-bottom: 15px; font-size: 16px;">Thank you for your message. Here is a reply from Cargo Realm and Logistics:</p>
                  <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555; font-style: italic;">
                    <p>${replyContent}</p>
                  </blockquote>
                  <p style="margin-top: 20px; margin-bottom: 15px; font-size: 16px;">Original Message:</p>
                  <blockquote style="border-left: 4px solid #eee; margin: 0; padding-left: 10px; color: #777; font-style: italic;">
                    <p>${contactForm.message}</p>
                  </blockquote>
                  <p style="margin-top: 25px; margin-bottom: 0; font-size: 16px;">Sincerely,</p>
                  <p style="margin-top: 5px; margin-bottom: 0; font-size: 16px; font-weight: bold;">Cargo Realm and Logistics Team</p>
                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #777777;">
                  <p style="margin: 0;">This is an automated email. Please do not reply to this email.</p>
                  <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Cargo Realm and Logistics. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `;
    await sendMail(contactForm.email, subject, emailContent);

    // Update contact form status, repliedBy, and repliedAt
    contactForm.status = 'replied';
    contactForm.repliedBy = req.user.id; // User who is logged in and replying
    contactForm.repliedAt = new Date();
    await contactForm.save();

    res.json({ message: 'Reply sent successfully and contact form updated.', contactForm });

  } catch (err) {
    console.error('Error replying to contact form:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
