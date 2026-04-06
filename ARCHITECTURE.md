# Premium Payment System - Architecture & Flow

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PREMIUM PAYMENT ACCESS SYSTEM                      │
│                         (1000 TSH, 1-Hour Expiry)                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VideoCard (Premium Badge)                                              │
│       ↓                                                                  │
│  VideoPlayer Modal                                                       │
│  ├─ Input: Phone Number                                                │
│  ├─ Display: "🔒 PREMIUM UNLOCK - 1000 TSH"                           │
│  ├─ Payment Status: input → processing → success/failed                │
│  ├─ Polling: Every 2 seconds (max 30 attempts)                        │
│  ├─ Storage: localStorage.premium_token_all                           │
│  └─ Display: Countdown timer (60m, 59m, ...)                          │
│       ↓                                                                  │
│  API Calls:                                                             │
│  ├─ POST /api/payment/create(phone, 1000)                             │
│  ├─ GET /api/payment/verify(reference)  [polling]                     │
│  └─ POST /api/access/verify-token(token)                              │
│       ↓                                                                  │
│  Video Control:                                                          │
│  ├─ Play: ✅ (when has valid token)                                   │
│  ├─ Download: 🔓 (unlocked during 1-hour access)                      │
│  └─ Status: "Premium Access Active - 45m remaining"                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ (HTTPS)
┌─────────────────────────────────────────────────────────────────────────┐
│ BACKEND (Next.js)                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST /api/payment/create                                               │
│  ├─ Validate: amount_tsh = 1000                                        │
│  ├─ Validate: phone format (07... or +255...)                         │
│  ├─ Call: FastLipa API                                                 │
│  │   POST https://api.fastlipa.com/api/create-transaction             │
│  │   {phone, amount: 1000, reference}                                 │
│  ├─ Store: Payment record (status: pending)                           │
│  └─ Return: payment_reference for polling                             │
│       ↓                                                                  │
│  GET /api/payment/verify?reference=order_xxx                          │
│  ├─ Get: Payment from database                                        │
│  ├─ Call: FastLipa API                                                │
│  │   GET https://api.fastlipa.com/api/status-transaction?tranid=xxx  │
│  ├─ Check: FastLipa response status                                  │
│  ├─ If pending: Return 202 (ask client to retry in 2s)               │
│  ├─ If failed: Return 400 (payment failed)                           │
│  ├─ If paid:                                                          │
│  │   ├─ Update payment status = 'paid'                               │
│  │   ├─ Create access_session:                                       │
│  │   │  {                                                            │
│  │   │   phone_number: '0712345678',                                │
│  │   │   session_token: 'sess_abc123...',                          │
│  │   │   access_start_time: NOW(),                                │
│  │   │   access_expiry_time: NOW() + INTERVAL '1 hour'            │
│  │   │  }                                                           │
│  │   └─ Return: {session_token, expires_at, minutes_remaining}     │
│       ↓                                                                  │
│  POST /api/access/verify-token                                         │
│  ├─ Get: Access session by token                                      │
│  ├─ Check: access_expiry_time > NOW()                                │
│  ├─ If expired: Deactivate session, return 401                       │
│  ├─ If valid: Return {has_access: true, minutes_remaining}           │
│  └─ Used for: Verifying token on page refresh                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ (API)
┌─────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL: FastLipa API                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST /api/create-transaction                                           │
│  ├─ Phone: Tanzanian mobile (07... or +255...)                         │
│  ├─ Amount: 1000 TSH                                                   │
│  └─ Returns: {tranID, status: "PENDING"}                               │
│       ↓                                                                  │
│  User receives SMS on phone:                                           │
│  "Approve 1000 TSH payment?  Reply: 1 to confirm"                     │
│       ↓                                                                  │
│  FastLipa updates transaction status to "PAID"                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ (Query)
┌─────────────────────────────────────────────────────────────────────────┐
│ DATABASE (Supabase PostgreSQL)                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  payments table                                                         │
│  ├─ id (UUID)                                                          │
│  ├─ provider_reference (FastLipa transaction ID)                      │
│  ├─ phone_number (User identifier)                                    │
│  ├─ amount_tsh (Always 1000, enforced by CHECK)                      │
│  ├─ status (pending → paid → success)                                │
│  ├─ verified_at (When FastLipa confirmed)                            │
│  ├─ metadata (FastLipa response)                                      │
│  └─ created_at, updated_at                                            │
│       ↕                                                                  │
│  access_sessions table                                                  │
│  ├─ id (UUID)                                                          │
│  ├─ payment_id (FK to payments)                                        │
│  ├─ session_token (Secure 32-byte random token)                       │
│  ├─ access_start_time (NOW() when payment confirmed)                  │
│  ├─ access_expiry_time (NOW() + 1 hour)                              │
│  ├─ active (Boolean, can be deactivated early)                       │
│  └─ created_at, updated_at, accessed_at (audit trail)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Payment Flow (Timeline)

```
STEP 1: USER INITIATES PAYMENT (T+0s)
┌──────────────────────────────────────┐
│ Frontend: VideoPlayer.tsx            │
│ - User clicks "PAY 1000 TSH"        │
│ - Enters phone: "0712345678"        │
│ - State: processing                  │
│ - Calls: payments.create(phone, 1000)│
└──────────────────────────────────────┘
         ↓ POST /api/payment/create
┌──────────────────────────────────────┐
│ Backend: payment/create/route.ts     │
│ - Validate: amount = 1000 ✓          │
│ - Validate: phone format ✓           │
│ - Call FastLipa API                 │
│   POST /api/create-transaction       │
│ - FastLipa returns: reference        │
│ - Save payment record (pending)      │
│ - Return reference for polling       │
└──────────────────────────────────────┘
         ↓ Response with payment_reference
┌──────────────────────────────────────┐
│ Frontend: Shows "Processing..."      │
│ - Spinner animation                  │
│ - "Check your phone"                 │
│ - Starts polling timer               │
└──────────────────────────────────────┘


STEP 2-N: POLLING LOOP (T+2s to T+60s)
┌──────────────────────────────────────┐
│ Frontend: setInterval every 2 seconds │
│ Attempt #1, #2, #3, ... #30         │
│ Calls: payments.verify(reference)    │
└──────────────────────────────────────┘
         ↓ GET /api/payment/verify?reference=xxx
┌──────────────────────────────────────┐
│ Backend: payment/verify/route.ts     │
│ - Get payment from DB               │
│ - Call FastLipa API:                │
│   GET /api/status-transaction       │
│ - Check response status             │
│                                      │
│ If PENDING:                         │
│   Return 202 "Still processing"    │
│   Frontend retries in 2s            │
│                                      │
│ If FAILED:                          │
│   Return 400 "Payment failed"       │
│   Frontend shows error + retry btn  │
│                                      │
│ If PAID: → STEP 3                   │
└──────────────────────────────────────┘


STEP 3: PAYMENT CONFIRMED (T~20-30s)
┌──────────────────────────────────────┐
│ Backend: payment/verify/route.ts     │
│ - FastLipa status = "PAID"          │
│ - Update payment status = 'paid'    │
│ - Call: createPremiumSession()      │
│   {                                  │
│     payment_id: 'uuid',             │
│     phone_number: '0712345678',     │
│     session_token: 'sess_...',      │
│     access_start_time: NOW(),       │
│     access_expiry_time: NOW()+1h    │
│   }                                  │
│ - Insert into access_sessions       │
│ - Return session_token + expiry     │
└──────────────────────────────────────┘
         ↓ Response with session_token
┌──────────────────────────────────────┐
│ Frontend: VideoPlayer.tsx            │
│ - Receive response.success = true    │
│ - Stop polling (clear interval)     │
│ - Store token: localStorage         │
│   key: 'premium_token_all'         │
│   value: 'sess_abc123xyz'          │
│ - State: success                    │
│ - Show: "✓ Payment Successful!"    │
│   "Premium access for 1 hour"       │
│ - Close modal (modal_open = false)  │
└──────────────────────────────────────┘


STEP 4: VIDEO UNLOCKED (T+21-22s)
┌──────────────────────────────────────┐
│ Frontend: Renders video              │
│ - Video plays ✓                      │
│ - DOWNLOAD button enabled ✓          │
│ - Shows: "✓ PREMIUM ACCESS ACTIVE"  │
│ - Countdown: "Expires in 60 min..."  │
│ - Updates countdown every 60s        │
└──────────────────────────────────────┘


STEP 5: COUNTDOWN & AUTO-LOCK (T+1h)
┌──────────────────────────────────────┐
│ Frontend: Countdown timer            │
│ 60m → 59m → 58m → ... → 1m → 0m    │
│                                      │
│ When minutes_remaining = 0:         │
│ - Remove token from localStorage    │
│ - Video locks automatically         │
│ - "Session Expired" message shown   │
│ - Payment modal reappears on click  │
│ - Requires new 1000 TSH payment     │
└──────────────────────────────────────┘
```

---

## 🔐 Security Features in Action

```
┌─────────────────────────────────────────────────────┐
│ FEATURE: AMOUNT ENFORCEMENT                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Frontend Layer:                                     │
│   - payments.create(phone, 1000)  ← Fixed amount   │
│   - No variable amounts accepted                   │
│                                                     │
│ Backend Validation Layer:                          │
│   - Zod schema: amount_tsh.refine(val => val===1000)│
│   - Rejects any amount ≠ 1000                      │
│   - Returns 400: "Premium costs 1000 TSH"         │
│                                                     │
│ Database Layer:                                    │
│   - Constraint: CHECK (amount_tsh = 1000)         │
│   - Prevents data inconsistency                   │
│   - All audits show exactly 1000 TSH              │
│                                                     │
│ Result: Impossible to pay less than 1000 TSH     │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FEATURE: 1-HOUR EXPIRY ENFORCEMENT                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Database/Server Side:                              │
│   access_start_time = 2026-04-02 11:00:00        │
│   access_expiry_time = 2026-04-02 12:00:00       │
│                                                     │
│ Verification Query:                                │
│   SELECT * FROM access_sessions                   │
│   WHERE access_expiry_time > NOW()                │
│                                                     │
│   At 11:59 → Query: TRUE (valid access)           │
│   At 12:00 → Query: FALSE (expired)               │
│                                                     │
│ Auto-Deactivation:                                │
│   Cron Job runs daily:                            │
│   UPDATE access_sessions                          │
│   SET active = false                              │
│   WHERE access_expiry_time < NOW()                │
│                                                     │
│ Frontend Countdown:                                │
│   Timer not trusted (backend is source of truth)  │
│   Every refresh: verify against backend           │
│   /api/access/verify-token validates expiry      │
│                                                     │
│ Result: Cannot extend session beyond 1 hour       │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FEATURE: API KEY PROTECTION                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Backend Only:                                      │
│   FASTLIPA_API_KEY in .env.local ← Protected      │
│   Used only in: lib/payments.ts                   │
│   Called from: app/api/payment/* routes           │
│                                                     │
│ Frontend Never Sees:                               │
│   ❌ API key not in env.local                     │
│   ❌ Not in environment.ts                        │
│   ❌ Not in localStorage                          │
│   ❌ Not in sessionStorage                        │
│   ❌ Never sent to client                         │
│                                                     │
│ FastLipa Calls:                                    │
│   Header: Authorization: Bearer FASTLIPA_API_KEY  │
│   Made from: Backend only (can't be spoofed)      │
│                                                     │
│ Result: Frontend cannot directly call FastLipa    │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FEATURE: SESSION TOKEN SECURITY                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Token Generation:                                  │
│   32-byte cryptographically secure random         │
│   Format: 'sess_' + hex(random(32))              │
│   Example: sess_a1b2c3d4e5f6g7h8i9j0k1l2m3n...  │
│                                                     │
│ Token Storage:                                     │
│   Database: access_sessions.session_token (unique)│
│   Frontend: localStorage['premium_token_all']    │
│   Verified on: Every video view + page refresh   │
│                                                     │
│ Token Validation:                                  │
│   Query: SELECT * FROM access_sessions           │
│          WHERE session_token = ?                 │
│          AND active = true                       │
│          AND access_expiry_time > NOW()          │
│   If found: has_access = true                    │
│   If not: has_access = false, send 401           │
│                                                     │
│ Token Lifetime:                                    │
│   Created: When payment confirmed                │
│   Expires: After 1 hour (automatic)             │
│   Revoked: SET active = false (early logout)     │
│   Cannot extend: Requires new payment            │
│                                                     │
│ Result: Frontend cannot forge/extend tokens      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   USER      │
│ Tanzanian   │
│ Mobile User │
└──────┬──────┘
       │
       │ 1. Click premium video
       ↓
┌──────────────────────────────┐
│  Frontend: VideoPlayer       │
│  - Show payment modal        │
│  - Input: Phone number       │
│  - Button: "PAY 1000 TSH"   │
└──────┬───────────────────────┘
       │
       │ 2. payments.create(phone, 1000)
       ↓
┌──────────────────────────────┐
│ Backend: /api/payment/create │
│ - Validate amount = 1000      │
│ - Validate phone format       │
│ - Call FastLipa              │
└──────┬───────────────────────┘
       │
       │ 3. POST /create-transaction
       ↓
┌──────────────────────────────┐
│ FastLipa API                 │
│ - Check phone balance        │
│ - Send SMS: "Approve? 1"    │
│ - Status: PENDING            │
└──────┬───────────────────────┘
       │
       │ 4. SMS received on phone
       ↓
┌──────────────────────────────┐
│ User: Mobile Phone           │
│ - Reads SMS                  │
│ - Replies: "1" to confirm   │
└──────┬───────────────────────┘
       │
       │ 5. FastLipa confirms payment
       ↓
┌──────────────────────────────┐
│ FastLipa: Status updates     │
│ Status: PAID                 │
│ Balance deducted: 1000 TSH  │
└──────┬───────────────────────┘
       │
       │ 6. Frontend polling
       │ GET /api/payment/verify?ref=xxx
       ↓
┌──────────────────────────────┐
│ Backend: /api/payment/verify │
│ - Query FastLipa status      │
│ - Status: PAID ✓             │
│ - Create access session      │
│ - Return session_token       │
└──────┬───────────────────────┘
       │
       │ 7. Session token + expiry
       ↓
┌──────────────────────────────┐
│ Frontend: Store Token        │
│ localStorage['premium_token_all']│
│ = 'sess_abc123xyz'           │
└──────┬───────────────────────┘
       │
       │ 8. Video unlocked
       ↓
┌──────────────────────────────┐
│ Video Playback              │
│ - Play: ✓ Enabled           │
│ - Download: 🔓 Unlocked     │
│ - Status: Premium 60m       │
│ - Countdown: 59m, 58m, ...  │
└──────┬───────────────────────┘
       │
       │ 9. After 1 hour
       ↓
┌──────────────────────────────┐
│ Session Auto-Expires        │
│ - access_expiry_time passed │
│ - Token no longer valid     │
│ - localStorage cleared       │
│ - Video auto-locks          │
└──────┬───────────────────────┘
       │
       │ 10. Click video again
       ↓
┌──────────────────────────────┐
│ Payment modal reappears      │
│ Requires new 1000 TSH payment│
└──────────────────────────────┘
```

---

## 🎛️ Configuration & Constants

```javascript
// PREMIUM_CONFIG (lib/access.ts)
{
  AMOUNT_TSH: 1000,          // Fixed payment amount
  DURATION_MINUTES: 60,       // 1 hour access
  DURATION_HOURS: 1,          // For display
  CATEGORY_SLUG: 'connections' // Premium category
}

// Database Constraints
CHECK (amount_tsh = 1000)     // payments table
UNIQUE (session_token)        // access_sessions table
CHECK (active IN (true, false)) // access_sessions table

// Polling Configuration
const maxPollingAttempts = 30;  // 60 seconds total
const pollingIntervalMs = 2000;  // 2 second intervals

// Expiry Enforcement
access_expiry_time = access_start_time + INTERVAL '1 hour'

// Token Generation
const SESSION_TOKEN_PREFIX = 'sess_';
const tokenLength = 32; // bytes
```

---

## ✅ Validation Layers

```
REQUEST: POST /api/payment/create
│
├─ Frontend Validation
│  ├─ Phone format: /^(0|255)\d{9}$/
│  └─ Amount: Only 1000 TSH allowed
│
├─ Backend Schema Validation (Zod)
│  ├─ phone_number: regex check + min length
│  └─ amount_tsh: strict equality to 1000
│
├─ Business Logic Validation
│  ├─ Phone not banned?
│  ├─ User not duplicate payment?
│  └─ FastLipa API responsive?
│
├─ FastLipa API Response
│  ├─ HTTP 200 OK?
│  ├─ Reference returned?
│  └─ Status = PENDING?
│
└─ Database Constraint
   └─ CHECK (amount_tsh = 1000)


RESPONSE: GET /api/payment/verify
│
├─ Payment Record Found?
├─ Amount Still = 1000?
├─ FastLipa API Query Successful?
├─ Status = PAID?
├─ Access Session Created?
├─ Session Expiry = Now + 1 hour?
├─ Token Generated?
└─ Token Unique in Database?
```

---

## 🚀 Performance Characteristics

```
Operation                    Typical Time    Max Time
──────────────────────────────────────────────────────
1. Payment Initiation        ~500ms          2s
   (POST /api/payment/create)

2. FastLipa API Call         ~1-2s           5s
   (create-transaction)

3. Payment Confirmation      15-30s          60s (timeout)
   (polling every 2s)

4. Access Session Creation   ~100ms          500ms
   (INSERT into DB)

5. Token Verification        ~50ms           200ms
   (SELECT from DB)

6. Session Expiry Check      ~10ms           50ms
   (NOW() comparison)

End-to-End: Payment → Access   ~20-30s        ~60s (worst case)

Database Query Performance:
- session_token lookup: O(1) with index
- active sessions count: O(1) view query
- expiry cleanup: O(n) where n = total sessions
```

---

## 📱 Mobile vs Desktop Behavior

```
MOBILE:
├─ Phone input: SMS verification friendly
├─ FastLipa: Works with carrier partnership
├─ Payment modal: Full-screen, easy to read
├─ Storage: localStorage available
├─ Countdown: Always visible
└─ Network: More stable (carrier connection)

DESKTOP:
├─ Phone input: Manual entry or copy-paste
├─ FastLipa: Requires phone nearby for SMS
├─ Payment modal: Centered dialog
├─ Storage: localStorage persistent
├─ Countdown: Sidebar or overlay
└─ Network: Usually stable (WiFi)

Both:
├─ Session token: Works across devices (tied to phone)
├─ Payment: Phone-based (regardless of access device)
└─ Security: Backend validates on every request
```
