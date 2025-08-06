const Shipment = require('../models/Shipment');
const sendMail = require('../utils/mailer');
const User = require('../models/User'); 

// Helper function to send email notifications to the shipment sender (client)
const sendClientNotification = async (shipment, subject, body) => {
  try {
    if (!shipment.sender) {
      console.error('Shipment has no sender. Skipping client email notification.');
      return;
    }

    // Fetch the sender's email address using the User model
    // Populate sender to get the email if it's not already populated
    const sender = await User.findById(shipment.sender);
    if (!sender || !sender.email) {
      console.error('Sender not found or email is missing. Skipping client email notification.');
      return;
    }

    const emailTo = sender.email;
    const htmlBody = `
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
                <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hello,</p>
                <p style="margin-bottom: 15px; font-size: 16px;">${body}</p>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse; font-size: 15px;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Tracking Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Current Status:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.status}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 0;"></td>
                  </tr>
                </table>

                <p style="margin-top: 25px; margin-bottom: 0; text-align: center;">
                  <a href="${process.env.CLIENT_TRACKING_URL || '#'}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Track Your Shipment
                  </a>
                </p>

                <p style="margin-top: 25px; margin-bottom: 0; font-size: 16px;">Thank you for using our service.</p>
                  <p style="margin-top: 5px; margin-bottom: 0; font-size: 16px; font-weight: bold;">The Cargo Realm Team</p>
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
    `;

    await sendMail(emailTo, subject, htmlBody);
    console.log(`Client email sent to ${emailTo} successfully.`);
  } catch (error) {
    console.error('Failed to send client email notification:', error);
  }
};

// Helper function to send email notifications to all admin users
const sendAdminNotification = async (shipment, subject, adminBody, reqUser = null) => {
  try {
    // Find all users with the 'admin' role
    const admins = await User.find({ role: 'admin' });

    if (!admins || admins.length === 0) {
      console.warn('No admin users found to send notification.');
      return;
    }

    const adminEmails = admins
      .map(admin => admin.email)
      .filter(email => email); // Filter out null/undefined emails

    if (adminEmails.length === 0) {
      console.warn('No valid admin email addresses found to send notification.');
      return;
    }

    // Attempt to get sender details for admin email if available
    let senderDetails = '';
    if (shipment.sender) {
        const sender = await User.findById(shipment.sender);
        if (sender) {
            senderDetails = `by user ${sender.fullName || sender.email}`;
        }
    }

    const htmlBody = `
      <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 0 15px rgba(0, 0, 0, 0.05); margin: 20px auto;">
        <tr>
          <td style="padding: 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  <h2 style="margin: 0; font-size: 28px; font-weight: bold;">Admin Alert: ${subject}</h2>
                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 20px 30px;">
                  <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">${adminBody} ${senderDetails}.</p>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse; font-size: 15px;">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Tracking Number:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.trackingNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Current Status:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.status}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Sender Name:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.senderName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Sender Email:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.senderEmail || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Recipient Name:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.recipientName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Receiver Email:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.receiverEmail || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Origin:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.origin || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Destination:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.destination || 'N/A'}</td>
                    </tr>
                      ${reqUser ? `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Action Performed By:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${reqUser.email} (Role: ${reqUser.role})</td>
                    </tr>` : ''}
                                
                    <tr>
                      <td colspan="2" style="padding: 8px 0;"></td>
                    </tr>
                  </table>

                  <p style="margin-top: 25px; margin-bottom: 0; text-align: center;">
                    <a href="${process.env.ADMIN_PANEL_URL || 'https://cargorealmandlogistics.com/app/dashboard'}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px;">
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
    `;

    // Send email to each admin
    for (const email of adminEmails) {
      await sendMail(email, `Admin Notification: ${subject}`, htmlBody);
      console.log(`Admin email sent to ${email} successfully.`);
    }

  } catch (error) {
    console.error('Failed to send admin email notification:', error);
  }
};


// 1. Fetch all shipments (Admin/Agent/Employee)
exports.getAllShipments = async (req, res) => {
  try {
    // Allow 'admin', employee and 'agent' to see all shipments
    const allowedRoles = ['admin', 'agent', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only Admins, Agents, and Employees can view all shipments.' });
    }
    const shipments = await Shipment.find().populate('sender', 'email');
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Fetch My shipments (Client)
exports.getMyShipments = async (req, res) => {
  try {
    // Find shipments where the authenticated user is the sender
    const shipments = await Shipment.find({ sender: req.user.id }).populate('sender', 'email');
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Track a shipment (Public)
exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const shipment = await Shipment.findOne({ trackingNumber }).select('-sender'); // Do not expose sender info publicly
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Create a new shipment (Admin only)
exports.createShipment = async (req, res) => {
  try {
    // `authMiddleware` and `adminAuth` ensure only admins can reach this.
    const newShipment = new Shipment(req.body);
    const savedShipment = await newShipment.save();
    
    // --- EMAIL NOTIFICATION: SHIPMENT CREATED (Client) ---
    const clientSubject = `New Shipment Created: #${savedShipment.trackingNumber}`;
    const clientBody = `A new shipment has been created for you with the tracking number ${savedShipment.trackingNumber}.`;
    await sendClientNotification(savedShipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: SHIPMENT CREATED (Admin) ---
    const adminSubject = `New Shipment Created: #${savedShipment.trackingNumber}`;
    const adminBody = `A new shipment has been created in the system`;
    await sendAdminNotification(savedShipment, adminSubject, adminBody, req.user); // Pass req.user for audit trail
    
    res.status(201).json(savedShipment);
  } catch (err) {
    console.error('Error creating shipment:', err); // Added detailed logging
    res.status(400).json({ message: err.message });
  }
};

// 5. Edit a shipment (Admin/Client)
exports.editShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id).populate('sender', 'name email'); // Populate email for notification
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user is an admin or the sender of the shipment
    const isAuthorized = req.user.role === 'admin' || shipment.sender.toString() === req.user.id;
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own shipments.' });
    }

    const updatedShipment = await Shipment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    // --- EMAIL NOTIFICATION: SHIPMENT EDITED (Client) ---
    const clientSubject = `Shipment Updated: #${updatedShipment.trackingNumber}`;
    const clientBody = `Details for your shipment with tracking number ${updatedShipment.trackingNumber} have been updated.`;
    await sendClientNotification(updatedShipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: SHIPMENT EDITED (Admin) ---
    const adminSubject = `Shipment Updated: #${updatedShipment.trackingNumber}`;
    const adminBody = `Shipment details for #${updatedShipment.trackingNumber} have been updated in the system`;
    await sendAdminNotification(updatedShipment, adminSubject, adminBody, req.user);
    
    res.json(updatedShipment);
  } catch (err) {
    console.error('Error editing shipment:', err); // Added detailed logging
    res.status(400).json({ message: err.message });
  }
};

// 6. Delete a shipment (Admin only)
exports.deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Shipment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    // Optionally, send notification to sender and admins about deletion
    // This would require fetching the sender's email before deletion
    res.status(200).json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipment:', error); // Added detailed logging
    res.status(500).json({ message: error.message });
  }
};

// 7. Change shipment status (Admin/Agent)
exports.changeShipmentStatus = async (req, res) => {
  try {    
    // Allow 'admin', 'employee and 'agent' to change status
    const allowedRoles = ['admin', 'agent', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only Admins, employees and Agents can change shipment status.' });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    const updatedShipment = await Shipment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!updatedShipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    // --- EMAIL NOTIFICATION: STATUS CHANGED (Client) ---
    const clientSubject = `Status Update for Shipment: #${updatedShipment.trackingNumber}`;
    const clientBody = `The status of your shipment has been changed to **${updatedShipment.status}**.`;
    await sendClientNotification(updatedShipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: STATUS CHANGED (Admin) ---
    const adminSubject = `Status Changed for Shipment: #${updatedShipment.trackingNumber} to ${updatedShipment.status}`;
    const adminBody = `The status of shipment #${updatedShipment.trackingNumber} has been updated to **${updatedShipment.status}**`;
    await sendAdminNotification(updatedShipment, adminSubject, adminBody, req.user);
    
    res.json(updatedShipment);
  } catch (err) {
    console.error('Error changing shipment status:', err); // Added detailed logging
    res.status(400).json({ message: err.message });
  }
};

// 8. Print shipment (Placeholder)
exports.printShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: `Placeholder for printing shipment ${id}.`, shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 9. Generate invoice (Placeholder)
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: `Placeholder for generating invoice for shipment ${id}.`, shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 10. Generate waybill (Placeholder)
exports.generateWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: `Placeholder for generating waybill for shipment ${id}.`, shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 11. Reply to shipment (push to replies array)
exports.replyToShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body; // Assuming the frontend sends the message

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Ensure req.user is available from authentication middleware
    const reply = {
      message,
      user: req.user.id, // Assign the ID of the authenticated user who is replying
      timestamp: new Date()
    };

    shipment.replies.push(reply);
    await shipment.save();

    // --- EMAIL NOTIFICATION: NEW REPLY (Client) ---
    const clientSubject = `New Reply for Shipment: #${shipment.trackingNumber}`;
    const clientBody = `A new reply has been added to your shipment with tracking number ${shipment.trackingNumber}. The message is: "${message}".`;
    await sendClientNotification(shipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: NEW REPLY (Admin) ---
    const adminSubject = `New Reply on Shipment: #${shipment.trackingNumber}`;
    const adminBody = `A new reply has been posted on shipment #${shipment.trackingNumber} by ${req.user.email}. Message: "${message}"`;
    await sendAdminNotification(shipment, adminSubject, adminBody, req.user);

    res.json(shipment);
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ message: err.message });
  }
};
