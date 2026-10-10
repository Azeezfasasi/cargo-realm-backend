const Shipment = require('../models/Shipment');
const ShipmentStatus = require('../models/ShipmentStatus');
const cloudinary = require('../utils/cloudinary');
const crypto = require('crypto');
const sendMail = require('../utils/mailer');
const User = require('../models/User');
const QRCode = require('qrcode');
const { waitUntil } = require('@vercel/functions');
const { sendShipmentCreationSMS, sendShipmentStatusUpdateSMS } = require('../utils/shipmentSmsHelper');

// Helper function to generate and save QR code for a shipment
const generateQRCodeForShipment = async (shipment) => {
  try {
    if (!shipment.trackingNumber) {
      console.error('Shipment has no tracking number. Cannot generate QR code.');
      return false;
    }

    // Don't regenerate if already exists
    if (shipment.qrCodeUrl) {
      return true;
    }

    // Construct the tracking URL with proper error handling
    const baseUrl = process.env.CLIENT_TRACKING_URL || process.env.FRONTEND_URL || 'https://tofarcargo.com';
    
    // Ensure baseUrl doesn't have trailing slash to avoid double slashes
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const trackingUrl = `${cleanBaseUrl}/app/trackshipment?tracking=${encodeURIComponent(shipment.trackingNumber)}`;
    
    console.log(`Generating QR code with URL: ${trackingUrl}`);
    
    // Verify URL is valid before encoding
    try {
      new URL(trackingUrl);
    } catch (urlError) {
      console.error('Invalid tracking URL:', trackingUrl, urlError);
      return false;
    }
    
    const qrCodeUrl = await QRCode.toDataURL(trackingUrl);
    shipment.qrCodeUrl = qrCodeUrl;
    await shipment.save();
    console.log(`QR code generated for shipment: ${shipment.trackingNumber}`);
    return true;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return false;
  }
};

// Helper function to send email notifications to the shipment sender (client)
const sendClientNotification = async (shipment, subject, body, externalEmail = null) => {
  try {
    let emailTo = null;
    
    // Determine email address: use external email if provided, otherwise fetch from linked user
    if (externalEmail) {
      emailTo = externalEmail;
    } else if (shipment.sender) {
      const sender = await User.findById(shipment.sender);
      if (!sender || !sender.email) {
        console.error('Sender not found or email is missing. Skipping client email notification.');
        return;
      }
      emailTo = sender.email;
    } else if (shipment.senderEmail) {
      emailTo = shipment.senderEmail;
    } else {
      console.error('No email found for shipment. Skipping client email notification.');
      return;
    }

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
                <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hello ${shipment.senderName},</p>
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
                  <a href="${process.env.CLIENT_TRACKING_URL || 'https://cargorealmandlogistics.com/app/trackshipment'}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px;">
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

// Helper function to send confirmation email to external senders (non-registered emails)
const sendExternalSenderConfirmation = async (shipment, email) => {
  try {
    if (!email) {
      console.error('No email provided for external sender confirmation.');
      return;
    }

    const subject = `Shipment Created: #${shipment.trackingNumber}`;
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
                <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hello ${shipment.senderName},</p>
                <p style="margin-bottom: 15px; font-size: 16px;">A new shipment has been created under your email address. You can track your shipment using the tracking number below.</p>

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
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Origin:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.origin || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Destination:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 60%; vertical-align: top;">${shipment.destination || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 0;"></td>
                  </tr>
                </table>

                <p style="margin-top: 25px; margin-bottom: 0; text-align: center;">
                  <a href="${process.env.CLIENT_TRACKING_URL || 'https://cargorealmandlogistics.com/app/trackshipment'}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px;">
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

    await sendMail(email, subject, htmlBody);
    console.log(`External sender confirmation email sent to ${email} successfully.`);
  } catch (error) {
    console.error('Failed to send external sender confirmation email:', error);
  }
};

// Helper function to send email notifications to all admin users
const sendAdminNotification = async (shipment, subject, adminBody, reqUser = null) => {
  try {
    // Find all users with the 'admin' or 'employee' role
    const recipients = await User.find({ role: { $in: ['admin', 'employee'] } });

    if (!recipients || recipients.length === 0) {
      console.warn('No admin or employee users found to send notification.');
      return;
    }

    // Collect and dedupe emails
    const recipientEmails = Array.from(new Set(recipients.map(u => u.email).filter(Boolean)));

    if (recipientEmails.length === 0) {
      console.warn('No valid recipient email addresses found to send notification.');
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
                      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; width: 40%; vertical-align: top;"><strong style="color: #555555;">Receiver Name:</strong></td>
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
                  <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Tofar Logistics Agency. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    </table>
    `;

  // Send a single request to Brevo with all admin/employee recipients
    try {
      await sendMail(recipientEmails, `Admin Notification: ${subject}`, htmlBody);
      console.log(`Admin/Employee emails sent to: ${recipientEmails.join(', ')}`);
    } catch (sendErr) {
      console.error('Failed to send admin/employee emails:', sendErr);
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
    // Paginated mode when ?page= is given; otherwise the full list (dashboard widgets use it)
    const paginated = req.query.page !== undefined;
    let shipments;
    let pageInfo;
    if (paginated) {
      const filter = await buildShipmentListFilter(req.query);
      const exportAll = req.query.limit === 'all';
      const limit = exportAll ? 5000 : Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const total = await Shipment.countDocuments(filter);
      const pages = Math.max(1, Math.ceil(total / limit));
      const page = exportAll ? 1 : Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
      shipments = await Shipment.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'email');
      pageInfo = { total, page, pages, limit };
    } else {
      shipments = await Shipment.find().populate('sender', 'email');
    }

    // Auto-generate missing QR codes (non-blocking)
    shipments.forEach(shipment => {
      if (!shipment.qrCodeUrl) {
        waitUntil(generateQRCodeForShipment(shipment).catch(err =>
          console.error(`Failed to generate QR for ${shipment.trackingNumber}:`, err)
        ));
      }
    });

    res.json(paginated ? { items: shipments, ...pageInfo } : shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Shipment list filters & stats (staff) -----------------------------------------
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const STALE_DAYS = 14;
const DELIVERED_RE = /^\s*delivered\s*$/i;

// Statuses may be stored by code ("in-transit") or name ("In Transit"); match all variants
const statusVariantsRegex = async (status) => {
  const wanted = String(status).trim();
  const lower = wanted.toLowerCase();
  const configured = await ShipmentStatus.find().select('name code').lean();
  const match = configured.find((s) => [s.code, s.name].some((v) => v && v.trim().toLowerCase() === lower));
  const variants = new Set([wanted, ...(match ? [match.code, match.name] : [])].filter(Boolean).map((v) => escapeRegex(v.trim())));
  return new RegExp(`^\\s*(${[...variants].join('|')})\\s*$`, 'i');
};

// view=open|delivered|all, search, status, facility, stale=1
const buildShipmentListFilter = async (q) => {
  const and = [];
  if (q.view === 'open') and.push({ status: { $not: DELIVERED_RE } });
  if (q.view === 'delivered') and.push({ status: DELIVERED_RE });
  if (q.status) and.push({ status: await statusVariantsRegex(q.status) });
  if (q.facility) and.push({ shipmentFacility: q.facility });
  if (q.stale === '1') {
    and.push({ status: { $not: DELIVERED_RE } });
    and.push({ createdAt: { $lt: new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000) } });
  }
  const search = typeof q.search === 'string' ? q.search.trim().slice(0, 100) : '';
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: ['trackingNumber', 'senderName', 'recipientName', 'destination', 'status'].map((f) => ({ [f]: re })) });
  }
  return and.length ? { $and: and } : {};
};

// GET /api/shipments/stats — summary counts for the shipments dashboard (Admin/Employee/Agent)
exports.getShipmentStats = async (req, res) => {
  try {
    const staleBefore = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const [result] = await Shipment.aggregate([
      { $project: { status: 1, createdAt: 1, shipmentFacility: 1, delivered: { $regexMatch: { input: { $ifNull: ['$status', ''] }, regex: DELIVERED_RE } } } },
      {
        $facet: {
          totals: [{ $group: { _id: '$delivered', count: { $sum: 1 }, oldest: { $min: '$createdAt' } } }],
          stale: [{ $match: { delivered: false, createdAt: { $lt: staleBefore } } }, { $count: 'count' }],
          byStatus: [{ $match: { delivered: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }],
          byFacility: [{ $match: { delivered: false } }, { $group: { _id: '$shipmentFacility', count: { $sum: 1 } } }],
        },
      },
    ]);
    const open = result.totals.find((t) => t._id === false);
    const delivered = result.totals.find((t) => t._id === true);
    res.json({
      open: open?.count || 0,
      delivered: delivered?.count || 0,
      total: (open?.count || 0) + (delivered?.count || 0),
      stale: result.stale[0]?.count || 0,
      staleAfterDays: STALE_DAYS,
      oldestOpenCreatedAt: open?.oldest || null,
      byStatus: result.byStatus.map((s) => ({ status: s._id || 'unknown', count: s.count })),
      openByFacility: Object.fromEntries(result.byFacility.filter((f) => f._id).map((f) => [f._id, f.count])),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Fetch My shipments (Client)
exports.getMyShipments = async (req, res) => {
  try {
    // Find shipments where the authenticated user is the sender
    const shipments = await Shipment.find({ sender: req.user.id }).populate('sender', 'email');
    
    // Auto-generate missing QR codes (non-blocking)
    shipments.forEach(shipment => {
      if (!shipment.qrCodeUrl) {
        waitUntil(generateQRCodeForShipment(shipment).catch(err =>
          console.error(`Failed to generate QR for ${shipment.trackingNumber}:`, err)
        ));
      }
    });
    
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fields safe to show on the public tracking page (qrCodeUrl is only used internally)
const PUBLIC_TRACKING_FIELDS = [
  'trackingNumber', 'status', 'senderName', 'recipientName', 'origin', 'destination',
  'items', 'shipmentPieces', 'shipmentType', 'shipmentPurpose', 'shipmentDate', 'deliveryDate',
  'trackingHistory.status', 'trackingHistory.location', 'trackingHistory.timestamp',
  'createdAt', 'updatedAt', 'qrCodeUrl',
].join(' ');

// 3. Track a shipment (Public)
exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    // Public endpoint: only return what the tracking page displays. Contact details,
    // addresses, cost, notes and internal replies must never be exposed here.
    const shipment = await Shipment.findOne({ trackingNumber }).select(PUBLIC_TRACKING_FIELDS);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Auto-generate QR code if missing (non-blocking)
    if (!shipment.qrCodeUrl) {
      waitUntil(generateQRCodeForShipment(shipment).catch(err =>
        console.error(`Failed to generate QR for ${shipment.trackingNumber}:`, err)
      ));
    }

    const { qrCodeUrl, ...publicShipment } = shipment.toObject();
    res.json(publicShipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CAR + 11 random digits (same format as before), checked against existing shipments
const generateUniqueTrackingNumber = async () => {
  for (let i = 0; i < 10; i++) {
    const candidate = `CAR${crypto.randomInt(10000000000, 99999999999)}`;
    if (!(await Shipment.exists({ trackingNumber: candidate }))) return candidate;
  }
  throw new Error('Could not generate a unique tracking number. Please try again.');
};

// 4. Create a new shipment (Admin only)
exports.createShipment = async (req, res) => {
  try {
    // Tracking number, history, QR and delivery time are always set by the server
    const {
      senderEmail, sender,
      trackingNumber: _clientTrackingNumber, trackingHistory: _h, replies: _r, qrCodeUrl: _q, deliveredAt: _d, _id: _i,
      ...shipmentData
    } = req.body;

    // Handle email-based sender assignment
    let finalSenderId = sender;
    let isExternalEmail = false;

    if (senderEmail) {
      // Lookup user by email if provided
      const existingUser = await User.findOne({ email: senderEmail.toLowerCase() });
      
      if (existingUser) {
        // Link to existing user
        finalSenderId = existingUser._id;
        console.log(`Shipment sender linked to existing user: ${existingUser.email}`);
      } else {
        // Mark as external email for confirmation later
        isExternalEmail = true;
        console.log(`External sender email: ${senderEmail}`);
      }
    }

    // Create shipment with final sender ID
    const newShipment = new Shipment({
      ...shipmentData,
      sender: finalSenderId || null,
      senderEmail: senderEmail || shipmentData.senderEmail
    });

    newShipment.trackingHistory.push({
      status: 'pending',
      location: newShipment.origin,
      timestamp: new Date()
    });

    // Assign a unique tracking number; retry on the rare collision with an existing one
    let savedShipment;
    for (let attempt = 1; !savedShipment; attempt++) {
      newShipment.trackingNumber = await generateUniqueTrackingNumber();
      try {
        savedShipment = await newShipment.save();
      } catch (saveErr) {
        const isTrackingCollision = saveErr.code === 11000 && saveErr.keyPattern?.trackingNumber;
        if (!isTrackingCollision || attempt >= 5) throw saveErr;
      }
    }

    // --- GENERATE QR CODE ---
    // try {
    //   const trackingUrl = `${process.env.CLIENT_TRACKING_URL || 'https://cargorealmandlogistics.com'}/app/trackshipment?tracking=${savedShipment.trackingNumber}`;
    //   const qrCodeUrl = await QRCode.toDataURL(trackingUrl);
    //   savedShipment.qrCodeUrl = qrCodeUrl;
    //   await savedShipment.save();
    //   console.log(`QR code generated for shipment: ${savedShipment.trackingNumber}`);
    // } catch (qrError) {
    //   console.error('Error generating QR code:', qrError);
    // }
    await generateQRCodeForShipment(savedShipment);
    
    // --- EMAIL NOTIFICATION: SHIPMENT CREATED ---
    if (finalSenderId) {
      // Send to registered user
      const clientSubject = `New Shipment Created: #${savedShipment.trackingNumber}`;
      const clientBody = `A new shipment has been created for you with the tracking number ${savedShipment.trackingNumber}.`;
      await sendClientNotification(savedShipment, clientSubject, clientBody);
    } else if (isExternalEmail && senderEmail) {
      // Send confirmation to external email
      console.log(`Sending external sender confirmation to: ${senderEmail}`);
      await sendExternalSenderConfirmation(savedShipment, senderEmail);
    }

    // --- EMAIL NOTIFICATION: SHIPMENT CREATED (Admin) ---
    const adminSubject = `New Shipment Created: #${savedShipment.trackingNumber}`;
    const adminBody = `A new shipment has been created in the system`;
    await sendAdminNotification(savedShipment, adminSubject, adminBody, req.user);
    
    // --- SMS NOTIFICATION: SHIPMENT CREATED ---
    try {
      const smsResults = await sendShipmentCreationSMS(savedShipment);
      console.log('[Shipment Creation] SMS notifications sent:', smsResults);
    } catch (smsError) {
      console.error('[Shipment Creation] Error sending SMS:', smsError.message);
    }
    
    res.status(201).json(savedShipment);
  } catch (err) {
    console.error('Error creating shipment:', err);
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

    // Staff (who can also create shipments) may edit any shipment; clients only their own.
    // `sender` is populated and may be null for shipments created for external emails.
    const isStaff = ['admin', 'employee', 'agent'].includes(req.user.role);
    const isOwner = shipment.sender && String(shipment.sender._id) === String(req.user.id);
    const isAuthorized = isStaff || isOwner;
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own shipments.' });
    }

    // Status (with its history, rules and proof of delivery), payments, replies and ownership
    // are managed by their own endpoints; the tracking number is fixed (it's encoded in the
    // QR code). Clients also can't change cost or facility.
    const updates = { ...req.body };
    ['_id', 'trackingNumber', 'status', 'deliveredAt', 'proofOfDelivery', 'payments', 'amountPaid', 'paymentStatus',
      'trackingHistory', 'replies', 'sender', 'qrCodeUrl', 'createdAt', 'updatedAt']
      .forEach((f) => delete updates[f]);
    if (!isStaff) {
      ['cost', 'shipmentFacility'].forEach((f) => delete updates[f]);
    }

    let updatedShipment = await Shipment.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    // A cost change can turn a part-paid shipment into paid (or back)
    const previousPaymentStatus = updatedShipment.paymentStatus;
    updatedShipment.recalculatePayments();
    if (updatedShipment.paymentStatus !== previousPaymentStatus || updatedShipment.isModified('amountPaid')) {
      updatedShipment = await updatedShipment.save();
    }

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

const FINAL_STATUSES = ['delivered', 'cancelled'];
const normalizeStatus = (s) => String(s || '').trim().toLowerCase();

// Delivery photos arrive as data URLs (the frontend resizes them first)
const MAX_DELIVERY_PHOTO_BYTES = 3 * 1024 * 1024;
const validateDeliveryPhoto = (photo) => {
  const match = typeof photo === 'string' && photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return 'Delivery photo must be a JPEG, PNG or WebP image.';
  const bytes = Math.floor((match[2].length * 3) / 4);
  if (bytes > MAX_DELIVERY_PHOTO_BYTES) return 'Delivery photo is too large (max 3 MB).';
  return null;
};

// 7. Change shipment status (Admin/Agent)
exports.changeShipmentStatus = async (req, res) => {
  try {    
    // Allow 'admin', 'employee and 'agent' to change status
    const allowedRoles = ['admin', 'agent', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only Admins, employees and Agents can change shipment status.' });
    }
    
    // const { id } = req.params;
    // const { status } = req.body;
    // const updatedShipment = await Shipment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

    const { id } = req.params;
    const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
    const location = typeof req.body.location === 'string' ? req.body.location.trim() : undefined;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const current = await Shipment.findById(id).select('status trackingNumber');
    if (!current) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Status must be one of the configured active statuses (skipped if none are configured)
    const activeStatuses = await ShipmentStatus.find({ isActive: true }).select('name code').lean();
    if (activeStatuses.length > 0) {
      const allowed = new Set();
      activeStatuses.forEach((s) => {
        if (s.code) allowed.add(s.code.toLowerCase());
        if (s.name) allowed.add(s.name.toLowerCase());
      });
      if (!allowed.has(status.toLowerCase())) {
        return res.status(400).json({ message: `"${status}" is not an active shipment status.` });
      }
    }

    // Delivered/cancelled are final; only an admin can reopen one (e.g. to correct a mistake)
    if (FINAL_STATUSES.includes(normalizeStatus(current.status)) && req.user.role !== 'admin'
        && normalizeStatus(status) !== normalizeStatus(current.status)) {
      return res.status(403).json({
        message: `Shipment ${current.trackingNumber} is already ${current.status}. Only an admin can change its status.`,
      });
    }

    const historyEntry = { status, location, timestamp: new Date(), updatedBy: req.user._id };
    const isNowDelivered = normalizeStatus(status) === 'delivered';
    const wasDelivered = normalizeStatus(current.status) === 'delivered';

    // Optional proof of delivery when marking delivered: receiver name, notes, photo
    let proofOfDelivery;
    if (isNowDelivered && req.body.proofOfDelivery && typeof req.body.proofOfDelivery === 'object') {
      const { receivedBy, notes, photo } = req.body.proofOfDelivery;
      proofOfDelivery = {
        receivedBy: typeof receivedBy === 'string' ? receivedBy.trim().slice(0, 120) : undefined,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : undefined,
        recordedBy: req.user._id,
        recordedAt: new Date(),
      };
      if (photo) {
        const photoError = validateDeliveryPhoto(photo);
        if (photoError) return res.status(400).json({ message: photoError });
        try {
          const uploaded = await cloudinary.uploader.upload(photo, {
            folder: 'cargo_realm/proof_of_delivery',
            public_id: `pod_${current.trackingNumber}_${Date.now()}`,
          });
          proofOfDelivery.photoUrl = uploaded.secure_url;
        } catch (uploadErr) {
          console.error('Proof of delivery photo upload failed:', uploadErr);
          return res.status(502).json({ message: 'Could not upload the delivery photo. Please try again or submit without it.' });
        }
      }
    }

    const update = { status, $push: { trackingHistory: historyEntry } };
    if (isNowDelivered) {
      // deliveredAt records when it was actually delivered (deliveryDate is the estimate)
      if (!wasDelivered) update.deliveredAt = new Date();
      if (proofOfDelivery) update.proofOfDelivery = proofOfDelivery;
    } else {
      // Reopened (admin only) or never delivered: clear delivery records
      update.$unset = { deliveredAt: 1, proofOfDelivery: 1 };
    }

    const updatedShipment = await Shipment.findByIdAndUpdate(id, update, { new: true, runValidators: true });

    if (!updatedShipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    // --- EMAIL NOTIFICATION: STATUS CHANGED (Client) ---
    const clientSubject = `Status Update for Shipment: #${updatedShipment.trackingNumber}`;
    const clientBody = `The status of your shipment has been changed to <strong>${updatedShipment.status}</strong>.`;
    await sendClientNotification(updatedShipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: STATUS CHANGED (Admin) ---
    const adminSubject = `Status Changed for Shipment: #${updatedShipment.trackingNumber} to ${updatedShipment.status}`;
    const adminBody = `The status of shipment #${updatedShipment.trackingNumber} has been updated to <strong>${updatedShipment.status}</strong>`;
    await sendAdminNotification(updatedShipment, adminSubject, adminBody, req.user);
    
    // --- SMS NOTIFICATION: STATUS CHANGED ---
    try {
      const smsResults = await sendShipmentStatusUpdateSMS(updatedShipment, status, location);
      console.log('[Status Update] SMS notifications sent:', smsResults);
    } catch (smsError) {
      console.error('[Status Update] Error sending SMS:', smsError.message);
      // Continue even if SMS fails - don't block status update
    }
    
    res.json(updatedShipment);
  } catch (err) {
    console.error('Error changing shipment status:', err); // Added detailed logging
    res.status(400).json({ message: err.message });
  }
};

// Document data for print/invoice/waybill. The PDFs themselves are rendered in the
// frontend; these endpoints return the data, and clients may only fetch their own.
const loadShipmentForDocument = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id).select('-replies');
  if (!shipment) {
    res.status(404).json({ message: 'Shipment not found' });
    return null;
  }
  const isStaff = ['admin', 'employee', 'agent'].includes(req.user.role);
  const isOwner = shipment.sender && String(shipment.sender) === String(req.user.id);
  if (!isStaff && !isOwner) {
    res.status(403).json({ message: 'Access denied. You can only access documents for your own shipments.' });
    return null;
  }
  return shipment;
};

const documentHandler = (buildExtra = () => ({})) => async (req, res) => {
  try {
    const shipment = await loadShipmentForDocument(req, res);
    if (!shipment) return;
    res.json({ shipment, ...buildExtra(shipment) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Shipment not found' });
    res.status(500).json({ message: err.message });
  }
};

// 8. Print shipment
exports.printShipment = documentHandler();

// 9. Invoice data
exports.generateInvoice = documentHandler((shipment) => ({
  invoiceNumber: `INV-${shipment.trackingNumber}`,
  issueDate: shipment.shipmentDate || shipment.createdAt,
  currency: 'NGN',
  total: Number(shipment.cost) || 0,
}));

// 10. Waybill data
exports.generateWaybill = documentHandler();

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
    const clientBody = `A new reply has been added to your shipment with tracking number ${shipment.trackingNumber}. 
    <br />
    <strong>The message is:</strong> "${message}".`;
    await sendClientNotification(shipment, clientSubject, clientBody);

    // --- EMAIL NOTIFICATION: NEW REPLY (Admin) ---
    const adminSubject = `New Reply on Shipment: #${shipment.trackingNumber}`;
    const adminBody = `A new reply has been posted on shipment #${shipment.trackingNumber} by ${req.user.email}. <br />
    <strong>Message:</strong> "${message}" <br />`;
    await sendAdminNotification(shipment, adminSubject, adminBody, req.user);

    res.json(shipment);
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 12. Batch generate QR codes for all shipments (Admin only)
exports.generateMissingQRCodes = async (req, res) => {
  try {
    // Only admins can trigger batch QR code generation
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can generate QR codes.' });
    }

    const shipments = await Shipment.find({ qrCodeUrl: null }); // Find shipments without QR codes
    
    if (shipments.length === 0) {
      return res.json({ 
        message: 'All shipments already have QR codes!', 
        generatedCount: 0,
        totalChecked: 0
      });
    }

    let generatedCount = 0;
    const errors = [];

    // Generate QR codes for all shipments without them
    for (const shipment of shipments) {
      try {
        const success = await generateQRCodeForShipment(shipment);
        if (success) {
          generatedCount++;
        }
      } catch (error) {
        errors.push({
          trackingNumber: shipment.trackingNumber,
          error: error.message
        });
      }
    }

    res.json({
      message: `QR code generation completed. ${generatedCount} out of ${shipments.length} shipments processed.`,
      generatedCount,
      totalChecked: shipments.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Batch QR generation error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 13. Record a payment against a shipment (Admin/Employee/Agent)
const PAYMENT_METHODS = ['cash', 'bank-transfer', 'card', 'pos', 'other'];

exports.addPayment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const amount = Math.round(Number(req.body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Enter a payment amount greater than zero.' });
    }
    const method = PAYMENT_METHODS.includes(req.body.method) ? req.body.method : 'cash';

    // Don't allow paying more than is owed when the shipment has a cost
    shipment.recalculatePayments();
    const cost = Number(shipment.cost) || 0;
    const balance = Math.round((cost - shipment.amountPaid) * 100) / 100;
    if (cost > 0 && amount > balance) {
      return res.status(400).json({
        message: balance > 0
          ? `Amount exceeds the balance due (${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}).`
          : 'This shipment is already fully paid.',
      });
    }

    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    shipment.payments.push({
      amount,
      method,
      reference: typeof req.body.reference === 'string' ? req.body.reference.trim().slice(0, 120) : undefined,
      note: typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : undefined,
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
      recordedBy: req.user._id,
    });
    shipment.recalculatePayments();
    const saved = await shipment.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Shipment not found' });
    console.error('Add payment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 14. Remove a payment recorded in error (Admin only)
exports.deletePayment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const payment = shipment.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.deleteOne();
    shipment.recalculatePayments();
    const saved = await shipment.save();
    res.json(saved);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Payment not found' });
    console.error('Delete payment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// --- Shipment documents --------------------------------------------------------
// Files go straight from the browser to Cloudinary (avoids Vercel's 4.5 MB body
// limit); the backend signs the upload and then records the result.
const documentFolder = (shipmentId) => `cargo_realm/shipment_documents/${shipmentId}`;

// 15. Signature for a direct browser upload (Admin/Employee/Agent)
exports.getDocumentUploadSignature = async (req, res) => {
  try {
    const exists = await Shipment.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: 'Shipment not found' });

    const timestamp = Math.round(Date.now() / 1000);
    // Every signed param must be sent unchanged by the browser
    const params = { timestamp, folder: documentFolder(req.params.id), use_filename: true, unique_filename: true };
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    res.json({
      ...params,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Shipment not found' });
    res.status(500).json({ message: err.message });
  }
};

// 16. Record an uploaded document on the shipment (Admin/Employee/Agent)
exports.addDocument = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const { name, label, url, publicId, resourceType, format, bytes } = req.body;
    const expectedUrlPrefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
    // Only accept files that were uploaded into this shipment's folder in our Cloudinary account
    if (typeof url !== 'string' || !url.startsWith(expectedUrlPrefix)
        || typeof publicId !== 'string' || !publicId.startsWith(`${documentFolder(shipment._id)}/`)) {
      return res.status(400).json({ message: 'Invalid document upload.' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Document name is required.' });
    }

    shipment.documents.push({
      name: name.trim().slice(0, 200),
      label: typeof label === 'string' ? label.trim().slice(0, 100) : undefined,
      url,
      publicId,
      resourceType: resourceType === 'image' ? 'image' : 'raw',
      format: typeof format === 'string' ? format.slice(0, 10) : undefined,
      bytes: Number(bytes) || undefined,
      uploadedBy: req.user._id,
    });
    const saved = await shipment.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Shipment not found' });
    console.error('Add document error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 17. Delete a document (Admin, or the staff member who uploaded it)
exports.deleteDocument = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    const doc = shipment.documents.id(req.params.documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isUploader = doc.uploadedBy && String(doc.uploadedBy) === String(req.user._id);
    if (req.user.role !== 'admin' && !isUploader) {
      return res.status(403).json({ message: 'Only an admin or the person who uploaded it can delete this document.' });
    }

    try {
      await cloudinary.uploader.destroy(doc.publicId, { resource_type: doc.resourceType || 'raw' });
    } catch (cloudErr) {
      // Still remove the record; an orphaned file is better than a broken link
      console.error('Cloudinary delete failed for', doc.publicId, cloudErr.message);
    }
    doc.deleteOne();
    const saved = await shipment.save();
    res.json(saved);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Document not found' });
    console.error('Delete document error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 18. Short-lived download link for a document (staff, or the client who owns the shipment).
// Signed API downloads work even when the Cloudinary account blocks public PDF delivery,
// and keep documents private to people who can see the shipment.
exports.getDocumentDownloadUrl = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).select('sender documents');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const isStaff = ['admin', 'employee', 'agent'].includes(req.user.role);
    const isOwner = shipment.sender && String(shipment.sender) === String(req.user._id);
    if (!isStaff && !isOwner) return res.status(403).json({ message: 'Access denied.' });

    const doc = shipment.documents.id(req.params.documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const resourceType = doc.resourceType || 'raw';
    // Raw public IDs already end in the extension; images need the format passed separately
    const url = cloudinary.utils.private_download_url(doc.publicId, resourceType === 'raw' ? '' : (doc.format || ''), {
      resource_type: resourceType,
      type: 'upload',
      attachment: req.query.inline !== '1',
      expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
    });
    res.json({ url, name: doc.name });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Document not found' });
    res.status(500).json({ message: err.message });
  }
};
