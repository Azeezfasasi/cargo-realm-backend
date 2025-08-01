const Appointment = require('../models/Appointment');
const sendMail = require('../utils/mailer');
const User = require('../models/User'); 

// Helper to format date for emails
const formatDateForEmail = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

exports.createAppointment = async (req, res) => {
  try {
    const { name, email, phoneNumber, address, country, state, message, appointmentDate, appointmentTime } = req.body;

    // Basic validation
    if (!name || !email || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Name, email, appointment date, and time are required.' });
    }

    const newAppointment = new Appointment({
      name,
      email,
      phoneNumber,
      address,
      country,
      state,
      message,
      appointmentDate,
      appointmentTime,
      bookedBy: req.user ? req.user.id : null, // Capture user ID if logged in
      status: 'pending' // Default status
    });

    await newAppointment.save();

    // --- Send Confirmation Email to User ---
    const userEmailContent = `
      <p>Dear ${name},</p>
      <p>Thank you for booking an appointment with CAC Lightway Assembly.</p>
      <p>Your appointment details are:</p>
      <ul>
        <li><strong>Date:</strong> ${formatDateForEmail(appointmentDate)}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
        <li><strong>Status:</strong> Pending (awaiting confirmation from church staff)</li>
      </ul>
      <p>We will review your request and get back to you shortly.</p>
      <p>For any inquiries, please reply to this email or call us.</p>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
    `;
    await sendMail(email, 'Your Appointment Request with CAC Lightway Assembly', userEmailContent);

    // --- Send Notification Email to Admin ---
    const adminEmailContent = `
      <p>New Appointment Request Received!</p>
      <p>Details:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phoneNumber || 'N/A'}</li>
        <li><strong>Date:</strong> ${formatDateForEmail(appointmentDate)}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
        <li><strong>Message:</strong> ${message || 'N/A'}</li>
        <li><strong>Booked By (User ID):</strong> ${req.user ? req.user.id : 'Visitor'}</li>
        <li><strong>Appointment ID:</strong> ${newAppointment._id}</li>
      </ul>
      <p>Please log in to the admin panel to review and confirm this appointment.</p>
    `;
    await sendMail(process.env.EMAIL_USER, 'New Appointment Request | CAC Lightway Assembly', adminEmailContent);

    res.status(201).json({
      message: 'Appointment request submitted successfully. Check your email for confirmation.',
      appointment: newAppointment
    });

  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('bookedBy', 'name email') // Populate who booked it if a logged-in user
      .populate('cancelledBy', 'name email') // Populate who cancelled it
      .sort({ appointmentDate: 1, appointmentTime: 1 }); 
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching all appointments:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getMyAppointments = async (req, res) => { // <-- NEW FUNCTION
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const appointments = await Appointment.find({ bookedBy: req.user.id })
      .populate('bookedBy', 'name email')
      .populate('cancelledBy', 'name email')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching user appointments:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('bookedBy', 'name email')
      .populate('cancelledBy', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Authorization: Only admin/pastor or the user who booked it can view
    if (req.user.role !== 'admin' && req.user.role !== 'pastor' &&
        (appointment.bookedBy && appointment.bookedBy.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this appointment.' });
    }

    res.json(appointment);
  } catch (err) {
    console.error('Error fetching appointment by ID:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { name, email, phoneNumber, address, country, state, message, appointmentDate, appointmentTime, status } = req.body;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { name, email, phoneNumber, address, country, state, message, appointmentDate, appointmentTime, status },
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.json({ message: 'Appointment updated successfully.', appointment: updatedAppointment });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Optional: Send email notification about deletion
    const emailContent = `
      <p>Dear ${deletedAppointment.name},</p>
      <p>Your appointment scheduled for ${formatDateForEmail(deletedAppointment.appointmentDate)} at ${deletedAppointment.appointmentTime} has been deleted by church staff.</p>
      <p>If you have any questions, please contact us.</p>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
    `;
    await sendMail(deletedAppointment.email, 'Your Appointment Has Been Deleted', emailContent);

    res.json({ message: 'Appointment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { newAppointmentDate, newAppointmentTime } = req.body;

    if (!newAppointmentDate || !newAppointmentTime) {
      return res.status(400).json({ message: 'New appointment date and time are required for rescheduling.' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Store old details before updating
    const oldDate = appointment.appointmentDate;
    const oldTime = appointment.appointmentTime;

    appointment.rescheduledFrom = { date: oldDate, time: oldTime };
    appointment.appointmentDate = newAppointmentDate;
    appointment.appointmentTime = newAppointmentTime;
    appointment.status = 'rescheduled'; // Set status to rescheduled

    await appointment.save();

    // --- Send Reschedule Confirmation Email to User ---
    const userEmailContent = `
      <p>Dear ${appointment.name},</p>
      <p>Your appointment with CAC Lightway Assembly has been rescheduled.</p>
      <p><strong>Original Appointment:</strong> ${formatDateForEmail(oldDate)} at ${oldTime}</p>
      <p><strong>New Appointment Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${formatDateForEmail(newAppointmentDate)}</li>
        <li><strong>Time:</strong> ${newAppointmentTime}</li>
        <li><strong>Status:</strong> Rescheduled</li>
      </ul>
      <p>We look forward to seeing you at the new time.</p>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
    `;
    await sendMail(appointment.email, 'Your Appointment Has Been Rescheduled', userEmailContent);

    // --- Send Notification Email to Admin ---
    const adminEmailContent = `
      <p>Appointment Rescheduled!</p>
      <p>Details for Appointment ID: ${appointment._id}</p>
      <ul>
        <li><strong>Donor:</strong> ${appointment.name} (${appointment.email})</li>
        <li><strong>Original:</strong> ${formatDateForEmail(oldDate)} at ${oldTime}</li>
        <li><strong>New:</strong> ${formatDateForEmail(newAppointmentDate)} at ${newAppointmentTime}</li>
        <li><strong>Rescheduled By (User ID):</strong> ${req.user ? req.user.id : 'Visitor'}</li>
      </ul>
    `;
    await sendMail(process.env.EMAIL_USER, 'Appointment Rescheduled Notification', adminEmailContent);

    res.json({ message: 'Appointment rescheduled successfully.', appointment });
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user ? req.user.id : null; // Record who cancelled if logged in

    await appointment.save();

    // --- Send Cancellation Confirmation Email to User ---
    const userEmailContent = `
      <p>Dear ${appointment.name},</p>
      <p>Your appointment with CAC Lightway Assembly scheduled for ${formatDateForEmail(appointment.appointmentDate)} at ${appointment.appointmentTime} has been cancelled.</p>
      <p>If you have any questions or wish to rebook, please contact us.</p>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
    `;
    await sendMail(appointment.email, 'Your Appointment Has Been Cancelled', userEmailContent);

    // --- Send Notification Email to Admin ---
    const adminEmailContent = `
      <p>Appointment Cancelled!</p>
      <p>Details for Appointment ID: ${appointment._id}</p>
      <ul>
        <li><strong>Donor:</strong> ${appointment.name} (${appointment.email})</li>
        <li><strong>Original Date:</strong> ${formatDateForEmail(appointment.appointmentDate)}</li>
        <li><strong>Original Time:</strong> ${appointment.appointmentTime}</li>
        <li><strong>Cancelled By (User ID):</strong> ${req.user ? req.user.id : 'Visitor'}</li>
      </ul>
    `;
    await sendMail(process.env.EMAIL_USER, 'Appointment Cancelled Notification', adminEmailContent);


    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.changeAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    // Optional: Send email notification about status change
    let emailSubject = `Your Appointment Status Updated to: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    let emailContent = `
      <p>Dear ${appointment.name},</p>
      <p>The status of your appointment scheduled for ${formatDateForEmail(appointment.appointmentDate)} at ${appointment.appointmentTime} has been updated from '${oldStatus}' to '${status}'.</p>
      <p>Please log in to your portal or contact us for more details.</p>
      <p>Sincerely,</p>
      <p>The CAC Lightway Team</p>
    `;

    if (appointment.email) {
      await sendMail(appointment.email, emailSubject, emailContent);
    }

    res.json({ message: `Appointment status changed to ${status}.`, appointment });
  } catch (err) {
    console.error('Error changing appointment status:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
