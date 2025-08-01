const Donation = require('../models/Donation');
const sendMail = require('../utils/mailer');

exports.createDonation = async (req, res) => {
  try {
    const { name, email, amount, phoneNumber, address, message, isAnonymous } = req.body;

    // Construct donation data, respecting anonymity
    const donationData = { amount, status: 'pending' };
    if (!isAnonymous) {
      donationData.name = name;
      donationData.email = email;
      donationData.phoneNumber = phoneNumber;
      donationData.address = address;
    }
    donationData.message = message; // Message can always be included
    donationData.isAnonymous = isAnonymous; // Ensure this is saved

    const donation = new Donation(donationData);
    await donation.save();

    // Church account details (should come from secure config/env variables)
    // Make sure these are defined in your .env file or config
    const churchAccountDetails = {
      bankName: process.env.CHURCH_BANK_NAME || 'Your Bank Name',
      accountNumber: process.env.CHURCH_ACCOUNT_NUMBER || 'XXXXXXXXXX',
      accountName: process.env.CHURCH_ACCOUNT_NAME || 'CAC Lightway Assembly',
    };

    // Prepare email content for donor
    let donorEmailContent = `<p>Thank you for your generous donation to CAC Lightway Assembly, ${isAnonymous ? 'Anonymous Donor' : (name || 'Valued Donor')}!</p>
    <p>Your support is greatly appreciated.</p>
    <p>Please make your donation transfer to the following account details:</p>
    <ul>
      <li><strong>Bank Name:</strong> ${churchAccountDetails.bankName}</li>
      <li><strong>Account Name:</strong> ${churchAccountDetails.accountName}</li>
      <li><strong>Account Number:</strong> ${churchAccountDetails.accountNumber}</li>
    </ul>
    <p>May God bless you abundantly.</p>
    <p>Sincerely,</p>
    <p>The CAC Lightway Team</p>`;

    // Send email to donor (if email provided, regardless of anonymity for confirmation)
    if (email) {
      await sendMail(email, 'Thank You for Your Donation - CAC Lightway Assembly', donorEmailContent);
    }

    // Send email to admin
    await sendMail(process.env.EMAIL_USER, 'New Donation Received for CAC Lightway Assembly',
      `<p>New donation from ${isAnonymous ? 'Anonymous' : (name || 'N/A')}: ₦${amount}</p>
       <p>Email: ${isAnonymous ? 'N/A' : (email || 'N/A')}</p>
       <p>Phone: ${isAnonymous ? 'N/A' : (phoneNumber || 'N/A')}</p>
       <p>Address: ${isAnonymous ? 'N/A' : (address || 'N/A')}</p>
       <p>Message: ${message || 'N/A'}</p>
       <p>Donation ID: ${donation._id}</p>
       <p>Status: ${donation.status}</p>`
    );

    // Return the church account details along with the donation confirmation
    res.status(201).json({
      message: 'Donation recorded successfully. Please use the details provided to complete your transfer.',
      donation: donation,
      churchAccountDetails: churchAccountDetails // <-- Include details here for frontend display
    });
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ message: err.message });
  }
};exports.createDonation = async (req, res) => {
  try {
    const { name, email, amount, phoneNumber, address, message, isAnonymous } = req.body;

    // Construct donation data, respecting anonymity
    const donationData = { amount, status: 'pending' };
    if (!isAnonymous) {
      donationData.name = name;
      donationData.email = email;
      donationData.phoneNumber = phoneNumber;
      donationData.address = address;
    }
    donationData.message = message; // Message can always be included
    donationData.isAnonymous = isAnonymous; // Ensure this is saved

    const donation = new Donation(donationData);
    await donation.save();

    // Church account details (should come from secure config/env variables)
    // Make sure these are defined in your .env file or config
    const churchAccountDetails = {
      bankName: process.env.CHURCH_BANK_NAME || 'Your Bank Name',
      accountNumber: process.env.CHURCH_ACCOUNT_NUMBER || 'XXXXXXXXXX',
      accountName: process.env.CHURCH_ACCOUNT_NAME || 'CAC Lightway Assembly',
      // Add any other relevant details like swift code, bank address etc.
    };

    // Prepare email content for donor
    let donorEmailContent = `<p>Thank you for your generous donation to CAC Lightway Assembly, ${isAnonymous ? 'Anonymous Donor' : (name || 'Valued Donor')}!</p>
                             <p>Your support is greatly appreciated.</p>
                             <p>Please make your donation transfer to the following account details:</p>
                             <ul>
                               <li><strong>Bank Name:</strong> ${churchAccountDetails.bankName}</li>
                               <li><strong>Account Name:</strong> ${churchAccountDetails.accountName}</li>
                               <li><strong>Account Number:</strong> ${churchAccountDetails.accountNumber}</li>
                             </ul>
                             <p>May God bless you abundantly.</p>
                             <p>Sincerely,</p>
                             <p>The CAC Lightway Team</p>`;

    // Send email to donor (if email provided, regardless of anonymity for confirmation)
    if (email) {
      await sendMail(email, 'Thank You for Your Donation - CAC Lightway Assembly', donorEmailContent);
    }

    // Send email to admin
    await sendMail(process.env.EMAIL_USER, 'New Donation Received',
      `<p>New donation from ${isAnonymous ? 'Anonymous' : (name || 'N/A')}: $${amount}</p>
       <p>Email: ${isAnonymous ? 'N/A' : (email || 'N/A')}</p>
       <p>Phone: ${isAnonymous ? 'N/A' : (phoneNumber || 'N/A')}</p>
       <p>Address: ${isAnonymous ? 'N/A' : (address || 'N/A')}</p>
       <p>Message: ${message || 'N/A'}</p>
       <p>Donation ID: ${donation._id}</p>
       <p>Status: ${donation.status}</p>`
    );

    // Return the church account details along with the donation confirmation
    res.status(201).json({
      message: 'Donation recorded successfully. Please use the details provided to complete your transfer.',
      donation: donation,
      churchAccountDetails: churchAccountDetails // <-- Include details here for frontend display
    });
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeDonationStatus = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendEmailToDonor = async (req, res) => {
  try {
    const { id } = req.params; // Donation ID
    const { subject, content } = req.body;

    const donation = await Donation.findById(id);
    if (!donation || !donation.email) {
      return res.status(404).json({ message: 'Donation record not found or donor email not available.' });
    }

    await sendMail(donation.email, subject, content);
    res.json({ message: `Email sent to ${donation.email} successfully!` });
  } catch (err) {
    console.error('Error sending email to donor:', err);
    res.status(500).json({ message: err.message });
  }
};
