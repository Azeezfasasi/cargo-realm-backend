const Shipment = require('../models/Shipment');
const sendMail = require('../utils/mailer');
const User = require('../models/User'); 

// Helper function to send email notifications
const sendShipmentNotification = async (shipment, subject, body) => {
  try {
    if (!shipment.sender) {
      console.error('Shipment has no sender. Skipping email notification.');
      return;
    }

    // Fetch the sender's email address using the User model
    const sender = await User.findById(shipment.sender);
    if (!sender || !sender.email) {
      console.error('Sender not found or email is missing. Skipping email notification.');
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
    console.log(`Email sent to ${emailTo} successfully.`);
  } catch (error) {
    console.error('Failed to send email notification:', error);
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
    
    // --- EMAIL NOTIFICATION: SHIPMENT CREATED ---
    const subject = `New Shipment Created: #${savedShipment.trackingNumber}`;
    const body = `A new shipment has been created for you with the tracking number ${savedShipment.trackingNumber}.`;
    await sendShipmentNotification(savedShipment, subject, body);
    
    res.status(201).json(savedShipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 5. Edit a shipment (Admin/Client)
exports.editShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if user is an admin or the sender of the shipment
    const isAuthorized = req.user.role === 'admin' || shipment.sender.toString() === req.user.id;
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own shipments.' });
    }

    const updatedShipment = await Shipment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    // --- EMAIL NOTIFICATION: SHIPMENT EDITED ---
    const subject = `Shipment Updated: #${updatedShipment.trackingNumber}`;
    const body = `Details for your shipment with tracking number ${updatedShipment.trackingNumber} have been updated.`;
    await sendShipmentNotification(updatedShipment, subject, body);
    
    res.json(updatedShipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 6. Delete a shipment (Admin only)
exports.deleteShipment = async (req, res) => {
  try {
    // `adminAuth` middleware handles role checking
    const { id } = req.params;
    const shipment = await Shipment.findByIdAndDelete(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    
    // --- EMAIL NOTIFICATION: STATUS CHANGED ---
    const subject = `Status Update for Shipment: #${updatedShipment.trackingNumber}`;
    const body = `The status of your shipment has been changed to **${updatedShipment.status}**.`;
    await sendShipmentNotification(updatedShipment, subject, body);
    
    res.json(updatedShipment);
  } catch (err) {
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

// 11. Reply to shipment (simple notes addition)
exports.replyToShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const updatedNotes = shipment.notes ? `${shipment.notes}\n---\nReply: ${note}` : `Reply: ${note}`;
    const updatedShipment = await Shipment.findByIdAndUpdate(id, { notes: updatedNotes }, { new: true });
    
    // --- EMAIL NOTIFICATION: SHIPMENT REPLY ---
    const subject = `New Reply for Shipment: #${updatedShipment.trackingNumber}`;
    const body = `A new reply has been added to your shipment with tracking number ${updatedShipment.trackingNumber}. The new note is: "${note}".`;
    await sendShipmentNotification(updatedShipment, subject, body);
    
    res.json(updatedShipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
