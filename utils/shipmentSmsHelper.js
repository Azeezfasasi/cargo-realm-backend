const { sendSMS, sendBulkSMS } = require('./smsService');
const { getTemplate } = require('./smsTemplates');
const SMSLog = require('../models/SMSLog');
const SMSSettings = require('../models/SMSSettings');

/**
 * Helper function to send shipment notification SMS
 * @param {object} options - Configuration options
 * @param {object} options.shipment - Shipment object
 * @param {string} options.eventType - SMS template event type (e.g., 'SHIPMENT_CREATED_SENDER')
 * @param {string} options.phoneNumber - Recipient phone number
 * @param {string} options.recipientType - Type of recipient: 'sender', 'receiver', 'admin'
 * @param {object} options.variables - Variables for SMS template
 * @returns {Promise<object>} - SMS send result
 */
const sendShipmentSMS = async (options) => {
  try {
    const {
      shipment,
      eventType,
      phoneNumber,
      recipientType,
      variables = {},
    } = options;

    // Get SMS settings
    const settings = await SMSSettings.findOne();

    // Check if SMS is enabled globally
    if (!settings?.enabled) {
      console.log('[SMS Helper] SMS notifications are disabled globally');
      return { success: false, reason: 'SMS disabled globally' };
    }

    // Validate phone number
    if (!phoneNumber) {
      console.error('[SMS Helper] Phone number is required');
      return { success: false, reason: 'No phone number provided' };
    }

    // Get SMS template message
    const message = getTemplate(eventType, variables);

    if (!message) {
      console.error(`[SMS Helper] Failed to get SMS template: ${eventType}`);
      return { success: false, reason: `Invalid template: ${eventType}` };
    }

    // Check message length (SMS limit is 160 characters)
    if (message.length > 160) {
      console.warn(`[SMS Helper] SMS message exceeds 160 character limit (${message.length} chars)`, message);
    }

    // Send SMS
    const result = await sendSMS(phoneNumber, message);

    // Log the SMS attempt
    const smsLog = new SMSLog({
      phoneNumber,
      message,
      status: result.success ? 'sent' : 'failed',
      eventType,
      recipientType,
      shipmentId: shipment?._id,
      trackingNumber: shipment?.trackingNumber,
      messageId: result.messageId,
      apiResponse: result.data,
      error: result.error,
    });

    await smsLog.save();

    console.log(`[SMS Helper] SMS logged for ${recipientType}:`, {
      phoneNumber,
      eventType,
      status: result.success ? 'sent' : 'failed',
    });

    return {
      success: result.success,
      messageId: result.messageId,
      phoneNumber,
      recipientType,
      eventType,
    };
  } catch (error) {
    console.error('[SMS Helper] Error sending shipment SMS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send SMS to both sender and receiver on shipment creation
 * @param {object} shipment - Shipment object
 * @returns {Promise<object>} - Results for both sender and receiver
 */
const sendShipmentCreationSMS = async (shipment) => {
  try {
    const results = {
      sender: null,
      receiver: null,
    };

    // Get SMS settings
    const settings = await SMSSettings.findOne();

    if (!settings?.enabled || !settings?.sendOnCreation) {
      console.log('[SMS Helper] Shipment creation SMS is disabled');
      return results;
    }

    // Send SMS to sender if notifyBothPartiesOnCreation is enabled
    if (settings.notifyBothPartiesOnCreation && shipment.senderPhone) {
      results.sender = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_CREATED_SENDER',
        phoneNumber: shipment.senderPhone,
        recipientType: 'sender',
        variables: {
          trackingNumber: shipment.trackingNumber,
          recipientName: shipment.recipientName,
          origin: shipment.origin,
          destination: shipment.destination,
        },
      });
    }

    // Send SMS to receiver
    if (shipment.recipientPhone) {
      results.receiver = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_CREATED_RECIPIENT',
        phoneNumber: shipment.recipientPhone,
        recipientType: 'receiver',
        variables: {
          trackingNumber: shipment.trackingNumber,
          senderName: shipment.senderName,
          origin: shipment.origin,
          destination: shipment.destination,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('[SMS Helper] Error sending creation SMS:', error.message);
    return { sender: null, receiver: null };
  }
};

/**
 * Send SMS notification when shipment status is updated
 * @param {object} shipment - Shipment object
 * @param {string} newStatus - New shipment status
 * @param {string} location - Current location (optional)
 * @returns {Promise<object>} - Results for both sender and receiver
 */
const sendShipmentStatusUpdateSMS = async (shipment, newStatus, location = '') => {
  try {
    const results = {
      sender: null,
      receiver: null,
    };

    // Get SMS settings
    const settings = await SMSSettings.findOne();

    if (!settings?.enabled || !settings?.sendOnStatusUpdate) {
      console.log('[SMS Helper] Status update SMS is disabled');
      return results;
    }

    // Send to sender if enabled
    if (settings.notifySenderOnStatusChange && shipment.senderPhone) {
      results.sender = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_STATUS_UPDATED',
        phoneNumber: shipment.senderPhone,
        recipientType: 'sender',
        variables: {
          trackingNumber: shipment.trackingNumber,
          newStatus,
          location: location || shipment.destination,
        },
      });
    }

    // Send to receiver if enabled
    if (settings.notifyRecipientOnStatusChange && shipment.recipientPhone) {
      results.receiver = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_STATUS_UPDATED',
        phoneNumber: shipment.recipientPhone,
        recipientType: 'receiver',
        variables: {
          trackingNumber: shipment.trackingNumber,
          newStatus,
          location: location || shipment.destination,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('[SMS Helper] Error sending status update SMS:', error.message);
    return { sender: null, receiver: null };
  }
};

/**
 * Send SMS on shipment delivery
 * @param {object} shipment - Shipment object
 * @param {string} deliveryDate - Delivery date
 * @returns {Promise<object>} - Results
 */
const sendShipmentDeliveredSMS = async (shipment, deliveryDate = new Date().toLocaleDateString()) => {
  try {
    const results = {
      sender: null,
      receiver: null,
    };

    // Get SMS settings
    const settings = await SMSSettings.findOne();

    if (!settings?.enabled || !settings?.sendOnDelivery) {
      console.log('[SMS Helper] Delivery SMS is disabled');
      return results;
    }

    // Send to sender
    if (shipment.senderPhone) {
      results.sender = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_DELIVERED',
        phoneNumber: shipment.senderPhone,
        recipientType: 'sender',
        variables: {
          trackingNumber: shipment.trackingNumber,
          deliveryDate,
        },
      });
    }

    // Send to receiver
    if (shipment.recipientPhone) {
      results.receiver = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_DELIVERED',
        phoneNumber: shipment.recipientPhone,
        recipientType: 'receiver',
        variables: {
          trackingNumber: shipment.trackingNumber,
          deliveryDate,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('[SMS Helper] Error sending delivery SMS:', error.message);
    return { sender: null, receiver: null };
  }
};

/**
 * Send SMS on shipment cancellation
 * @param {object} shipment - Shipment object
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} - Results
 */
const sendShipmentCancelledSMS = async (shipment, reason = 'No reason provided') => {
  try {
    const results = {
      sender: null,
      receiver: null,
    };

    // Get SMS settings
    const settings = await SMSSettings.findOne();

    if (!settings?.enabled || !settings?.sendOnCancellation) {
      console.log('[SMS Helper] Cancellation SMS is disabled');
      return results;
    }

    // Send to sender
    if (shipment.senderPhone) {
      results.sender = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_CANCELLED',
        phoneNumber: shipment.senderPhone,
        recipientType: 'sender',
        variables: {
          trackingNumber: shipment.trackingNumber,
          reason,
        },
      });
    }

    // Send to receiver
    if (shipment.recipientPhone) {
      results.receiver = await sendShipmentSMS({
        shipment,
        eventType: 'SHIPMENT_CANCELLED',
        phoneNumber: shipment.recipientPhone,
        recipientType: 'receiver',
        variables: {
          trackingNumber: shipment.trackingNumber,
          reason,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('[SMS Helper] Error sending cancellation SMS:', error.message);
    return { sender: null, receiver: null };
  }
};

module.exports = {
  sendShipmentSMS,
  sendShipmentCreationSMS,
  sendShipmentStatusUpdateSMS,
  sendShipmentDeliveredSMS,
  sendShipmentCancelledSMS,
};
