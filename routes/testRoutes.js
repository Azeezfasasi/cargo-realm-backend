const express = require('express');
const router = express.Router();
const { checkBalance, sendSMS } = require('../utils/smsService');

// Test BulkSMS connection
router.get('/bulksms-test', async (req, res) => {
  try {
    console.log('[Test] Testing BulkSMS connection...');
    
    // Test balance endpoint
    const result = await checkBalance();
    
    res.json({
      success: result.success,
      message: 'BulkSMS Test Result',
      result: result,
      environment: {
        BULKSMS_TOKEN_CONFIGURED: !!process.env.BULKSMS_TOKEN,
        BULKSMS_BASE_URL: process.env.BULKSMS_BASE_URL,
        SMS_SENDER_ID: process.env.SMS_SENDER_ID,
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Test SMS sending
router.post('/send-test-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Phone number and message are required'
      });
    }
    
    console.log('[Test] Sending test SMS to:', phoneNumber);
    
    const result = await sendSMS(phoneNumber, message);
    
    res.json({
      success: result.success,
      message: 'SMS Test Result',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
