# PayPal Webhook Setup Guide

## 📚 What Are Webhooks?

Webhooks are **real-time notifications** that PayPal sends to your server when payment events occur. Instead of you having to check PayPal's API repeatedly, PayPal automatically tells your server when:
- ✅ A payment completes
- ❌ A payment is denied/declined
- 💰 A payment is refunded
- 🔄 A subscription is created/activated/cancelled
- ⚠️ A subscription payment fails

**Without webhooks**: Your server wouldn't know when payments complete, and donations would stay in "pending" status.

---

## 🎯 Step-by-Step Setup

### Step 1: Install ngrok (for Local Testing)

Webhooks need a **publicly accessible URL**. For local development, use ngrok to create a tunnel.

#### Option A: Install via Homebrew (macOS)
```bash
brew install ngrok
```

#### Option B: Download from Website
1. Go to https://ngrok.com/download
2. Download for your OS
3. Extract and add to PATH, or use directly

#### Option C: Use npx (No Installation)
```bash
npx ngrok http 8080
```

### Step 2: Start Your Backend Server

Make sure your backend server is running:
```bash
cd server
npm start
```

Your server should be running on `http://localhost:8080` (or your configured PORT).

### Step 3: Start ngrok Tunnel

In a **new terminal window**, start ngrok:
```bash
ngrok http 8080
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok.io -> http://localhost:8080
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok.io`) - you'll need this for the webhook URL.

⚠️ **Important**: 
- The ngrok URL changes each time you restart ngrok (free tier)
- For production, use your actual domain instead of ngrok

### Step 4: Get Your PayPal Webhook URL

Your webhook endpoint is:
```
https://your-ngrok-url.ngrok.io/api/webhooks/paypal
```

**Example**:
```
https://abc123xyz.ngrok.io/api/webhooks/paypal
```

### Step 5: Create Webhook in PayPal Dashboard

1. **Go to PayPal Developer Dashboard**
   - Visit: https://developer.paypal.com/dashboard
   - Log in with your PayPal developer account

2. **Navigate to Your App**
   - Click on "My Apps & Credentials"
   - Select your **Sandbox** app (or Live app for production)
   - If you don't have an app, create one first

3. **Go to Webhooks Section**
   - Scroll down to find "Webhooks" section
   - Click "Add Webhook" or "Create Webhook"

4. **Enter Webhook Details**
   - **Webhook URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/paypal`
     - Replace `your-ngrok-url.ngrok.io` with your actual ngrok URL
   - **Event types**: Select the following events from the categories:

   **From "Payments & Payouts" category:**
   - ✅ Expand "Payments & Payouts" dropdown
   - ✅ Select: `Payment capture completed` (or `PAYMENT.CAPTURE.COMPLETED`)
   - ✅ Select: `Payment capture denied` (or `PAYMENT.CAPTURE.DENIED`)
   - ✅ Select: `Payment capture refunded` (or `PAYMENT.CAPTURE.REFUNDED`)

   **From "Billing subscription" category:**
   - ✅ Expand "Billing subscription" dropdown
   - ✅ Select: `Billing subscription created`
   - ✅ Select: `Billing subscription activated`
   - ✅ Select: `Billing subscription cancelled`
   - ✅ Select: `Billing subscription payment failed`
   - ✅ Select: `Billing subscription suspended`
   - ✅ Select: `Billing subscription re-activated` (optional, for reactivated subscriptions)

   **Alternative Option:**
   - You can select **"All Events"** at the top to subscribe to all events (including future ones)
   - This is simpler but will receive more events than needed
   - Your server will handle only the events it recognizes

5. **Save the Webhook**
   - Click "Save" or "Create Webhook"
   - PayPal will immediately send a test event to verify the URL works

### Step 6: Get Your Webhook ID

After creating the webhook:

1. **Find the Webhook ID**
   - In the webhooks list, you'll see your webhook
   - The **Webhook ID** is displayed in the "Webhook ID" column
   - It may look like: `89S27799PN011631B` or `WH-2WR32451HC0233532-67976317HY6582734`
   - **Note**: Webhook IDs can have different formats (some start with `WH-`, some don't)

2. **Copy the Webhook ID**
   - Look in the "Webhook ID" column of the webhooks table
   - Copy the **entire Webhook ID exactly as shown** (don't add or remove anything)
   - Example: If it shows `89S27799PN011631B`, use exactly that

### Step 7: Add Webhook ID to Environment Variables

1. **Open `server/.env` file**

2. **Add the Webhook ID**:
   ```bash
   PAYPAL_WEBHOOK_ID=89S27799PN011631B
   ```

3. **Save the file**

4. **Restart your server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm start
   ```

### Step 8: Verify Webhook is Working

1. **Check Server Logs**
   - When PayPal sends the test event, you should see:
     ```
     Received PayPal webhook: PAYMENT.CAPTURE.COMPLETED
     ```
   - If you see webhook verification warnings, check that `PAYPAL_WEBHOOK_ID` is set correctly

2. **Test with a Real Payment**
   - Make a test donation
   - Check server logs for webhook events
   - Verify donation status updates automatically

3. **Check ngrok Web Interface**
   - Visit: http://localhost:4040 (ngrok web interface)
   - You can see all HTTP requests, including webhook calls from PayPal

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] ngrok is running and forwarding to `localhost:8080`
- [ ] Backend server is running
- [ ] Webhook created in PayPal dashboard
- [ ] Webhook URL is correct (ends with `/api/webhooks/paypal`)
- [ ] All required events are selected
- [ ] Webhook ID copied to `server/.env`
- [ ] Server restarted after adding Webhook ID
- [ ] No webhook verification warnings in server logs
- [ ] Test payment triggers webhook event

---

## 🚀 Production Setup

For production, the process is similar but with your actual domain:

1. **Use Your Production Domain**
   - Instead of ngrok, use your actual domain
   - Example: `https://yourdomain.com/api/webhooks/paypal`

2. **Use Live PayPal App**
   - Switch to your **Live** app in PayPal dashboard
   - Create webhook with production URL

3. **Update Environment Variables**
   - Set `PAYPAL_MODE=live` in `server/.env`
   - Use live PayPal credentials
   - Set `PAYPAL_WEBHOOK_ID` to production webhook ID

4. **HTTPS Required**
   - PayPal requires HTTPS for webhooks
   - Make sure your production server has valid SSL certificate

---

## 🐛 Troubleshooting

### Problem: "Webhook URL not accessible"

**Solution**:
- Make sure ngrok is running
- Check that ngrok URL matches webhook URL in PayPal
- Verify backend server is running on correct port
- Check firewall/network settings

### Problem: "Invalid webhook signature"

**Solution**:
- Verify `PAYPAL_WEBHOOK_ID` is correct in `.env`
- Make sure you copied the entire Webhook ID exactly as shown (don't add "WH-" prefix unless it's already there)
- Restart server after adding Webhook ID
- Check that you're using the correct app (sandbox vs live)
- Webhook IDs can have different formats - use exactly what PayPal shows

### Problem: "Webhook events not received"

**Solution**:
- Check ngrok web interface (http://localhost:4040) to see if requests are coming
- Verify webhook URL in PayPal dashboard is correct
- Check server logs for errors
- Make sure all required events are selected in PayPal
- Test webhook manually from PayPal dashboard (if available)

### Problem: "ngrok URL changes every time"

**Solution**:
- This is normal for free ngrok tier
- Update webhook URL in PayPal dashboard each time
- Or upgrade to ngrok paid plan for static URL
- For production, use your actual domain (doesn't change)

### Problem: "Webhook verification warning"

**Solution**:
- This means `PAYPAL_WEBHOOK_ID` is not set
- Add `PAYPAL_WEBHOOK_ID` to `server/.env`
- Restart server
- Warning should disappear

---

## 📋 Quick Reference

### Webhook Endpoint
```
POST /api/webhooks/paypal
```

### Required Environment Variable
```bash
PAYPAL_WEBHOOK_ID=89S27799PN011631B
```
**Note**: Use the Webhook ID exactly as shown in PayPal dashboard (may or may not start with "WH-")

### Webhook URL Format
```
https://your-domain.com/api/webhooks/paypal
```

### Required Events

**From "Payments & Payouts" category:**
- `Payment capture completed` (or `PAYMENT.CAPTURE.COMPLETED`)
- `Payment capture denied` (or `PAYMENT.CAPTURE.DENIED`)
- `Payment capture refunded` (or `PAYMENT.CAPTURE.REFUNDED`)

**From "Billing subscription" category:**
- `Billing subscription created` (or `BILLING.SUBSCRIPTION.CREATED`)
- `Billing subscription activated` (or `BILLING.SUBSCRIPTION.ACTIVATED`)
- `Billing subscription cancelled` (or `BILLING.SUBSCRIPTION.CANCELLED`)
- `Billing subscription payment failed` (or `BILLING.SUBSCRIPTION.PAYMENT.FAILED`)
- `Billing subscription suspended` (or `BILLING.SUBSCRIPTION.SUSPENDED`)

**Alternative:**
- `All Events` - Select this to subscribe to all events (simpler but receives more events)

---

## 🎓 Understanding Webhook Flow

```
1. User makes donation
   ↓
2. Payment is processed by PayPal
   ↓
3. PayPal sends webhook event to your server
   ↓
4. Your server verifies webhook signature (using Webhook ID)
   ↓
5. Your server processes the event:
   - Updates donation status
   - Updates project total
   - Updates user donor profile
   ↓
6. Server responds 200 OK to PayPal
```

---

## 📖 Additional Resources

- PayPal Webhook Documentation: https://developer.paypal.com/docs/api-basics/notifications/webhooks/
- ngrok Documentation: https://ngrok.com/docs
- PayPal Webhook Events: https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/

---

## ✅ Success Indicators

You'll know webhooks are working when:

1. ✅ No verification warnings in server logs
2. ✅ Webhook events appear in server logs after payments
3. ✅ Donation status updates automatically (pending → completed)
4. ✅ Project totals update automatically
5. ✅ Failed payments are rolled back automatically
6. ✅ Subscription events are processed automatically

---

**Need Help?** Check the troubleshooting section or review server logs for specific error messages.
