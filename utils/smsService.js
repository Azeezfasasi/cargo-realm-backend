const axios = require('axios');

// BulkSMS Nigeria Configuration
const BULKSMS_BASE_URL = process.env.BULKSMS_BASE_URL || 'https://www.bulksmsnigeria.com/api/v2';
const BULKSMS_TOKEN = process.env.BULKSMS_TOKEN;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'CargoRealm';
// Support for different auth methods: 'bearer', 'custom-header', 'query-param'
const BULKSMS_AUTH_METHOD = process.env.BULKSMS_AUTH_METHOD || 'custom-header';

// Debug: Log configuration on load
console.log('[SMS Service] Initializing with:', {
  BASE_URL: BULKSMS_BASE_URL,
  SENDER_ID: SMS_SENDER_ID,
  TOKEN_SET: !!BULKSMS_TOKEN,
  AUTH_METHOD: BULKSMS_AUTH_METHOD,
});

/**
 * Get authorization headers based on configured auth method
 */
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (BULKSMS_AUTH_METHOD === 'bearer') {
    headers['Authorization'] = `Bearer ${BULKSMS_TOKEN}`;
  } else if (BULKSMS_AUTH_METHOD === 'custom-header') {
    headers['api_token'] = BULKSMS_TOKEN;
  }
  // For 'query-param', we'll add token to the URL instead

  return headers;
};

/**
 * Get the full URL with query parameters if using query param auth
 */
const getFullURL = (endpoint) => {
  let url = `${BULKSMS_BASE_URL}${endpoint}`;
  if (BULKSMS_AUTH_METHOD === 'query-param') {
    url += `?api_token=${BULKSMS_TOKEN}`;
  }
  return url;
};

/**
 * Send SMS to a recipient using BulkSMS Nigeria API
 * @param {string} phoneNumber - Recipient phone number (should include country code, e.g., +2348012345678)
 * @param {string} message - SMS message content (max 160 characters for one SMS)
 * @returns {Promise<object>} - Response from BulkSMS API
 */
const sendSMS = async (phoneNumber, message) => {
  let payload; // Define outside try block so it's accessible in catch
  
  try {
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    if (!BULKSMS_TOKEN) {
      throw new Error('BulkSMS API token is not configured. Please set BULKSMS_TOKEN in environment variables.');
    }

    // Validate phone number format (basic validation)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }

    payload = {
      from: SMS_SENDER_ID,
      to: phoneNumber,
      body: message,
      // Optional gateway - may not be supported in all modes
      // gateway: 'direct-refund',
      // append_sender: 'hosted',
    };

    const smsURL = getFullURL('/sms');
    const headers = getAuthHeaders();

    console.log(`[SMS Service] Sending SMS to ${phoneNumber}...`);
    console.log(`[SMS Service] Request URL: ${smsURL}`);
    console.log(`[SMS Service] Auth Method: ${BULKSMS_AUTH_METHOD}`);
    console.log(`[SMS Service] Request Payload:`, payload);
    
    const response = await axios.post(smsURL, payload, {
      headers,
      timeout: 10000, // 10 second timeout
    });

    console.log(`[SMS Service] SMS sent successfully to ${phoneNumber}`, {
      messageId: response.data?.data?.message_id,
      status: response.data?.status,
      fullResponse: response.data,
    });

    return {
      success: true,
      messageId: response.data?.data?.message_id,
      status: response.data?.status,
      data: response.data,
    };
  } catch (error) {
    const smsURL = getFullURL('/sms');
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      requestURL: smsURL,
      authMethod: BULKSMS_AUTH_METHOD,
      requestPayload: payload,
    };
    
    console.error('[SMS Service] Error sending SMS:', {
      phoneNumber,
      errorDetails,
    });

    return {
      success: false,
      error: error.message,
      details: errorDetails,
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
    if (!BULKSMS_TOKEN) {
      throw new Error('BulkSMS API token is not configured. Please set BULKSMS_TOKEN in environment variables.');
    }

    const balanceURL = getFullURL('/balance');
    const headers = getAuthHeaders();

    console.log('[SMS Service] Checking balance...');
    console.log('[SMS Service] URL:', balanceURL);
    console.log('[SMS Service] Auth Method:', BULKSMS_AUTH_METHOD);
    
    const response = await axios.get(balanceURL, {
      headers,
      timeout: 10000,
    });

    console.log('[SMS Service] Balance check successful:', response.data);

    return {
      success: true,
      balance: response.data?.balance,
      currency: 'NGN',
      data: response.data?.data,
    };
  } catch (error) {
    const balanceURL = getFullURL('/balance');
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      requestURL: balanceURL,
      authMethod: BULKSMS_AUTH_METHOD,
    };
    
    console.error('[SMS Service] Balance check failed:', errorDetails);
    
    return {
      success: false,
      error: error.message,
      details: errorDetails,
    };
  }
};

/**
 * Get delivery reports/transaction history
 * @returns {Promise<object>} - Transaction history
 */
const getTransactions = async () => {
  try {
    const transactionsURL = getFullURL('/transactions');
    const headers = getAuthHeaders();

    console.log('[SMS Service] Fetching transactions...');
    console.log('[SMS Service] URL:', transactionsURL);
    
    const response = await axios.get(transactionsURL, {
      headers,
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
