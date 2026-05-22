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
    
    // Create abort controller with 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await axios.post(smsURL, payload, {
      headers,
      timeout: 8000,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
    const isAbortError = error.code === 'ECONNABORTED';
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      requestURL: smsURL,
      authMethod: BULKSMS_AUTH_METHOD,
      requestPayload: payload,
      isTimeout: isAbortError,
    };
    
    console.error('[SMS Service] Error sending SMS:', {
      phoneNumber,
      errorDetails,
    });

    return {
      success: false,
      error: isAbortError ? 'Request timeout - BulkSMS API took too long to respond' : error.message,
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

// Cache for balance checks to avoid hammering the API
let balanceCache = {
  data: null,
  timestamp: 0,
  cacheDuration: 60 * 1000, // Cache for 60 seconds
};

/**
 * Check account balance with caching
 * @returns {Promise<object>} - Account balance information
 */
const checkBalance = async () => {
  try {
    // Check if cache is still valid (within 60 seconds)
    const now = Date.now();
    if (balanceCache.data && (now - balanceCache.timestamp) < balanceCache.cacheDuration) {
      console.log('[SMS Service] Returning cached balance (age: ' + (now - balanceCache.timestamp) + 'ms)');
      return balanceCache.data;
    }

    if (!BULKSMS_TOKEN) {
      throw new Error('BulkSMS API token is not configured. Please set BULKSMS_TOKEN in environment variables.');
    }

    const balanceURL = getFullURL('/balance');
    const headers = getAuthHeaders();

    console.log('[SMS Service] Checking balance...');
    console.log('[SMS Service] URL:', balanceURL);
    console.log('[SMS Service] Auth Method:', BULKSMS_AUTH_METHOD);
    
    // Create abort controller with 8 second timeout (BulkSMS API should respond in <5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await axios.get(balanceURL, {
      headers,
      timeout: 8000,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('[SMS Service] Balance check successful:', response.data);

    const result = {
      success: true,
      balance: response.data?.balance,
      currency: 'NGN',
      data: response.data?.data,
    };

    // Cache the successful response
    balanceCache = {
      data: result,
      timestamp: now,
      cacheDuration: 60 * 1000,
    };

    return result;
  } catch (error) {
    const balanceURL = getFullURL('/balance');
    const isAbortError = error.code === 'ECONNABORTED';
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      requestURL: balanceURL,
      authMethod: BULKSMS_AUTH_METHOD,
      isTimeout: isAbortError,
    };
    
    console.error('[SMS Service] Balance check failed:', errorDetails);
    
    // If we have cached data, return it as fallback on error
    if (balanceCache.data) {
      console.warn('[SMS Service] Returning stale cached balance due to API error');
      return {
        ...balanceCache.data,
        cached: true,
        cacheAge: Date.now() - balanceCache.timestamp,
      };
    }
    
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
    
    // Create abort controller with 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await axios.get(transactionsURL, {
      headers,
      timeout: 8000,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[SMS Service] Transactions fetched successfully');

    return {
      success: true,
      transactions: response.data?.data,
      data: response.data,
    };
  } catch (error) {
    const isAbortError = error.code === 'ECONNABORTED';
    console.error('[SMS Service] Transactions fetch failed:', {
      message: error.message,
      isTimeout: isAbortError,
    });
    return {
      success: false,
      error: isAbortError ? 'Request timeout fetching transactions' : error.message,
    };
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  checkBalance,
  getTransactions,
};
