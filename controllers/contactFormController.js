const ContactForm = require('../models/ContactForm');
const sendMail = require('../utils/mailer');
const User = require('../models/User'); // Assuming User model is available for populating repliedBy

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phoneNumber, message } = req.body;
    const contact = new ContactForm({ name, email, phoneNumber, message });
    await contact.save();
    // Email to user (sender)
    await sendMail(email, 'Contact Form Received - CAC Lightway Assembly',
      `<p>Dear ${name},</p>
       <p>Thank you for contacting CAC Lightway Assembly. We have received your message and will get back to you as soon as possible.</p>
       <p>Your message:</p>
       <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
         <p>${message}</p>
       </blockquote>
       <p>Sincerely,</p>
       <p>The CAC Lightway Team</p>`
    );
    // Email to admin
    await sendMail(process.env.EMAIL_USER, 'New Contact Form Submission',
      `<p>New message from ${name} (${email}):</p>
       <p>Phone: ${phoneNumber || 'N/A'}</p>
       <p>Message:</p>
       <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
         <p>${message}</p>
       </blockquote>
       <p>Contact ID: ${contact._id}</p>
       <p>Please log in to the admin panel to reply.</p>`
    );
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
      <p>Dear ${contactForm.name || 'Valued Member'},</p>
      <p>Thank you for your message. Here is a reply from CAC Lightway Assembly:</p>
      <blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
        <p>${replyContent}</p>
      </blockquote>
      <p>Original Message:</p>
      <blockquote style="border-left: 4px solid #eee; margin: 0; padding-left: 10px; color: #777;">
        <p>${contactForm.message}</p>
      </blockquote>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
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
