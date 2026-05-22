# SMS Templates Reference

## Overview
All SMS templates are stored in `utils/smsTemplates.js`. Each template is optimized for the 160-character SMS limit.

---

## Available Templates

### 1. SHIPMENT_CREATED_SENDER
**When:** Shipment is created
**Recipient:** Shipment sender
**Parameters:** trackingNumber, recipientName, origin, destination

**Current Template:**
```
Dear Sender, your shipment {trackingNumber} to {recipientName} has been created. 
From: {origin} To: {destination}. Track: cargorealmandlogistics.com
```

**Character Count:** 159 (optimal)

---

### 2. SHIPMENT_CREATED_RECIPIENT
**When:** Shipment is created
**Recipient:** Shipment receiver
**Parameters:** trackingNumber, senderName, origin, destination

**Current Template:**
```
Dear Recipient, you have an incoming shipment {trackingNumber} from {senderName}. 
From: {origin} To: {destination}. Track: cargorealmandlogistics.com
```

**Character Count:** 161 (2-segment SMS)

---

### 3. SHIPMENT_STATUS_UPDATED
**When:** Shipment status changes
**Recipient:** Both sender and receiver (if enabled)
**Parameters:** trackingNumber, newStatus, location

**Current Template:**
```
Shipment {trackingNumber} status updated to {newStatus}. 
Location: {location}. Track: cargorealmandlogistics.com
```

**Character Count:** 112 (single SMS)

---

### 4. SHIPMENT_OUT_FOR_DELIVERY
**When:** Shipment is out for delivery
**Recipient:** Both parties
**Parameters:** trackingNumber, estimatedDeliveryTime

**Current Template:**
```
Shipment {trackingNumber} is out for delivery today. 
ETA: {estimatedDeliveryTime}. Track: cargorealmandlogistics.com
```

**Character Count:** 113 (single SMS)

---

### 5. SHIPMENT_DELIVERED
**When:** Shipment is delivered
**Recipient:** Both sender and receiver
**Parameters:** trackingNumber, deliveryDate

**Current Template:**
```
Shipment {trackingNumber} has been delivered on {deliveryDate}. 
Thank you for using CargoRealm! Track: cargorealmandlogistics.com
```

**Character Count:** 134 (single SMS)

---

### 6. SHIPMENT_DELAYED
**When:** Shipment is delayed
**Recipient:** Both parties
**Parameters:** trackingNumber, reason

**Current Template:**
```
Shipment {trackingNumber} is delayed. Reason: {reason}. 
We apologize for the inconvenience. Track: cargorealmandlogistics.com
```

**Character Count:** 127 (single SMS)

---

### 7. SHIPMENT_CANCELLED
**When:** Shipment is cancelled
**Recipient:** Both parties
**Parameters:** trackingNumber, reason

**Current Template:**
```
Shipment {trackingNumber} has been cancelled. Reason: {reason}. 
Contact support for refund. Track: cargorealmandlogistics.com
```

**Character Count:** 119 (single SMS)

---

### 8. SHIPMENT_EXCEPTION
**When:** Issue or exception occurs
**Recipient:** Both parties
**Parameters:** trackingNumber, issue

**Current Template:**
```
Alert: Shipment {trackingNumber} encountered an issue: {issue}. 
Contact support immediately. Track: cargorealmandlogistics.com
```

**Character Count:** 126 (single SMS)

---

### 9. GENERIC_NOTIFICATION
**When:** Custom notifications
**Recipient:** Any
**Parameters:** trackingNumber, message

**Current Template:**
```
{message} Tracking: {trackingNumber}. Track: cargorealmandlogistics.com
```

**Character Count:** Variable

---

## Customization Guide

### How to Modify Templates

1. **Edit `utils/smsTemplates.js`**
   
2. **Update the template function:**
   ```javascript
   SHIPMENT_CREATED_SENDER: (trackingNumber, recipientName, origin, destination) => {
     return `Your custom message here. Tracking: ${trackingNumber}`;
   }
   ```

3. **Keep under 160 characters** for optimal SMS delivery
   - Messages over 160 chars = 2 SMS segments (2x cost)
   - Use abbreviations to save space

4. **Always include tracking number** for customer convenience

5. **Use curly braces** `{}` to show placeholder variables in documentation

---

## SMS Customization Examples

### Example 1: Shorter & Simpler
```
Shipment {trackingNumber} status: {newStatus}. Loc: {location}. 
Track: bit.ly/cargorealm (119 chars)
```

### Example 2: More Detailed
```
Hi! Your CargoRealm shipment {trackingNumber} is now {newStatus} at {location}. 
Last updated: Today. Questions? Contact us: +2348012345678 (142 chars)
```

### Example 3: With Call-to-Action
```
Shipment {trackingNumber} updated: {newStatus}. View details & track live 
on CargoRealm app. Download now! (123 chars)
```

### Example 4: Friendly Tone
```
Great news! Your shipment #{trackingNumber} is {newStatus} and heading your way!
ETA: {location}. Thank you! (116 chars)
```

---

## Best Practices for SMS Content

✅ **DO:**
- Keep messages clear and concise
- Always include tracking number
- Use simple, friendly language
- Include tracking link/URL
- Break long messages across lines for readability
- Use abbreviations (Est. = Estimated, Pkg = Package)
- Include call-to-action or support contact

❌ **DON'T:**
- Exceed 160 characters unless necessary
- Use complex terminology
- Include multiple calls-to-action
- Ask for personal information (security risk)
- Use all CAPS (seems like shouting)
- Include links without shortening them

---

## SMS Segment Chart

| Characters | SMS Segments | Cost Multiplier |
|------------|--------------|-----------------|
| 1-160     | 1 SMS        | 1x             |
| 161-306   | 2 SMS        | 2x             |
| 307-459   | 3 SMS        | 3x             |
| 460-612   | 4 SMS        | 4x             |

---

## Localization Examples

### For Yoruba Language
```javascript
SHIPMENT_CREATED_SENDER: (trackingNumber, recipientName, origin, destination) => {
  return `Ẹ̀yin, àdìe rẹ ${trackingNumber} fun ${recipientName} ti fi ita. 
O: ${origin} Si: ${destination}. ${trackingNumber}`;
}
```

### For Hausa Language
```javascript
SHIPMENT_CREATED_SENDER: (trackingNumber, recipientName, origin, destination) => {
  return `Sannu, abin ku ${trackingNumber} ga ${recipientName} an shiqa. 
Daga: ${origin} Zuwa: ${destination}. ${trackingNumber}`;
}
```

---

## Template Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| trackingNumber | Shipment tracking ID | TRK#123456789 |
| senderName | Name of sender | John Doe |
| recipientName | Name of receiver | Jane Smith |
| origin | Shipment origin city | Lagos |
| destination | Shipment destination | Abuja |
| newStatus | Updated status | In Transit |
| location | Current location | Ibadan |
| estimatedDeliveryTime | ETA | Today 3PM |
| deliveryDate | Actual delivery date | May 22, 2024 |
| reason | Reason for delay/cancel | Weather delay |
| issue | Exception detail | Address not found |
| message | Custom message | Any text |

---

## URL Shortening

For tracking links, use:
- `bit.ly/cargorealm` (pre-configured)
- `tinyurl.com/cargorealm`
- Your own shortened domain

**Benefits:**
- Saves characters
- Professional appearance
- Trackable analytics

---

## Testing Different Templates

### Via Dashboard
1. Go to SMS Management → Balance & Test
2. Enter phone number
3. Type custom message
4. Send and verify

### Via API
```bash
curl -X POST http://localhost:5000/api/sms/test-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+2348012345678",
    "message": "Test message up to 480 chars"
  }'
```

---

## Performance Tips

1. **Keep it short** - More likely to read
2. **Use numbers** - "123" uses less space than "one two three"
3. **Abbreviate** - "pkg" vs "package", "addr" vs "address"
4. **Remove extras** - "pls" not "please", "ur" not "your"
5. **Use punctuation wisely** - Periods save space vs colons

---

## Emergency Notifications

For urgent issues, use a separate template:

```javascript
SHIPMENT_CRITICAL_ALERT: (trackingNumber, issue) => {
  return `🚨 ALERT: Shipment ${trackingNumber} - ${issue}. 
Action needed now. Contact: +2348012345678`;
}
```

---

## Compliance Notes

- ✅ Include clear call-to-action
- ✅ Include contact information if possible
- ✅ Be honest about shipment status
- ✅ Respect user preferences (SMS settings)
- ✅ Include tracking information
- ✅ Clear sender identification

---

## Template Modification Checklist

Before deploying custom templates:

- [ ] Under 160 characters (if single SMS)
- [ ] Includes tracking number
- [ ] Clear and professional tone
- [ ] All variables properly formatted
- [ ] No grammatical errors
- [ ] Tested with sample data
- [ ] Reviewed by team
- [ ] Backup old template saved

---

## Version History

**Current Version:** 1.0
**Last Updated:** May 22, 2024
**Templates:** 9 (8 events + 1 generic)
**Language:** English
**Encoding:** UTF-8

---

## Support

For SMS template customization:
1. Edit `utils/smsTemplates.js`
2. Test via SMS Dashboard
3. Deploy to production
4. Monitor SMS delivery rates

**Need help?** Check SMS logs for template issues or contact support.
