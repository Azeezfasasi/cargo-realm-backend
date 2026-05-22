const express = require('express');
const { sendSMS, checkBalance, getTransactions } = require('../utils/smsService');
const { getTemplate } = require('../utils/smsTemplates');
const SMSSettings = require('../models/SMSSettings');
const SMSLog = require('../models/SMSLog');

// Get SMS Settings
exports.getSMSSettings = async (req, res) => {
  try {
    let settings = await SMSSettings.findOne();

    if (!settings) {
      settings = new SMSSettings();
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    console.error('Error fetching SMS settings:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Update SMS Settings
exports.updateSMSSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Prevent updating critical fields
    delete updates._id;
    delete updates.createdAt;

    let settings = await SMSSettings.findOne();

    if (!settings) {
      settings = new SMSSettings(updates);
    } else {
      Object.assign(settings, updates);
    }

    settings.updatedAt = new Date();
    await settings.save();

    res.json({ message: 'SMS settings updated successfully', settings });
  } catch (err) {
    console.error('Error updating SMS settings:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Send Test SMS
exports.sendTestSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ message: 'Phone number and message are required' });
    }

    const result = await sendSMS(phoneNumber, message);

    // Log the SMS
    const smsLog = new SMSLog({
      phoneNumber,
      message,
      status: result.success ? 'sent' : 'failed',
      eventType: 'CUSTOM',
      recipientType: 'other',
      messageId: result.messageId,
      apiResponse: result.data,
      error: result.error,
    });

    await smsLog.save();

    if (result.success) {
      res.json({ message: 'Test SMS sent successfully', result });
    } else {
      console.error('[SMS Controller] Test SMS failed with error:', result.details);
      res.status(400).json({ 
        message: 'Failed to send test SMS', 
        error: result.error,
        details: result.details,
        hint: 'Check your BulkSMS API credentials and base URL in the environment variables.'
      });
    }
  } catch (err) {
    console.error('Error sending test SMS:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Check Account Balance
exports.checkSMSBalance = async (req, res) => {
  try {
    const result = await checkBalance();

    if (result.success) {
      res.json({
        message: 'Balance retrieved successfully',
        balance: result.balance,
        currency: result.currency,
        data: result.data,
      });
    } else {
      console.error('[SMS Controller] Balance check failed with error:', result.details);
      res.status(400).json({ 
        message: 'Failed to retrieve balance', 
        error: result.error,
        details: result.details,
        hint: 'Check your BulkSMS API credentials and base URL in the environment variables.'
      });
    }
  } catch (err) {
    console.error('Error checking SMS balance:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get SMS Logs
exports.getSMSLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, shipmentId, status, eventType } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (shipmentId) filter.shipmentId = shipmentId;
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;

    const logs = await SMSLog.find(filter)
      .populate('shipmentId', 'trackingNumber senderName recipientName')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SMSLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching SMS logs:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get SMS Statistics
exports.getSMSStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.sentAt = {};
      if (startDate) {
        // Start from beginning of the day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.sentAt.$gte = start;
      }
      if (endDate) {
        // End at end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.sentAt.$lte = end;
      }
    }

    const total = await SMSLog.countDocuments(filter);
    const sent = await SMSLog.countDocuments({ ...filter, status: 'sent' });
    const failed = await SMSLog.countDocuments({ ...filter, status: 'failed' });
    const pending = await SMSLog.countDocuments({ ...filter, status: 'pending' });
    const delivered = await SMSLog.countDocuments({ ...filter, status: 'delivered' });

    // Get breakdown by event type
    const byEventType = await SMSLog.aggregate([
      { $match: filter },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get breakdown by recipient type
    const byRecipientType = await SMSLog.aggregate([
      { $match: filter },
      { $group: { _id: '$recipientType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      summary: {
        total,
        sent,
        failed,
        pending,
        delivered,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%',
      },
      byEventType,
      byRecipientType,
    });
  } catch (err) {
    console.error('Error fetching SMS statistics:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Delete SMS Log
exports.deleteSMSLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await SMSLog.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({ message: 'SMS log not found' });
    }

    res.json({ message: 'SMS log deleted successfully' });
  } catch (err) {
    console.error('Error deleting SMS log:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get SMS Templates List
exports.getTemplates = async (req, res) => {
  try {
    const templates = require('../utils/smsTemplates').getAllTemplates();
    res.json({ templates });
  } catch (err) {
    console.error('Error fetching templates:', err.message);
    res.status(500).json({ message: err.message });
  }
};
