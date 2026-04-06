# Premium Payment Access System

Complete backend and frontend implementation for premium video access with FastLipa integration.

## 📋 Overview

This system enables:
- **Fixed 1000 TSH payment** for premium video access
- **1-hour expiry** - automatic access revocation after 60 minutes
- **Backend verification** - FastLipa is source of truth for payments
- **Session tokens** - secure access control without relying on frontend
- **Phone-based identification** - links payment to user

## 🏗️ System Architecture

```
User clicks premium video
         ↓
[Frontend] Show payment modal
         ↓
User enters phone number → POST /api/payment/create
         ↓
[Backend] Call FastLipa API
         ↓
Create payment record (status: pending)
         ↓
Return payment_reference to frontend
         ↓
[Frontend] Poll /api/payment/verify with reference
         ↓
[Backend] Query FastLipa for payment status
         ↓
If PAID:
  - Create access_session with 1-hour expiry
  - Return session_token
         ↓
[Frontend] Store session_token in localStorage
         ↓
[Frontend] Unlock video, show "Premium Access Active - 60 min remaining"
         ↓
After 1 hour:
  - Session expires automatically
  - Video locks again
  - Requires new payment
```

## 💰 Fixed Pricing

- **Amount**: 1000 TSH (strictly enforced)
- **Duration**: 1 hour (60 minutes) of access
- **Scope**: Entire "Connections" premium category
- **Applies to**: All videos in premium categories

## 🔌 Backend Endpoints

### 1. **POST /api/payment/create**
Initiates payment with FastLipa

**Request:**
```json
{
  "phone_number": "0712345678",  // or +255712345678
  "amount_tsh": 1000  // Always exactly 1000 TSH
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_reference": "order_1234567890_abc123",
    "status": "pending",
    "amount_tsh": 1000,
    "message": "Payment initiated. Check your phone.",
    "polling_url": "/api/payment/verify?reference=order_1234567890_abc123"
  }
}
```

**Errors:**
- `400`: Invalid phone format or amount ≠ 1000
- `500`: FastLipa service error

---

### 2. **GET /api/payment/verify?reference=order_xxx**
Checks payment status with FastLipa (polls until completion)

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "status": "paid",
    "amount_tsh": 1000,
    "access": {
      "session_token": "sess_abc123xyz",
      "expires_at": "2026-04-02T12:00:00Z",
      "duration_hours": 1,
      "minutes_remaining": 60
    },
    "message": "Payment confirmed! Premium access granted for 1 hour."
  }
}
```

**Response (202 - Pending):**
```json
{
  "success": false,
  "message": "Payment still processing. Try again in 2 seconds.",
  "retry_in_ms": 2000
}
```

**Response (400 - Failed):**
```json
{
  "success": false,
  "message": "Payment failed. Please try again."
}
```

---

### 3. **POST /api/access/verify-token**
Verifies session token and returns remaining access time (1-hour max)

**Request:**
```json
{
  "session_token": "sess_abc123"
}
```

**Response (200 - Valid):**
```json
{
  "success": true,
  "data": {
    "has_access": true,
    "expires_at": "2026-04-02T12:00:00Z",
    "minutes_remaining": 45,
    "duration_hours": 1,
    "message": "Premium access active. Expires in 45 minutes."
  }
}
```

**Response (401 - Expired):**
```json
{
  "success": false,
  "data": {
    "has_access": false,
    "message": "Session expired. Purchase access again."
  }
}
```

---

## 🎨 Frontend Integration

### VideoPlayer Component

The VideoPlayer component automatically:
1. Shows payment modal for premium videos
2. Handles payment initiation
3. **Polls** for payment confirmation every 2 seconds
4. Creates access session on success
5. Displays countdown timer (1 hour remaining)
6. Auto-locks video when session expires

**Usage:**
```tsx
<VideoPlayer 
  video={videoData}
  isPremium={true}  // Triggers payment modal
  onClose={() => setSelectedVideo(null)}
/>
```

### Payment Flow (Frontend)

```
1. User clicks premium video
2. VideoPlayer shows modal: "🔒 PREMIUM UNLOCK - 1000 TSH"
3. User enters phone number
4. Click "PAY 1000 TSH"
5. VideoPlayer calls: payments.create(phone, 1000)
6. Backend initiates FastLipa payment
7. VideoPlayer polls: payments.verify(reference) every 2 seconds
8. When FastLipa confirms PAID:
   - VideoPlayer receives session_token
   - Stores in localStorage: premium_token_all
   - Displays: "Premium Access Active - 60 min remaining"
   - Unlocks video download button
9. User watches video with countdown timer
10. After 60 minutes: Session expires, video locks
```

### Storage of Session Tokens

```typescript
// Session token stored in localStorage for persistent access
localStorage.setItem('premium_token_all', session_token);
localStorage.setItem(`premium_token_${video_id}`, session_token);

// Frontend checks before showing payment modal
const hasToken = localStorage.getItem('premium_token_all');
if (hasToken) {
  const valid = await access.verifyToken(hasToken);
  if (valid) showVideo(); // No modal needed
}
```

---

## 🗄️ Database Tables

### `payments`
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  provider VARCHAR(50),          -- 'fastlipa'
  provider_reference VARCHAR(255), -- FastLipa transaction ID
  phone_number VARCHAR(20),      -- User's phone number
  amount_tsh INTEGER,            -- Always 1000
  status VARCHAR(50),            -- pending, paid, failed, expired
  verified_at TIMESTAMP,         -- When payment was confirmed
  metadata JSONB,                -- FastLipa response details
  created_at TIMESTAMP
);

Constraints:
- amount_tsh CHECK (amount_tsh = 1000)
- provider_reference UNIQUE
```

### `access_sessions`
```sql
CREATE TABLE access_sessions (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  phone_number VARCHAR(20),
  session_token VARCHAR(255) UNIQUE,
  access_start_time TIMESTAMP,   -- When access started
  access_expiry_time TIMESTAMP,  -- Start time + 1 hour
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

Indexes:
- session_token (for quick verification)
- active & access_expiry_time (for expiry cleanup)
```

---

## 🔐 Security Features

### 1. **Backend Source of Truth**
- FastLipa verification happens **server-to-server only**
- Frontend cannot spoof payment confirmation
- Session tokens are database-verified, not client-generated

### 2. **Token Security**
- Session tokens are cryptographically secure (32-byte random + prefix)
- Tokens stored in database with expiry timestamp
- Tokens auto-expire after 1 hour regardless of frontend state

### 3. **Amount Enforcement**
- Validation schema enforces exactly 1000 TSH
- Backend rejects any other amount
- Database constraint: `CHECK (amount_tsh = 1000)`

### 4. **API Key Protection**
- FastLipa API key stored in `.env.local` (backend only)
- Never exposed to frontend
- All FastLipa calls made from backend

### 5. **Direct URL Prevention**
- Video URLs require valid session token
- Frontend checks token before playing video
- Backend can optionally validate on download/stream requests

---

## 📱 Payment Flow Details

### Step 1: User Initiates Payment
```
POST /api/payment/create
{
  "phone_number": "0712345678",
  "amount_tsh": 1000
}
```

### Step 2: Backend Creates Payment Record
```
INSERT INTO payments (
  provider: 'fastlipa',
  provider_reference: 'order_...',
  phone_number: '0712345678',
  amount_tsh: 1000,
  status: 'pending'
)
```

### Step 3: Backend Calls FastLipa
```
POST https://api.fastlipa.com/api/create-transaction
Headers: Authorization: Bearer FASTLIPA_API_KEY
Body: {
  "phone": "255712345678",
  "amount": 1000,
  "reference": "order_..."
}
```

### Step 4: Frontend Polls for Confirmation
```
GET /api/payment/verify?reference=order_...
(Every 2 seconds for up to 60 seconds)
```

### Step 5: Backend Verifies with FastLipa
```
GET https://api.fastlipa.com/api/status-transaction?tranid=order_...
```

### Step 6: Payment Confirmed → Create Session
```
UPDATE payments SET status = 'paid', verified_at = NOW()

INSERT INTO access_sessions (
  payment_id: '...',
  phone_number: '0712345678',
  session_token: 'sess_...',
  access_start_time: NOW(),
  access_expiry_time: NOW() + INTERVAL '1 hour'
)
```

### Step 7: Return Access Token to Frontend
```json
{
  "session_token": "sess_abc123",
  "expires_at": "2026-04-02T12:00:00Z",
  "minutes_remaining": 60
}
```

---

## ⏰ Expiry Enforcement

### Server-Side
- Database query: Check `access_expiry_time > NOW()`
- Auto-cleanup job: Mark expired sessions as inactive
- API validation: Return 401 if expired

### Client-Side
- Countdown timer: Shows "60m, 59m, 58m, ..."
- Local check: Compare expires_at with current time
- On expiry: Remove token from localStorage, lock video

### Re-Authentication
After expiry, user must:
1. Click premium video again
2. Pay another 1000 TSH for new 1-hour session
3. No carry-over from previous sessions

---

## 📊 Configuration

### Environment Variables (Backend)

```bash
# .env.local

# FastLipa Configuration
FASTLIPA_API_URL=https://api.fastlipa.com
FASTLIPA_API_KEY=FastLipa_UX2wIH6xC2fyGPFsHCsY1DoBe

# Premium Access Duration
PREMIUM_DURATION_MINUTES=60  # 1 hour

# Premium Price (fixed)
PREMIUM_PRICE_TSH=1000

# JWT Secret (for session tokens if used)
JWT_SECRET=your_jwt_secret_here

# Supabase
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...
```

---

## 🧪 Testing the Payment System

### Manual Test Flow

1. **Start servers:**
   ```bash
   cd chombezo-backend && npm run dev      # Port 3001
   cd static-stream && npm run dev          # Port 8081
   ```

2. **Open frontend:**
   ```
   http://localhost:8081
   ```

3. **Navigate to Connections (premium) category**

4. **Click a premium video**
   - Payment modal appears: "🔒 PREMIUM UNLOCK"
   - Amount: 1000 TSH

5. **Enter test phone number:**
   ```
   0712345678
   or
   +255712345678
   ```

6. **Click "PAY 1000 TSH"**
   - Modal shows "Processing payment..."
   - Polling starts (every 2 seconds)

7. **Verify with FastLipa:**
   - Check FastLipa dashboard for transaction
   - Manually mark as PAID (if possible in test mode)
   - Or wait for automatic confirmation

8. **Session Created:**
   - Modal shows success checkmark ✓
   - Video unlocks
   - Shows "Premium Access Active - 60m remaining"

9. **Test Download:**
   - DOWNLOAD button becomes active
   - Click to download video

10. **Wait for Expiry (or Force):**
    - After 1 hour: Video auto-locks
    - Or: Clear localStorage: `premium_token_all`
    - Then: Refresh page
    - Video requires payment again

---

## 🐛 Troubleshooting

### "Invalid phone number format"
- Make sure phone is: `07xxxxxxxxx` or `+255...`
- Not: `+256` (Uganda), `+234` (Nigeria), etc.
- Only Tanzania numbers allowed

### "Limit cannot exceed 100" (when fetching videos)
- This is pagination limit
- Already fixed: backend max 150, frontend requests 150

### "FastLipa service error"
- Check FASTLIPA_API_KEY in .env.local
- Check FASTLIPA_API_URL
- Verify network connectivity
- Check FastLipa dashboard for errors

### "Payment still pending" after 60 seconds
- Clear browser cache
- Refresh and try again
- Check FastLipa dashboard for status
- May need to retry payment initiation

### Session token not working
- Verify token format: starts with `sess_`
- Check localStorage: `premium_token_all`
- Verify expiry hasn't passed
- Call `/api/access/verify-token` directly to debug

---

## 📈 Monitoring & Analytics

### View Active Sessions
```sql
SELECT * FROM v_active_premium_sessions;
```

Output:
```
active_sessions | unique_users | snapshot_time
      5         |      4       | 2026-04-02T11:15:00Z
```

### View Daily Revenue
```sql
SELECT * FROM v_daily_revenue ORDER BY pay_date DESC;
```

Output:
```
pay_date   | transaction_count | revenue_tsh | pending_count | failed_count
2026-04-02 |        12         |   12000     |      2        |      1
2026-04-01 |        8          |    8000     |      0        |      0
```

---

## 🚀 Deployment Checklist

- [ ] Run database migrations: `PREMIUM_SYSTEM_SCHEMA.sql`
- [ ] Set environment variables in backend `.env.local`
- [ ] Verify FastLipa API credentials work
- [ ] Test payment flow end-to-end
- [ ] Test 1-hour expiry enforcement
- [ ] Monitor first payments in production
- [ ] Set up monitoring for failed payments
- [ ] Configure FastLipa webhook (optional)
- [ ] Document support process for payment issues

---

## 📚 Files Modified

### Backend

- `lib/access.ts` - Session token generation & verification
- `lib/payments.ts` - FastLipa API integration
- `lib/validation.ts` - Schema enforcement (1000 TSH)
- `app/api/payment/create/route.ts` - Initiate payment
- `app/api/payment/verify/[reference]/route.ts` - Verify payment status
- `app/api/access/verify-token/route.ts` - Check session validity

### Frontend

- `src/components/VideoPlayer.tsx` - Payment modal with polling
- `src/lib/api-client.ts` - Payment API methods
- localStorage - Session token storage

### Database

- `migrations/PREMIUM_SYSTEM_SCHEMA.sql` - Tables & triggers

---

## 📞 Support

**Issue:** Payment confirmed but video still locked
- Check session token in localStorage: `console.log(localStorage.getItem('premium_token_all'))`
- Verify expiry: Call `/api/access/verify-token` endpoint
- Clear cache and reload

**Issue:** FastLipa errors
- Check API key formatting
- Verify phone number is Tanzanian
- Check FastLipa dashboard for any rate limits

**Issue:** Session timestamp issues
- Ensure server time is synchronized (NTP)
- Check database defaults for created_at timestamps

---

## 🎓 Future Enhancements

- [ ] Multiple payment methods (M-Pesa, credit card, etc.)
- [ ] Extended duration options (1 day, 1 week, 1 month)
- [ ] Subscription plans
- [ ] Payment receipts via SMS
- [ ] Refund handling
- [ ] Regional pricing
- [ ] Family sharing (one payment for multiple users)
- [ ] Offline access with token verification
