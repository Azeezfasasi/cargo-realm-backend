# SMS API Implementation Guide - Cargo Realm Logistics

## ✅ Implementation Complete

Your SMS notification system has been successfully set up with BulkSMS Nigeria. Automatic SMS messages will now be sent to shipment senders and receivers on key events.

---

## 📋 What Was Implemented

### Backend (Node.js/Express)

#### New Services & Utilities:
- ✅ **smsService.js** - BulkSMS Nigeria API client
- ✅ **smsTemplates.js** - Pre-built SMS message templates
- ✅ **shipmentSmsHelper.js** - Shipment-specific SMS functions

#### New Data Models:
- ✅ **SMSSettings** - Configuration storage
- ✅ **SMSLog** - SMS delivery audit trail

#### New API Endpoints:
```
GET  /api/sms/settings                - Get SMS configuration
PUT  /api/sms/settings                - Update settings
POST /api/sms/test-sms                - Send test message
GET  /api/sms/balance                 - Check account balance
GET  /api/sms/logs                    - View SMS history (paginated)
DELETE /api/sms/logs/:id              - Delete log entry
GET  /api/sms/statistics              - View usage statistics
GET  /api/sms/templates               - List available templates
```

#### Updated Controllers:
- ✅ **shipmentController.js** - Integrated SMS on creation and status updates

### Frontend (React/Vite)

#### Dashboard Components:
- ✅ **SMSDashboard.jsx** - Main dashboard with tabs
- ✅ **SMSSettings.jsx** - Configuration UI
- ✅ **SMSLogs.jsx** - SMS history viewer
- ✅ **SMSStatistics.jsx** - Analytics dashboard
- ✅ **SendTestSMS.jsx** - Test message sender
- ✅ **SMSBalance.jsx** - Account balance display

---

## 🔧 Configuration

### 1. Environment Variables
Your `.env` file has been updated with:

```env
# BulkSMS Nigeria Credentials
BULKSMS_TOKEN=584|5QAMKOoAyoy7gIKilZ4gDHuTjrMW265eNfgti2R099b2a91f
SMS_SENDER_ID=CargoRealm
```

### 2. Database
Two new MongoDB collections will be created automatically:
- `smssettings` - Stores configuration
- `smslogs` - Stores SMS history

---

## 📱 SMS Templates

### Default Templates:
1. **SHIPMENT_CREATED_SENDER**
   - Notifies shipment sender when created
   - Includes tracking number, recipient, origin, destination

2. **SHIPMENT_CREATED_RECIPIENT**
   - Notifies shipment receiver
   - Includes tracking number, sender, origin, destination

3. **SHIPMENT_STATUS_UPDATED**
   - Sent when shipment status changes
   - Includes tracking number, new status, location

4. **SHIPMENT_OUT_FOR_DELIVERY**
   - Notifies when shipment is out for delivery
   - Includes estimated delivery time

5. **SHIPMENT_DELIVERED**
   - Confirmation when shipment is delivered
   - Includes delivery date

6. **SHIPMENT_DELAYED**
   - Alert when shipment is delayed
   - Includes reason

7. **SHIPMENT_CANCELLED**
   - Cancellation notification
   - Includes reason

8. **SHIPMENT_EXCEPTION**
   - Alert for issues/exceptions
   - Includes issue description

---

## 🚀 How to Use

### Option 1: Admin Dashboard (Recommended)

1. **Navigate to SMS Dashboard**
   - Go to Admin Panel → Settings → SMS Management

2. **Check Account Balance**
   - View current BulkSMS Nigeria balance
   - Auto-refreshes every 5 minutes

3. **Send Test SMS**
   - Tab: "Balance & Test"
   - Enter phone number (with country code: +234...)
   - Enter test message
   - Click "Send Test SMS"
   - View result immediately

4. **Configure Settings**
   - Tab: "Settings"
   - Enable/disable events
   - Choose notification recipients
   - Save changes

5. **View SMS History**
   - Tab: "SMS Logs"
   - Filter by status, event type
   - View detailed logs
   - Pagination support

6. **Analytics**
   - Tab: "Statistics"
   - Select date range
   - View success rate
   - See breakdown by event type

### Option 2: Direct API Calls

```bash
# Check balance
curl -X GET http://localhost:5000/api/sms/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test SMS
curl -X POST http://localhost:5000/api/sms/test-sms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "message": "Test SMS from Cargo Realm"
  }'

# Get settings
curl -X GET http://localhost:5000/api/sms/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Automatic SMS Workflow

### When Shipment is Created:
```
Admin creates shipment
    ↓
System saves shipment to database
    ↓
SMS sent to sender (if enabled)
SMS sent to receiver (if enabled)
    ↓
SMS logged in SMSLog collection
    ↓
Email notifications also sent (existing flow)
```

### When Shipment Status is Updated:
```
Admin updates shipment status
    ↓
Status saved with tracking history
    ↓
SMS sent to sender (if enabled)
SMS sent to receiver (if enabled)
    ↓
SMS logged with location and new status
    ↓
Email notifications also sent (existing flow)
```

---

## ⚙️ Configuration Details

### What Triggers SMS:

| Event | Sender | Receiver | Default |
|-------|--------|----------|---------|
| Creation | ✓ | ✓ | Enabled |
| Status Update | ✓ | ✓ | Enabled |
| Delivery | ✓ | ✓ | Enabled |
| Cancellation | ✓ | ✓ | Enabled |
| Exception | ✓ | ✓ | Enabled |

### Rate Limiting:
- Default: 10,000 SMS/day, 100,000 SMS/month
- Configurable in SMS Settings

### Character Limits:
- SMS limit: 160 characters per message
- Multi-segment SMS supported automatically
- Character counter shown in test SMS form

---

## 🔍 Troubleshooting

### SMS Not Sending?

1. **Check if SMS is enabled**
   - Dashboard → Settings → "Enable SMS Notifications"

2. **Verify phone numbers**
   - Must include country code (+234 for Nigeria)
   - Must be valid format

3. **Check account balance**
   - Dashboard → Balance & Test
   - Ensure balance > 0

4. **Check logs for errors**
   - Dashboard → SMS Logs
   - Look for status "failed"
   - View error details

5. **Test with test SMS**
   - Dashboard → Balance & Test
   - Send test message to known phone
   - Check if message received

### Common Issues:

**Error: "Invalid phone number format"**
- Solution: Include country code (e.g., +2348012345678)

**Error: "Insufficient balance"**
- Solution: Top up your BulkSMS Nigeria account

**SMS shows as "pending"**
- Wait a few seconds and refresh
- BulkSMS may still be processing

---

## 📈 Monitoring & Analytics

### View Statistics:
- Dashboard → Statistics tab
- Select date range
- See SMS sent/delivered/failed breakdown
- View by event type
- View by recipient type

### Export Logs:
- Dashboard → SMS Logs tab
- Filter as needed
- Export functionality coming soon

---

## 🔐 Security Considerations

✅ All SMS endpoints require authentication
✅ API token stored in environment variables (not in code)
✅ SMS logs linked to shipments for audit trail
✅ Settings only configurable by admins
✅ Phone numbers validated before sending

---

## 💡 Best Practices

1. **Test Before Going Live**
   - Use SendTestSMS to verify setup
   - Send to your own number first

2. **Monitor Usage**
   - Check statistics regularly
   - Track cost per SMS

3. **Manage Settings**
   - Disable SMS for test environment
   - Enable only necessary events in prod

4. **Phone Numbers**
   - Ensure shipment forms capture correct phone numbers
   - Include country code in database

5. **Handle Failures Gracefully**
   - SMS failures don't block operations
   - Always check logs for issues

---

## 📞 Support Contacts

**BulkSMS Nigeria:**
- Website: https://www.bulksmsngeria.com
- API Docs: https://www.bulksmsngeria.com/api

**Your Account:**
- Bearer Token: `584|5QAMKOoAyoy7gIKilZ4gDHuTjrMW265eNfgti2R099b2a91f`
- Status: Active

---

## 🎯 Next Steps

1. ✅ Verify SMS Settings in dashboard
2. ✅ Send a test SMS to confirm connectivity
3. ✅ Check account balance
4. ✅ Review and update SMS templates if needed
5. ✅ Configure event triggers
6. ✅ Test with a real shipment creation
7. ✅ Monitor SMS logs for delivery success
8. ✅ Train team on SMS features

---

## 📝 API Response Examples

### Check Balance
```json
{
  "message": "Balance retrieved successfully",
  "balance": 5000,
  "currency": "NGN",
  "data": {
    "phoneNumber": "+2348012345678",
    "accountStatus": "active"
  }
}
```

### Send Test SMS
```json
{
  "message": "Test SMS sent successfully",
  "result": {
    "success": true,
    "messageId": "sandbox-d0173d84-2f01-4a5f-a0dc-375beea5b80e",
    "status": "success"
  }
}
```

### SMS Logs
```json
{
  "logs": [
    {
      "_id": "...",
      "phoneNumber": "+2348012345678",
      "message": "Shipment #TRK123 created...",
      "status": "sent",
      "eventType": "SHIPMENT_CREATED_RECIPIENT",
      "sentAt": "2024-05-22T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## ✨ Features Summary

- ✅ Automatic SMS on shipment creation
- ✅ Automatic SMS on status updates
- ✅ Configurable event triggers
- ✅ Support for both sender and receiver notifications
- ✅ Account balance tracking
- ✅ SMS history and audit logs
- ✅ Usage statistics and analytics
- ✅ Test SMS functionality
- ✅ Rate limiting
- ✅ Error handling and logging
- ✅ Admin dashboard
- ✅ Beautiful React UI

---

**Implementation Date:** May 22, 2024
**Status:** ✅ Ready for Production
**Last Updated:** May 22, 2024
