require('dotenv').config();
const axios = require('axios');

// Test with legacy token format
const BULKSMS_BASE_URL = 'https://www.bulksmsnigeria.com/api/v2'; // Using v2 (non-sandbox)
const BULKSMS_TOKEN = 'fx4MJ4JOCnEl6Hme2944nMPsjogmgFCPchAOJ0uQQzIkPQElLjxwolm6IcNH'; // Legacy token format
const BULKSMS_AUTH_METHOD = 'query-param';

console.log('=== BulkSMS Legacy Token Test ===');
console.log('Base URL:', BULKSMS_BASE_URL);
console.log('Auth Method:', BULKSMS_AUTH_METHOD);
console.log('Token set:', !!BULKSMS_TOKEN);
console.log('Token preview:', BULKSMS_TOKEN ? `${BULKSMS_TOKEN.substring(0, 15)}...` : 'NOT SET');
console.log('');

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

  return headers;
};

const getFullURL = (endpoint) => {
  let url = `${BULKSMS_BASE_URL}${endpoint}`;
  if (BULKSMS_AUTH_METHOD === 'query-param') {
    url += `?api_token=${BULKSMS_TOKEN}`;
  }
  return url;
};

const testBalance = async () => {
  try {
    console.log('Testing Balance Endpoint...');
    const url = getFullURL('/balance');
    const headers = getAuthHeaders();
    
    console.log('URL:', url);
    console.log('Auth Method:', BULKSMS_AUTH_METHOD);
    console.log('Headers:', { ...headers, api_token: headers.api_token ? '***' : 'not set' });
    
    const response = await axios.get(url, {
      headers,
      timeout: 10000,
    });

    console.log('✓ SUCCESS');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Error Message:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response Data:', error.response?.data);
    console.log('Full Error:', error.code);
  }
  console.log('');
};

const testSendSMS = async () => {
  try {
    console.log('Testing SMS Send Endpoint...');
    const url = getFullURL('/sms');
    const headers = getAuthHeaders();
    
    console.log('URL:', url);
    
    const payload = {
      from: 'CargoRealm',
      to: '2348012345678',  // Test number
      body: 'This is a test SMS from Cargo Realm',
      // gateway: 'direct-refund',  // Optional - comment out if causing validation errors
      // append_sender: 'hosted',  // Optional
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Auth Method:', BULKSMS_AUTH_METHOD);
    
    const response = await axios.post(url, payload, {
      headers,
      timeout: 10000,
    });

    console.log('✓ SUCCESS');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Error Message:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response Data:', error.response?.data);
  }
};

(async () => {
  await testBalance();
  await testSendSMS();
})();
