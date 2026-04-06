# UZIMA PROJECT - Complete Architecture & Analysis

**Last Updated:** April 2, 2026  
**Project Status:** Multi-project structure with video streaming + FastLipa payments

---

## 📊 Project Structure Overview

```
uzima/
├── chombezo-backend/          # Next.js Backend (Production)
│   ├── app/api/                 # API Routes (Next.js App Router)
│   ├── lib/                     # Core business logic
│   ├── types/                   # TypeScript definitions
│   ├── middleware.ts            # CORS & auth middleware
│   └── package.json             # Next.js dependencies
│
├── static-stream/              # Vite + React Frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable UI components
│   │   ├── lib/                 # Utilities & API clients
│   │   └── hooks/               # React hooks
│   ├── backend-starter/         # Reference implementation
│   ├── package.json             # Vite dependencies
│   └── vite.config.ts           # Vite configuration
│
└── .dist/                      # Build outputs
```

---

## 🏗️ System Architecture

### Dual-Stack Implementation

**Previously:** Express.js backend in static-stream/server.js (deprecated)
**Currently:** Next.js backend in chombezo-backend (production-ready)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)                  │
│                    http://localhost:8080                    │
│  ├─ Video browsing (free & premium categories)             │
│  ├─ Payment modal with phone input                         │
│  ├─ Session verification                                   │
│  └─ Admin login dashboard                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ API Calls (HTTP/JSON)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend (Next.js API Routes)                   │
│  App Server Port: http://localhost:3000 or deployed        │
│                                                             │
│  ├─ /api/payment/create      (POST) - Initiate payment    │
│  ├─ /api/payment/verify      (GET)  - Check payment status│
│  ├─ /api/access/check        (GET)  - Verify session      │
│  ├─ /api/access/verify       (POST) - Validate token      │
│  ├─ /api/public/videos       (GET)  - List public videos  │
│  └─ /api/admin/*             (AUTH) - Admin operations    │
│                                                             │
│  Fast operation: CORS middleware, error handling           │
│  Database: Supabase (PostgreSQL)                           │
└────────────────────┬────────────────────────────────────────┘
                     │ Calls FastLipa API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           External Service: FastLipa API                    │
│           https://api.fastlipa.com                         │
│  ├─ Create transaction (phone, amount)                     │
│  ├─ Check transaction status (reference)                   │
│  └─ SMS verification for payments                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tables Structure

```sql
-- Admins: Backend & payment management
admins {
  id: UUID (PK)
  email: STRING (UNIQUE)
  password_hash: STRING
  is_active: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  last_login_at: TIMESTAMP
}

-- Categories: Video organization
categories {
  id: UUID (PK)
  name: STRING (e.g., "Za moto", "Premiun", "Trending")
  slug: STRING
  description: STRING
  is_premium: BOOLEAN            # Requires payment
  is_active: BOOLEAN
  sort_order: INTEGER
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Videos: Content library
videos {
  id: UUID (PK)
  category_id: UUID (FK → categories)
  title: STRING
  description: STRING
  thumbnail_url: STRING
  video_url: STRING
  is_active: BOOLEAN
  sort_order: INTEGER
  views_count: INTEGER
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Payments: Transaction history
payments {
  id: UUID (PK)
  provider: STRING               # "fastlipa"
  provider_reference: STRING     # FastLipa tranID
  amount_tsh: INTEGER            # TSH 1000, etc
  status: ENUM[pending|paid|failed|expired|cancelled]
  phone_number: STRING           # User's phone
  paid_at: TIMESTAMP | NULL
  verified_at: TIMESTAMP | NULL
  expires_at: TIMESTAMP | NULL
  metadata: JSONB                # FastLipa response
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- AccessSessions: Premium access grants
access_sessions {
  id: UUID (PK)
  payment_id: UUID (FK → payments)
  session_token: STRING          # JWT token
  expires_at: TIMESTAMP         # 1 hour from creation
  is_active: BOOLEAN
  accessed_at: TIMESTAMP | NULL
  created_at: TIMESTAMP
}

-- Settings: Configuration
settings {
  id: UUID (PK)
  key: STRING (UNIQUE)           # "premium_amount_tsh", etc
  value: STRING
  updated_at: TIMESTAMP
}
```

---

## 🔐 Authentication & Authorization

### Admin Authentication
- **Method:** JWT tokens + email/password
- **Flow:** 
  1. Login with email/password
  2. Backend validates against admins table
  3. Issues JWT token (exp: 24 hours)
  4. Token stored in state/cookie
  5. Included in Admin API requests

### User Session (Premium Access)
- **Method:** HTTP-only cookies + Session tokens
- **Flow:**
  1. User pays via FastLipa
  2. Backend creates AccessSession with JWT token
  3. Token contains: payment_id, expiry, phone_number
  4. Stored in HTTP-only cookie (secure, can't be accessed by JS)
  5. Email verification not required (SMS from FastLipa is enough)

---

## 💳 Payment Flow (Complete)

### User Side (Frontend)

```
User clicks "Pay" on Premium Video
  ↓
[1] Payment Modal opens
  ├─ Input: Phone number (e.g., 0753123456)
  ├─ Amount: TSH 1,000 (fixed)
  └─ Name: "Premium User" (auto)
  ↓
[2] POST /api/payment/create
  ├─ Request: { phone_number: "0753123456", amount_tsh: 1000 }
  └─ Response: { payment_reference: "pay_ABC123", status: "pending" }
  ↓
[3] Frontend polls /api/payment/verify?reference=pay_ABC123
  ├─ Every 2-3 seconds
  ├─ Status remains "pending" until SMS confirmed
  └─ Max 60 seconds of polling
  ↓
[4] User receives SMS from FastLipa
  ├─ Message: "Enter USSD code or confirm in app"
  └─ User enters code in FastLipa app or USSD
  ↓
[5] FastLipa marks payment as PAID
  ├─ Backend detects status change
  └─ Creates AccessSession with 1-hour expiry
  ↓
[6] Frontend receives success = true
  ├─ Displays "Access Granted for 1 hour"
  ├─ Sets HTTP-only cookie with session token
  └─ Closes payment modal
  ↓
[7] Premium video accessible for 60 minutes
  ├─ Video player loads
  ├─ Countdown timer shows remaining time
  └─ Access checked on every video request
```

### Backend Side

```
POST /api/payment/create
  ├─ [1] Validate phone number format (Tanzania)
  ├─ [2] Normalize to international: +255xxxxxxxxx
  ├─ [3] Validate amount (100-5,000,000 TSH)
  ├─ [4] Create Payment record (status: pending)
  ├─ [5] Call FastLipa API:
  │   └─ POST https://api.fastlipa.com/api/create-transaction
  │       ├─ Headers: Authorization: Bearer {API_KEY}
  │       ├─ Body: { number: "+255...", amount: 1000, name: "..." }
  │       └─ Response: { tranID: "pay_ABC...", status: "PENDING" }
  └─ [6] Return payment_reference to frontend

POLLING: GET /api/payment/verify?reference=pay_ABC123
  ├─ [1] Call FastLipa API:
  │   └─ GET https://api.fastlipa.com/api/status-transaction?tranid=pay_ABC
  │       ├─ Headers: Authorization: Bearer {API_KEY}
  │       └─ Response: { status: "PENDING", "PAID", "FAILED", etc }
  ├─ [2] Check status:
  │   ├─ If PENDING → Return 202 (still waiting)
  │   ├─ If PAID → Continue to [3]
  │   └─ If FAILED → Return 400 (payment failed)
  ├─ [3] Update Payment record (status: paid, verified_at: now)
  ├─ [4] Create AccessSession:
  │   ├─ Generate JWT token { payment_id, phone, exp: now+3600 }
  │   ├─ Sign with secret key
  │   └─ Store in DB
  ├─ [5] Set HTTP-only cookie:
  │   ├─ Name: access_token
  │   ├─ Value: SessionToken
  │   ├─ Secure: true (HTTPS only)
  │   ├─ HttpOnly: true (JS can't access)
  │   └─ SameSite: Lax
  └─ [6] Return 200 { success: true, message: "Access Granted" }

GET /api/video/access (check access)
  ├─ [1] Extract session token from HTTP-only cookie
  ├─ [2] Verify JWT signature
  ├─ [3] Check expiration timestamp
  ├─ [4] If valid:
  │   └─ Return 200 { videoAccess: true, expiresAt: ... }
  └─ [5] If expired/invalid:
      └─ Return 401 { videoAccess: false }
```

---

## 🎥 Video Management

### Hardcoded Videos (Frontend)
**Location:** `src/lib/videoData.ts`
```typescript
videos: [
  {
    id: "1",
    title: "Video Title",
    category: "Za moto",      // Free category
    isPremium: false,          // Can watch anytime
    thumbnail_url: "...",
    video_url: "..."
  },
  {
    id: "2",
    title: "Premium Video",
    category: "Premium",       // Premium category
    isPremium: true,           // Requires payment
    thumbnail_url: "...",
    video_url: "..."
  }
]
```

### Database Videos (Backend)
**Location:** Supabase `videos` table
```
GET /api/public/videos → Lists all active videos from DB
POST /api/admin/videos/create → Admin adds new video
PUT /api/admin/videos/[id] → Admin updates video
```

---

## 🛠️ Key Libraries & Dependencies

### Frontend (static-stream)
```json
{
  "react": "^18.2.0",              // UI framework
  "vite": "^7.0.0",                // Build tool
  "typescript": "^5.8.3",          // Type safety
  "tailwindcss": "^3.4.17",        // Styling
  "@radix-ui/*": "^1.x",           // Component library
  "@tanstack/react-query": "^5.x", // Data fetching
  "form": "react-hook-form"        // Form handling
}
```

### Backend (chombezo-backend)
```json
{
  "next": "^14.0.0",               // Full-stack framework
  "typescript": "^5.3.0",          // Type safety
  "@supabase/supabase-js": "^2.x", // Database client
  "jsonwebtoken": "^9.0.0",        // JWT tokens
  "bcrypt": "^5.0.0",              // Password hashing
  "zod": "^3.22.0"                 // Schema validation
}
```

### External Services
```
FastLipa API: Mobile money payments (Tanzania)
Supabase: PostgreSQL database + authentication
```

---

## 📱 API Endpoints Reference

### Public Endpoints (No Auth)

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/public/videos` | GET | List all videos | - | `{ videos: [...] }` |
| `/api/payment/create` | POST | Start payment | `{ phone_number, amount_tsh }` | `{ reference, status }` |
| `/api/payment/verify` | GET | Check payment | `?reference=pay_ABC` | `{ status, message }` |
| `/api/health` | GET | Health check | - | `{ status: "ok" }` |

### Protected Endpoints (Require Session)

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/access/check` | GET | Check premium access | Cookie | `{ valid, expiresAt }` |
| `/api/access/verify` | POST | Verify session token | Cookie | `{ valid, remainingMinutes }` |
| `/api/access/get-session` | GET | Get current session | Cookie | `{ session_token, expires_at }` |

### Admin Endpoints (Require JWT)

| Endpoint | Method | Purpose | Header |
|----------|--------|---------|--------|
| `/api/admin/login` | POST | Admin login | - |
| `/api/admin/videos/create` | POST | Create video | `Authorization: Bearer JWT` |
| `/api/admin/videos/[id]` | PUT | Update video | `Authorization: Bearer JWT` |
| `/api/admin/settings` | GET/PUT | Manage settings | `Authorization: Bearer JWT` |

---

## 🚀 Running the Project

### Backend (Next.js)
```bash
cd chombezo-backend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Environment Variables (.env.local):**
```bash
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...
FASTLIPA_API_URL=https://api.fastlipa.com
FASTLIPA_API_KEY=FastLipa_UX2wIH6xC2fyGPFsHCsY1DoBe
JWT_SECRET=...
```

### Frontend (React + Vite)
```bash
cd static-stream
npm install
npm run dev
# Runs on http://localhost:8080
```

**Expected Output:**
```
✓ Static Frontend: http://localhost:8080
✓ Connected to Backend: http://localhost:3000/api/...
✓ FastLipa Integration: Ready
✓ Premium Access: Functional
```

---

## 🔄 Data Flow Examples

### Example 1: Watch Free Video
```
1. User opens http://localhost:8080
2. Frontend loads hardcoded free videos from src/lib/videoData.ts
3. User clicks free video (e.g., "Za moto" category)
4. Video player opens, video plays immediately
5. No backend call needed
```

### Example 2: Buy Premium Access
```
1. User clicks premium video ("Premium" category)
2. Payment modal opens
3. User enters: 0753123456
4. Frontend: POST /api/payment/create
   └─ Response: { reference: "pay_ABC123", status: "pending" }
5. Frontend polls: GET /api/payment/verify?reference=pay_ABC123
   └─ Status stays "pending" for ~30-60 seconds
6. User gets SMS from FastLipa, confirms payment
7. FastLipa marks payment as PAID
8. Backend detects status change, creates AccessSession
9. Next poll returns: { status: "completed" }
10. Frontend stores HttpOnly cookie with session token
11. Video becomes accessible
12. Countdown timer shows 1:00:00 remaining
13. After 60 minutes, token expires, premium access revoked
```

### Example 3: Admin Dashboard
```
1. Navigate to /admin
2. Login with email/password (stored in DB)
3. Dashboard loads
4. Can create/edit/delete videos
5. Can view payment history
6. API calls include JWT in Authorization header
```

---

## 🔒 Security Features

### ✅ Implemented
- **HTTP-only Cookies** → Session tokens safe from XSS
- **CORS Middleware** → Origin validation
- **JWT Tokens** → Encrypted, time-limited access
- **Password Hashing** → Bcrypt for admin passwords
- **Input Validation** → Zod schemas for all inputs
- **Phone Normalization** → Prevents injection attacks
- **Backend Verification** → All access checks server-side

### ⚠️ To Implement
- [ ] Rate limiting on payment endpoints
- [ ] Email verification for admin signup
- [ ] SSH for backend deployment
- [ ] Database encryption at rest
- [ ] 2FA for admin accounts

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Frontend Components** | 20+ |
| **Backend API Routes** | 15+ |
| **Database Tables** | 6 |
| **TypeScript Files** | 40+ |
| **UI Components (Radix)** | 30+ |
| **Total Lines of Code** | ~5,000 |
| **External APIs** | 1 (FastLipa) |

---

## 🎯 Features Summary

### ✅ Completed
- [x] Video streaming (free + premium categories)
- [x] FastLipa payment integration
- [x] Premium access tokens (1-hour expiry)
- [x] Admin authentication & dashboard
- [x] Database persistence (videos, payments, sessions)
- [x] Responsive UI design
- [x] Countdown timer for access
- [x] Payment history tracking
- [x] CORS middleware
- [x] Error handling

### 🔄 In Progress
- [ ] Email notifications for payments
- [ ] SMS confirmations
- [ ] Payment refunds
- [ ] Advanced analytics

### 📋 Planned
- [ ] Mobile app version
- [ ] Streaming quality selection
- [ ] Subscription tiers
- [ ] Affiliate program
- [ ] CDN for video delivery

---

## 🌐 Deployment Guide

### Backend (Vercel/Railway)
```bash
1. Push to GitHub
2. Connect repository to Vercel/Railway
3. Set environment variables
4. Deploy (auto on git push)
5. Backend runs on https://your-domain.com
```

### Frontend (Vercel/Netlify)
```bash
1. Build: npm run build
2. Deploy 'dist' folder
3. Configure API base URL to production backend
4. Frontend runs on https://app.your-domain.com
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "Cannot find module 'cookie-parser'"
**Solution:** `npm install cookie-parser`

**Issue:** "FastLipa API 503 error"
**Solution:** Check API key in .env, FastLipa server might be down

**Issue:** "Payment verification timeout"
**Solution:** Payment might still be pending, try again in 5 seconds

**Issue:** "Premium access not granted after payment"
**Solution:** Check HTTP-only cookie is being set in browser DevTools

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Supabase Docs](https://supabase.com/docs)
- [FastLipa API](https://api.fastlipa.com)
- [Radix UI Components](https://radix-ui.com)

---

**Project Status:** ✅ Production Ready  
**Last Updated:** April 2, 2026  
**Maintained By:** Dave @ Uzima
