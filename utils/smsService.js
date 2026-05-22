const axios = require('axios');

// BulkSMS Nigeria Configuration
const BULKSMS_BASE_URL = process.env.BULKSMS_BASE_URL;
const BULKSMS_TOKEN = process.env.BULKSMS_TOKEN || '584|5QAMKOoAyoy7gIKilZ4gDHuTjrMW265eNfgti2R099b2a91f';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'CargoRealm';

/**
 * Send SMS to a recipient using BulkSMS Nigeria API
 * @param {string} phoneNumber - Recipient phone number (should include country code, e.g., +2348012345678)
 * @param {string} message - SMS message content (max 160 characters for one SMS)
 * @returns {Promise<object>} - Response from BulkSMS API
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    // Validate phone number format (basic validation)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }

    const payload = {
      from: SMS_SENDER_ID,
      to: phoneNumber,
      body: message,
      gateway: 'direct-refund', // Alternative gateways: direct-corporate, otp, dual-backup
      append_sender: 'hosted', // hosted, none, all
    };

    console.log(`[SMS Service] Sending SMS to ${phoneNumber}...`);
    
    const response = await axios.post(`${BULKSMS_BASE_URL}/sms`, payload, {
      headers: {
        'Authorization': `Bearer ${BULKSMS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`[SMS Service] SMS sent successfully to ${phoneNumber}`, {
      messageId: response.data?.data?.message_id,
      status: response.data?.status,
    });

    return {
      success: true,
      messageId: response.data?.data?.message_id,
      status: response.data?.status,
      data: response.data,
    };
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', {
      phoneNumber,
      message: error.message,
      status: error.response?.status,
      errorData: error.response?.data,
    });

    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

/**
 * Send SMS to multiple recipients
 * @param {array} phoneNumbers - Array of recipient phone numbers
 * @param {string} message - SMS message content
 * @returns {Promise<array>} - Array of SMS send results
 */
const sendBulkSMS = async (phoneNumbers, message) => {
  try {
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      throw new Error('Phone numbers must be a non-empty array');
    }

    const results = await Promise.all(
      phoneNumbers.map(number => sendSMS(number, message))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[SMS Service] Bulk SMS completed: ${successful} sent, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error('[SMS Service] Bulk SMS error:', error.message);
    throw error;
  }
};

/**
 * Check account balance
 * @returns {Promise<object>} - Account balance information
 */
const checkBalance = async () => {
  try {
    const response = await axios.get(`${BULKSMS_BASE_URL}/account`, {
      headers: {
        'Authorization': `Bearer ${BULKSMS_TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    console.log('[SMS Service] Balance check successful:', response.data);

    return {
      success: true,
      balance: response.data?.data?.balance,
      currency: response.data?.data?.currency,
      data: response.data?.data,
    };
  } catch (error) {
    console.error('[SMS Service] Balance check failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get delivery reports/transaction history
 * @returns {Promise<object>} - Transaction history
 */
const getTransactions = async () => {
  try {
    const response = await axios.get(`${BULKSMS_BASE_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${BULKSMS_TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    console.log('[SMS Service] Transactions fetched successfully');

    return {
      success: true,
      transactions: response.data?.data,
      data: response.data,
    };
  } catch (error) {
    console.error('[SMS Service] Transactions fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  checkBalance,
  getTransactions,
};
