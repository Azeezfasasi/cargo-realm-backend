# BulkSMS API Token - How to Get a Valid Token

## Issue
Your current API token is being rejected with error:
- Status: 401 Unauthorized
- Error: "Invalid API token. Please check your credentials and try again."

## Solution: Generate a New API Token

### Step 1: Log in to BulkSMS Nigeria Dashboard
1. Go to https://www.bulksmsnigeria.com
2. Log in with your account credentials
3. Navigate to your account settings or API section

### Step 2: Generate/Regenerate API Token
1. Look for "API Settings" or "API Credentials" section
2. Find your API token (or click "Generate New Token" if needed)
3. Copy the full token value

### Step 3: Update Your .env File
Replace the `BULKSMS_TOKEN` value in `.env`:

```env
BULKSMS_TOKEN=YOUR_NEW_API_TOKEN_HERE
BULKSMS_BASE_URL=https://www.bulksmsnigeria.com/api/v2
BULKSMS_AUTH_METHOD=query-param
```

### Step 4: Restart Your Backend Server
Stop the current server and restart it:
```bash
npm start
```

## Testing the New Token

Run the test script:
```bash
node test-sms-api.js
```

Expected output on success:
```
✓ SUCCESS
Response: {
  "status": "success",
  "code": "BSNG-0000",
  "message": "Balance retrieved successfully",
  "data": {
    "balance": XXXX.XX,
    "currency": "NGN",
    "formatted": "₦XXXX.XX"
  }
}
```

## Authentication Methods Configured

Your backend now supports multiple authentication methods. Currently using: **query-param**

Available methods in `.env`:
- `query-param` - Token passed as URL parameter (current)
- `bearer` - Token in Authorization header
- `custom-header` - Token in custom api_token header
- `request-body` - Token in request body

To switch methods, update `BULKSMS_AUTH_METHOD` in `.env` and restart the server.

## Troubleshooting

If you still get 401 errors after updating the token:
1. Verify the token is copied exactly without extra spaces
2. Check if the token has been revoked in your BulkSMS dashboard
3. Ensure your BulkSMS account has active credits
4. Verify your account permissions include SMS API access
5. Try regenerating a new token from the dashboard

## Files Modified
- `.env` - Updated BULKSMS_AUTH_METHOD to query-param
- `utils/smsService.js` - Added support for multiple auth methods
- `test-sms-api.js` - Updated to test with new auth methods
