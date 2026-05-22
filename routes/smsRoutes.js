const express = require('express');
const router = express.Router();
const {
  getSMSSettings,
  updateSMSSettings,
  sendTestSMS,
  checkSMSBalance,
  getSMSLogs,
  getSMSStatistics,
  deleteSMSLog,
  getTemplates,
} = require('../controllers/smsController');
const { authenticate } = require('../middleware/auth');

// All SMS routes require authentication
router.use(authenticate);

// SMS Settings Routes
router.get('/settings', getSMSSettings);
router.put('/settings', updateSMSSettings);

// SMS Test & Balance
router.post('/test-sms', sendTestSMS);
router.get('/balance', checkSMSBalance);

// SMS Logs Routes
router.get('/logs', getSMSLogs);
router.get('/statistics', getSMSStatistics);
router.delete('/logs/:id', deleteSMSLog);

// SMS Templates
router.get('/templates', getTemplates);

module.exports = router;
