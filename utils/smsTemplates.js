/**
 * SMS Templates for Shipment Notifications
 * Optimized for 160 character SMS limit
 */

const smsTemplates = {
  // Shipment Created - Sender Notification
  SHIPMENT_CREATED_SENDER: (trackingNumber, recipientName, origin, destination) => {
    return `Dear Sender, your shipment ${trackingNumber} to ${recipientName} has been created. From: ${origin} To: ${destination}. Track: cargorealmandlogistics.com`;
  },

  // Shipment Created - Recipient Notification
  SHIPMENT_CREATED_RECIPIENT: (trackingNumber, senderName, origin, destination) => {
    return `Dear Recipient, you have an incoming shipment ${trackingNumber} from ${senderName}. From: ${origin} To: ${destination}. Track: cargorealmandlogistics.com`;
  },

  // Shipment Status Updated
  SHIPMENT_STATUS_UPDATED: (trackingNumber, newStatus, location) => {
    return `Shipment ${trackingNumber} status updated to ${newStatus}. Location: ${location}. Track: cargorealmandlogistics.com`;
  },

  // Shipment Out for Delivery
  SHIPMENT_OUT_FOR_DELIVERY: (trackingNumber, estimatedDeliveryTime) => {
    return `Shipment ${trackingNumber} is out for delivery today. ETA: ${estimatedDeliveryTime}. Track: cargorealmandlogistics.com`;
  },

  // Shipment Delivered
  SHIPMENT_DELIVERED: (trackingNumber, deliveryDate) => {
    return `Shipment ${trackingNumber} has been delivered on ${deliveryDate}. Thank you for using CargoRealm! Track: cargorealmandlogistics.com`;
  },

  // Shipment Delayed
  SHIPMENT_DELAYED: (trackingNumber, reason) => {
    return `Shipment ${trackingNumber} is delayed. Reason: ${reason}. We apologize for the inconvenience. Track: cargorealmandlogistics.com`;
  },

  // Shipment Cancelled
  SHIPMENT_CANCELLED: (trackingNumber, reason) => {
    return `Shipment ${trackingNumber} has been cancelled. Reason: ${reason}. Contact support for refund. Track: cargorealmandlogistics.com`;
  },

  // Shipment Exception/Issue
  SHIPMENT_EXCEPTION: (trackingNumber, issue) => {
    return `Alert: Shipment ${trackingNumber} encountered an issue: ${issue}. Contact support immediately. Track: cargorealmandlogistics.com`;
  },

  // Generic Status Notification
  GENERIC_NOTIFICATION: (trackingNumber, message) => {
    return `${message} Tracking: ${trackingNumber}. Track: cargorealmandlogistics.com`;
  },
};

/**
 * Get SMS template with variables replaced
 * @param {string} templateName - Name of the template
 * @param {object} variables - Variables to replace in template
 * @returns {string} - Formatted SMS message
 */
const getTemplate = (templateName, variables = {}) => {
  const template = smsTemplates[templateName];

  if (!template) {
    console.error(`SMS Template not found: ${templateName}`);
    return null;
  }

  if (typeof template === 'function') {
    return template(...Object.values(variables));
  }

  return template;
};

/**
 * Get all available templates
 */
const getAllTemplates = () => {
  return Object.keys(smsTemplates);
};

module.exports = {
  smsTemplates,
  getTemplate,
  getAllTemplates,
};
