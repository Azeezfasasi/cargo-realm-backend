// const Shipment = require('../models/Shipment');
// const sendMail = require('../utils/mailer');
// const User = require('../models/User');

// // Helper function to send email notifications
// // const sendShipmentNotification = async (shipment, subject, body) => {
// //   try {
// //     if (!shipment.sender) {
// //       console.error('Shipment has no sender. Skipping email notification.');
// //       return;
// //     }

// //     // Fetch the sender's email address using the User model
// //     const sender = await User.findById(shipment.sender);
// //     if (!sender || !sender.email) {
// //       console.error('Sender not found or email is missing. Skipping email notification.');
// //       return;
// //     }

// //     const emailTo = sender.email;
// //     const htmlBody = `
// //       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
// //         <h2 style="color: #0056b3;">${subject}</h2>
// //         <p>Hello,</p>
// //         <p>${body}</p>
// //         <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
// //         <p><strong>Current Status:</strong> ${shipment.status}</p>
// //         <p>Thank you for using our service.</p>
// //         <p>The Cargo Realm Team</p>
// //       </div>
// //     `;

// //     await sendMail(emailTo, subject, htmlBody);
// //     console.log(`Email sent to ${emailTo} successfully.`);
// //   } catch (error) {
// //     console.error('Failed to send email notification:', error);
// //   }
// // };

// const sendShipmentNotification = async (shipment, subject, body) => {
//   try {
//     if (!shipment.sender) {
//       console.error('Shipment has no sender. Skipping email notification.');
//       return;
//     }

//     const sender = await User.findById(shipment.sender);
//     if (!sender || !sender.email) {
//       console.error('Sender not found or email is missing. Skipping email notification.');
//       return;
//     }

//     const senderEmail = sender.email;

//     // const sender = await User.findById(savedShipment.sender);
//     // Get admin emails from env and format into array
//     // const adminEmails = process.env.ADMIN_EMAILS
//     //   ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim())
//     //   : [];
//     const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

//     // Compose HTML body
//     const htmlBody = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//         <h2 style="color: #0056b3;">${subject}</h2>
//         <p>Hello,</p>
//         <p>${body}</p>
//         <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
//         <p><strong>Current Status:</strong> ${shipment.status}</p>
//         <p>Thank you for using our service.</p>
//         <p>The Cargo Realm Team</p>
//       </div>
//     `;

//     // Send email to sender and admins
//     const recipients = [senderEmail, ...adminEmails];

//     await sendMail(recipients, subject, htmlBody);
//     console.log(`Email sent to sender and admins: ${recipients.join(', ')}`);
//   } catch (error) {
//     console.error('Failed to send email notification:', error);
//   }
// };

// // 1. Fetch all shipments (Admin/Agent/Employee)
// exports.getAllShipments = async (req, res) => {
//   try {
//     // Allow 'admin', employee and 'agent' to see all shipments
//     const allowedRoles = ['admin', 'agent', 'employee'];
//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied. Only Admins, Agents, and Employees can view all shipments.' });
//     }
//     const shipments = await Shipment.find().populate('sender', 'email');
//     res.json(shipments);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 2. Fetch My shipments (Client)
// exports.getMyShipments = async (req, res) => {
//   try {
//     // Find shipments where the authenticated user is the sender
//     const shipments = await Shipment.find({ sender: req.user.id }).populate('sender', 'email');
//     res.json(shipments);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 3. Track a shipment (Public)
// exports.trackShipment = async (req, res) => {
//   try {
//     const { trackingNumber } = req.params;
//     const shipment = await Shipment.findOne({ trackingNumber }).select('-sender'); // Do not expose sender info publicly
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
//     res.json(shipment);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 4. Create a new shipment (Admin only)
// exports.createShipment = async (req, res) => {
//   try {
//     // `authMiddleware` and `adminAuth` ensure only admins can reach this.
//     const newShipment = new Shipment(req.body);
//     const savedShipment = await newShipment.save();
    
//     // --- EMAIL NOTIFICATION: SHIPMENT CREATED ---
//     const subject = `New Shipment Created: #${savedShipment.trackingNumber}`;
//     const body = `A new shipment has been created for you with the tracking number ${savedShipment.trackingNumber}.`;
//     await sendShipmentNotification(savedShipment, subject, body);

//     // --- EMAIL NOTIFICATION: ADMIN NOTIFICATION ---
//     const adminSubject = `Admin Notification: New Shipment Created #${shipment.trackingNumber}`;
//     const adminBody = `<p>Shipment was created by user ${sender.name} (${sender.email}).</p>`;
//     await sendMail(adminEmails, adminSubject, adminBody);

    
//     res.status(201).json(savedShipment);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // 5. Edit a shipment (Admin/Client)
// exports.editShipment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const shipment = await Shipment.findById(id).populate('sender', 'name');
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }

//     // Check if user is an admin or the sender of the shipment
//     const isAuthorized = req.user.role === 'admin' || shipment.sender.toString() === req.user.id;
//     if (!isAuthorized) {
//       return res.status(403).json({ message: 'Access denied. You can only edit your own shipments.' });
//     }

//     const updatedShipment = await Shipment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
//     // --- EMAIL NOTIFICATION: SHIPMENT EDITED ---
//     const subject = `Shipment Updated: #${updatedShipment.trackingNumber}`;
//     const body = `Details for your shipment with tracking number ${updatedShipment.trackingNumber} have been updated.`;
//     await sendShipmentNotification(updatedShipment, subject, body);

//     // --- EMAIL NOTIFICATION: ADMIN NOTIFICATION ---
//     const adminSubject = `Admin Notification: Shipment updated #${shipment.trackingNumber}`;
//     const adminBody = `<p>Shipment with tracking number ${updatedShipment.trackingNumber} by user ${sender.name} (${sender.email}) has been updated.</p>`;
//     await sendMail(adminEmails, adminSubject, adminBody);

//     res.json(updatedShipment);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // 6. Delete a shipment (Admin only)
// exports.deleteShipment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await Shipment.findByIdAndDelete(id);
//     if (!deleted) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
//     res.status(200).json({ message: 'Shipment deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 7. Change shipment status (Admin/Agent)
// exports.changeShipmentStatus = async (req, res) => {
//   try {
//     // Allow 'admin', 'employee and 'agent' to change status
//     const allowedRoles = ['admin', 'agent', 'employee'];
//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied. Only Admins, employees and Agents can change shipment status.' });
//     }
    
//     const { id } = req.params;
//     const { status } = req.body;
//     const updatedShipment = await Shipment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
//     if (!updatedShipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
    
//     // --- EMAIL NOTIFICATION: STATUS CHANGED ---
//     const subject = `Status Update for Shipment: #${updatedShipment.trackingNumber}`;
//     const body = `The status of your shipment has been changed to **${updatedShipment.status}**.`;
//     await sendShipmentNotification(updatedShipment, subject, body);

//     // --- EMAIL NOTIFICATION: ADMIN NOTIFICATION ---
//     const adminSubject = `Status Update for Shipment: #${shipment.trackingNumber}`;
//     const adminBody = `<p>The status of shipment with tracking number ${updatedShipment.trackingNumber} by user ${sender.name} (${sender.email}) has been updated.</p>`;
//     await sendMail(adminEmails, adminSubject, adminBody);

    
//     res.json(updatedShipment);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // 8. Print shipment (Placeholder)
// exports.printShipment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const shipment = await Shipment.findById(id);
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
//     res.json({ message: `Placeholder for printing shipment ${id}.`, shipment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 9. Generate invoice (Placeholder)
// exports.generateInvoice = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const shipment = await Shipment.findById(id);
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
//     res.json({ message: `Placeholder for generating invoice for shipment ${id}.`, shipment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 10. Generate waybill (Placeholder)
// exports.generateWaybill = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const shipment = await Shipment.findById(id);
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }
//     res.json({ message: `Placeholder for generating waybill for shipment ${id}.`, shipment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 11. Reply to shipment (push to replies array)
// exports.replyToShipment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { message, userId } = req.body; // Assuming the frontend sends the message and userId

//     const shipment = await Shipment.findById(id);
//     if (!shipment) {
//       return res.status(404).json({ message: 'Shipment not found' });
//     }

//     const reply = {
//       message,
//       user: userId || null, // optional
//       timestamp: new Date()
//     };

//     shipment.replies.push(reply);
//     await shipment.save();

//     // Optional: send notification
//     const subject = `New Reply for Shipment: #${shipment.trackingNumber}`;
//     const body = `A new reply has been added to your shipment with tracking number ${shipment.trackingNumber}. The message is: "${message}".`;
//     await sendShipmentNotification(shipment, subject, body);

//     // Send notification to admin
//     const adminSubject = `New Reply for Shipment: #${shipment.trackingNumber}`;
//     const adminBody = `<p>A new reply has been added to the shipment with tracking number ${shipment.trackingNumber} for ${sender.name} (${sender.email}). The message is: "${message}".</p>`;
//     await sendMail(adminEmails, adminSubject, adminBody);


//     res.json(shipment);
//   } catch (err) {
//     console.error('Reply error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };


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
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">${subject}</h2>
        <p>Hello,</p>
        <p>${body}</p>
        <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
        <p><strong>Current Status:</strong> ${shipment.status}</p>
        <p>Thank you for using our service.</p>
        <p>The Cargo Realm Team</p>
      </div>
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
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #CC0000;">Admin Alert: ${subject}</h2>
        <p>${adminBody} ${senderDetails}.</p>
        <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
        <p><strong>Current Status:</strong> ${shipment.status}</p>
        <p><strong>Sender Name:</strong> ${shipment.senderName || 'N/A'}</p>
        <p><strong>Sender Email:</strong> ${shipment.senderEmail || 'N/A'}</p>
        <p><strong>Recipient Name:</strong> ${shipment.recipientName || 'N/A'}</p>
        <p><strong>Receiver Email:</strong> ${shipment.receiverEmail || 'N/A'}</p>
        <p><strong>Origin:</strong> ${shipment.origin || 'N/A'}</p>
        <p><strong>Destination:</strong> ${shipment.destination || 'N/A'}</p>
        ${reqUser ? `<p><strong>Action Performed By:</strong> ${reqUser.email} (Role: ${reqUser.role})</p>` : ''}
        <p>Please log in to the admin panel for more details.</p>
      </div>
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
