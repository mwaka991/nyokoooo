# Premium Video Platform - Backend Architecture Blueprint

**Date:** March 31, 2026  
**Status:** Production-Ready Design  
**Tech Stack:** Node.js/Next.js + Supabase + FastLipa  

---

## 📋 TABLE OF CONTENTS

1. [Database Design](#database-design)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [API Routes](#api-routes)
5. [Authentication Flow](#authentication-flow)
6. [Payment Flow](#payment-flow)
7. [Premium Access Control](#premium-access-control)
8. [Code Examples](#code-examples)
9. [Environment Variables](#environment-variables)
10. [Deployment Strategy](#deployment-strategy)
11. [Security Checklist](#security-checklist)

---

## 📊 DATABASE DESIGN

### Schema Overview

```sql
-- 1. ADMINS TABLE (Admin authentication)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  INDEX: email (unique)
);

-- 2. CATEGORIES TABLE (Video categories)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX: slug
  INDEX: is_active, is_premium
);

-- 3. VIDEOS TABLE (Video content)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX: category_id
  INDEX: is_active, category_id
  FOREIGN KEY: category_id
);

-- 4. PAYMENTS TABLE (Payment records)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'fastlipa',
  provider_reference VARCHAR(255) NOT NULL UNIQUE,
  amount_tsh INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- pending | paid | failed | expired | cancelled
  phone_number VARCHAR(15) NOT NULL,
  paid_at TIMESTAMP,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX: provider_reference
  INDEX: status, created_at
  INDEX: phone_number
);

-- 5. ACCESS_SESSIONS TABLE (Premium access tokens)
CREATE TABLE access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX: session_token (unique)
  INDEX: expires_at
  INDEX: payment_id
  FOREIGN KEY: payment_id
);

-- 6. SETTINGS TABLE (Configuration)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX: key (unique)
);

-- Settings seed data:
-- { key: 'PREMIUM_PRICE_TSH', value: '1000' }
-- { key: 'PREMIUM_DURATION_MINUTES', value: '60' }
```

### ER Diagram

```
admins (1) ──────→ (many) [no direct relation]

categories (1) ──────→ (many) videos
             └─→ is_premium flag

videos (1) ──────→ (no direct payment relation)

payments (1) ──────→ (many) access_sessions
          └─→ session_token for premium access
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  - Browse public/premium categories                             │
│  - View video metadata                                          │
│  - Trigger payment flow                                         │
│  - Check premium access status                                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────────────────────────────┐
   │   PUBLIC API ROUTES             │
   │ (no auth required)              │
   │ - GET /api/categories           │
   │ - GET /api/videos               │
   │ - POST /api/payment/create      │
   │ - POST /api/payment/verify      │
   │ - GET /api/access/check         │
   └──────────────┬────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌────────┐ ┌──────────┐ ┌─────────────┐
    │Database│ │FastLipa  │ │Session/Auth │
    │        │ │Payment   │ │Management   │
    └────────┘ └──────────┘ └─────────────┘
        │
    ┌───▼──────────────────┐
    │  Supabase PostgreSQL │
    │ (all data storage)   │
    └──────────────────────┘

┌──────────────────────────┐
│   ADMIN PANEL (Optional) │
│   - Admin login          │
│   - Manage categories    │
│   - Manage videos        │
│   - View payments        │
│   - Manage settings      │
└──────────┬───────────────┘
           │
        ┌──▼───────────────────┐
        │  ADMIN API ROUTES    │
        │ (JWT auth required)  │
        │ - POST /api/admin/lo │
        └──────────────────────┘
```

---

## 📁 FOLDER STRUCTURE

```
backend/
├── app/
│   └── api/
│       ├── admin/
│       │   ├── login/
│       │   │   └── route.ts          # POST admin login
│       │   ├── logout/
│       │   │   └── route.ts          # POST admin logout
│       │   ├── categories/
│       │   │   └── route.ts          # GET/POST categories (protected)
│       │   ├── categories/[id]/
│       │   │   └── route.ts          # PUT/DELETE specific category
│       │   ├── videos/
│       │   │   └── route.ts          # GET/POST videos (protected)
│       │   ├── videos/[id]/
│       │   │   └── route.ts          # PUT/DELETE specific video
│       │   └── me/
│       │       └── route.ts          # GET admin profile
│       ├── public/
│       │   ├── categories/
│       │   │   └── route.ts          # GET public categories
│       │   ├── videos/
│       │   │   ├── route.ts          # GET all public videos
│       │   │   ├── [id]/
│       │   │   │   └── route.ts      # GET single video
│       │   │   └── category/[slug]/
│       │   │       └── route.ts      # GET videos by category
│       │   └── settings/
│       │       └── route.ts          # GET public settings
│       ├── payment/
│       │   ├── create/
│       │   │   └── route.ts          # POST create payment
│       │   └── verify/
│       │       └── route.ts          # POST verify payment status
│       └── access/
│           ├── check/
│           │   └── route.ts          # GET check premium access
│           └── sessions/
│               └── route.ts          # Internal: cleanup expired sessions
├── lib/
│   ├── db.ts                         # Supabase client
│   ├── auth.ts                       # Authentication helpers
│   ├── payments.ts                   # FastLipa integration
│   ├── access.ts                     # Premium access logic
│   ├── validation.ts                 # Input validation (zod)
│   ├── errors.ts                     # Custom error classes
│   └── constants.ts                  # Constants & config
├── middleware/
│   ├── adminAuth.ts                  # Admin JWT verification
│   └── errorHandler.ts               # Global error handling
├── types/
│   └── index.ts                      # TypeScript types/interfaces
├── .env.local                        # Local environment variables
├── .env.example                      # Example environment variables
└── next.config.js                    # Next.js configuration
```

---

## 🔌 API ROUTES

### PUBLIC ROUTES (No authentication)

#### 1. GET /api/public/categories
**Purpose:** Fetch all active categories (public)

**Request:**
```http
GET /api/public/categories?includePremium=false
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Za moto",
        "slug": "za-moto",
        "description": "Beauty content",
        "is_premium": false,
        "sort_order": 1
      },
      {
        "id": "uuid",
        "name": "Premium Collection",
        "slug": "premium-collection",
        "description": "Exclusive premium content",
        "is_premium": true,
        "sort_order": 5
      }
    ]
  }
}
```

---

#### 2. GET /api/public/videos
**Purpose:** Fetch videos (respects premium status)

**Request:**
```http
GET /api/public/videos?limit=20&offset=0&category=za-moto&sort=newest
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "title": "Video Title",
        "description": "Description",
        "thumbnail_url": "https://...",
        "video_url": "https://...",
        "category": {
          "id": "uuid",
          "name": "Za moto",
          "is_premium": false
        },
        "is_premium": false,
        "sort_order": 1
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 3. GET /api/public/videos/:id
**Purpose:** Fetch single video details

**Request:**
```http
GET /api/public/videos/uuid
Cookie: access_token=<optional premium session token>
```

**Response (200) - Public Video:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Video Title",
    "description": "Description",
    "thumbnail_url": "https://...",
    "video_url": "https://...",
    "category": { "id": "uuid", "name": "Za moto", "is_premium": false },
    "is_premium": false,
    "access_granted": true
  }
}
```

**Response (403) - Premium Video, No Access:**
```json
{
  "success": false,
  "error": "PREMIUM_ACCESS_REQUIRED",
  "message": "This is premium content. Please make a payment to access.",
  "data": {
    "requires_payment": true,
    "amount_tsh": 1000,
    "access_type": "temporary"
  }
}
```

---

#### 4. GET /api/public/videos/category/:slug
**Purpose:** Fetch videos in a category

**Request:**
```http
GET /api/public/videos/category/za-moto?limit=20
```

**Response:** Same structure as `/api/public/videos`

---

#### 5. POST /api/payment/create
**Purpose:** Initiate a FastLipa payment

**Request:**
```json
{
  "phone_number": "0753123456",
  "amount_tsh": 1000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "provider_reference": "order_abc123xyz",
    "amount_tsh": 1000,
    "phone_number": "0753123456",
    "status": "pending",
    "poll_interval_ms": 2000,
    "message": "Payment initiated. Please confirm on your phone."
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "INVALID_PHONE_NUMBER",
  "message": "Phone number must be in format 07xxxxxxxxx"
}
```

---

#### 6. POST /api/payment/verify
**Purpose:** Verify FastLipa payment status and grant access

**Request:**
```json
{
  "payment_id": "uuid",
  "provider_reference": "order_abc123xyz"
}
```

**Response (200) - Payment Confirmed:**
```json
{
  "success": true,
  "data": {
    "status": "paid",
    "verified_at": "2026-03-31T12:34:56Z",
    "access_session": {
      "session_token": "sess_xyz...",
      "expires_at": "2026-03-31T13:34:56Z"
    },
    "message": "Payment verified! Premium access granted for 60 minutes."
  }
}
```

**Response (202) - Still Pending:**
```json
{
  "success": false,
  "error": "PAYMENT_PENDING",
  "status": "pending",
  "message": "Payment is still pending. Please try again in a few seconds.",
  "poll_interval_ms": 2000
}
```

**Response (400) - Payment Failed:**
```json
{
  "success": false,
  "error": "PAYMENT_FAILED",
  "status": "failed",
  "message": "Payment was declined or cancelled."
}
```

---

#### 7. GET /api/access/check
**Purpose:** Check if current session has premium access

**Request:**
```http
GET /api/access/check
Cookie: access_token=sess_xyz...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "has_premium_access": true,
    "expires_at": "2026-03-31T13:34:56Z",
    "time_remaining_minutes": 35
  }
}
```

---

### ADMIN ROUTES (JWT authentication required)

#### 8. POST /api/admin/login
**Purpose:** Admin authentication

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "uuid",
      "email": "admin@example.com"
    },
    "token": "eyJhbGc...",
    "expires_in_hours": 24
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

---

#### 9. POST /api/admin/logout
**Purpose:** Invalidate admin session

**Request:**
```http
POST /api/admin/logout
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### 10. GET /api/admin/me
**Purpose:** Get current admin profile

**Request:**
```http
GET /api/admin/me
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "uuid",
      "email": "admin@example.com",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "last_login_at": "2026-03-31T12:00:00Z"
    }
  }
}
```

---

#### 11. GET /api/admin/categories
**Purpose:** List all categories (including inactive)

**Request:**
```http
GET /api/admin/categories?sort=order&direction=asc
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Za moto",
        "slug": "za-moto",
        "description": "Beauty content",
        "is_premium": false,
        "is_active": true,
        "sort_order": 1,
        "video_count": 15,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### 12. POST /api/admin/categories
**Purpose:** Create new category

**Request:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "is_premium": false,
  "is_active": true,
  "sort_order": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "category": { "id": "uuid", "name": "New Category", ... }
  }
}
```

---

#### 13. PUT /api/admin/categories/:id
**Purpose:** Update category

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "is_premium": true,
  "is_active": false,
  "sort_order": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "category": { ... } }
}
```

---

#### 14. DELETE /api/admin/categories/:id
**Purpose:** Delete/deactivate category

**Request:**
```http
DELETE /api/admin/categories/:id?hard_delete=false
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category deactivated successfully"
}
```

---

#### 15. GET /api/admin/videos
**Purpose:** List all videos (including inactive)

**Response:** Similar to categories but for videos

---

#### 16. POST /api/admin/videos
**Purpose:** Create new video

**Request:**
```json
{
  "category_id": "uuid",
  "title": "Video Title",
  "description": "Description text",
  "thumbnail_url": "https://example.com/thumb.jpg",
  "video_url": "https://example.com/video.mp4",
  "is_active": true,
  "sort_order": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "video": { ... } }
}
```

---

#### 17. PUT /api/admin/videos/:id
**Purpose:** Update video

**Request:** Same fields as POST

**Response (200):**
```json
{
  "success": true,
  "data": { "video": { ... } }
}
```

---

#### 18. DELETE /api/admin/videos/:id
**Purpose:** Delete/deactivate video

**Response (200):**
```json
{
  "success": true,
  "message": "Video deactivated successfully"
}
```

---

## 🔐 AUTHENTICATION FLOW

### Admin Login Flow

```
┌─────────────────┐
│  Admin Login    │
│ email/password  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ POST /api/admin/login                       │
│ - Validate email/password format            │
│ - Query admins table                        │
│ - Compare password with bcrypt hash         │
│ - If match: Create JWT token                │
│ - If no match: Return 401                   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ Return JWT Token                            │
│ - Store in httpOnly cookie or local storage │
│ - Include in Authorization header           │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ Subsequent Admin Requests                   │
│ - Send: Authorization: Bearer <jwt>         │
│ - Middleware verifies token signature       │
│ - Middleware checks token expiration        │
│ - If valid: Process request                 │
│ - If invalid: Return 401                    │
└─────────────────────────────────────────────┘
```

### JWT Strategy

```
Token Structure: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Payload:
{
  "sub": "admin_uuid",
  "email": "admin@example.com",
  "iat": 1704067200,           // issued at
  "exp": 1704153600,           // expires in 24 hours
  "type": "admin"
}

Secrets:
- Stored in: process.env.JWT_SECRET
- Never exposed to frontend
- Rotate periodically in production
```

---

## 💳 PAYMENT FLOW

### FastLipa Integration

```
┌──────────────────────────────┐
│ User initiates payment       │
│ - Phone: 0753123456         │
│ - Amount: 1000 TSH          │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 1. POST /api/payment/create                  │
│    Frontend sends: {phone_number, amount}    │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 2. Backend Creates Payment in DB             │
│    - Generate unique provider_reference      │
│    - Set status: 'pending'                   │
│    - Store in payments table                 │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 3. Call FastLipa API                         │
│    POST https://api.fastlipa.com/payment     │
│    {                                          │
│      "reference": "order_abc123xyz",         │
│      "phone": "0753123456",                  │
│      "amount": 1000                          │
│    }                                          │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 4. FastLipa Response                         │
│    - Returns status: pending/success/failed  │
│    - Returns unique reference                │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 5. Return to Frontend                        │
│    {                                          │
│      "payment_id": "uuid",                   │
│      "provider_reference": "order_...",      │
│      "status": "pending",                    │
│      "poll_interval_ms": 2000                │
│    }                                          │
└────────────┬─────────────────────────────────┘
             │
             ▼ (Frontend polls every 2 seconds)
┌──────────────────────────────────────────────┐
│ 6. POST /api/payment/verify                  │
│    Frontend sends: {payment_id, provider_ref}│
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 7. Backend Verification (Server-to-Server)   │
│    - Query payment from DB (by provider_ref) │
│    - Call FastLipa API to verify status      │
│    - FastLipa is source of truth             │
│    - DO NOT trust frontend flags             │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 8. FastLipa Returns Status                   │
│    - pending: Keep polling                   │
│    - success: Payment confirmed              │
│    - failed: Payment declined                │
│    - expired: Timeout (retry needed)         │
└────────────┬─────────────────────────────────┘
             │
             ├─→ If PENDING/EXPIRED
             │   → Return 202 (Retry Later)
             │
             ├─→ If FAILED
             │   → Update payment status: 'failed'
             │   → Return 400
             │
             └─→ If SUCCESS
                 ↓
┌──────────────────────────────────────────────┐
│ 9. Create Premium Access Session             │
│    - Generate secure session token           │
│    - Set expires_at = now + 60 mins          │
│    - Insert into access_sessions table       │
│    - Update payment status: 'paid'           │
│    - Mark verified_at: now                   │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 10. Return Success to Frontend                │
│     {                                         │
│       "status": "paid",                      │
│       "access_session": {                    │
│         "session_token": "sess_xyz...",      │
│         "expires_at": "2026-03-31T13:34..."  │
│       }                                       │
│     }                                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 11. Frontend Stores Session Token            │
│     - In httpOnly cookie (recommended)       │
│     - Or in secure session storage           │
│     - Automatically included in requests     │
└──────────────────────────────────────────────┘
```

### FastLipa Configuration

```env
FASTLIPA_API_KEY=your-fastlipa-api-key-here
FASTLIPA_API_URL=https://api.fastlipa.com
FASTLIPA_WEBHOOK_SECRET=webhook_secret_key
```

---

## 🎟️ PREMIUM ACCESS CONTROL

### Access Session Strategy

```
1. SESSION TOKEN GENERATION

   Function: generateSessionToken()
   
   - Use cryptographically secure random bytes
   - Format: "sess_" + random_hex(32)
   - Example: sess_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   - Store hashed version in database (optional)
   - Send unhashed to frontend (one-time)

2. SESSION STORAGE

   Database:
   {
     id: uuid,
     payment_id: uuid,
     session_token: "sess_...",
     expires_at: timestamp,
     is_active: true,
     accessed_at: timestamp
   }

3. CLIENT-SIDE STORAGE

   Option A: HttpOnly Cookie (Recommended)
   - Set-Cookie: access_token=sess_...; HttpOnly; Secure; SameSite=Strict
   - Automatically sent with requests
   - Protected from XSS
   - Not accessible to JavaScript

   Option B: Secure Session Storage
   - Use sessionStorage (cleared on tab close)
   - Send in Authorization header for each request
   - More control but requires frontend setup

4. VERIFICATION FLOW

   When frontend requests premium content:
   
   ┌─────────────────────────┐
   │ Frontend requests video │
   │ GET /api/public/videos/:id
   │ + Cookie: access_token  │
   └────────────┬────────────┘
                │
                ▼
   ┌─────────────────────────────────────┐
   │ Backend checks video category       │
   │ - If PUBLIC: return immediately     │
   │ - If PREMIUM: validate session      │
   └────────────┬────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────────┐
   │ Extract session token from cookie/header │
   │ - Look for Cookie: access_token          │
   │ - Or header: Authorization: Bearer token │
   └────────────┬─────────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────────┐
   │ Query access_sessions table              │
   │ - Find matching session_token            │
   │ - Check: expires_at > NOW()              │
   │ - Check: is_active = true                │
   │ - Update: accessed_at = NOW()            │
   └────────────┬─────────────────────────────┘
                │
                ├─→ Session NOT found
                │   → Return 403 PREMIUM_ACCESS_REQUIRED
                │
                ├─→ Session EXPIRED
                │   → Return 403 PREMIUM_ACCESS_REQUIRED
                │
                ├─→ Session INACTIVE
                │   → Return 403 PREMIUM_ACCESS_REQUIRED
                │
                └─→ Session VALID & ACTIVE
                    → Return video with access_granted: true
```

### Session Cleanup Strategy

```
Background Job (CronJob or Scheduled Task):

Every 5 minutes:
  1. Find expired sessions where expires_at < NOW()
  2. Update: set is_active = false
  3. Keep records for audit trail
  
Optional Hard Delete (30 days later):
  DELETE FROM access_sessions
  WHERE expires_at < NOW() - INTERVAL '30 days'

Cost: Minimal - indexed query on expires_at
```

---

## 💻 CODE EXAMPLES

### lib/db.ts (Supabase Client)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
export async function getCategories(includePremium = false) {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!includePremium) {
    query = query.eq('is_premium', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getVideosByCategory(slug: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, categories(id, name, is_premium)')
    .eq('categories.slug', slug)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getVideoById(videoId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, categories(id, name, is_premium)')
    .eq('id', videoId)
    .single();

  if (error) throw error;
  return data;
}

export async function validateAdminCredentials(
  email: string,
  password: string
) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, password_hash')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function getPaymentByReference(reference: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', reference)
    .single();

  if (error) return null;
  return data;
}

export async function getAccessSession(token: string) {
  const { data, error } = await supabase
    .from('access_sessions')
    .select('*, payments(id)')
    .eq('session_token', token)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) return null;
  return data;
}

export async function createAccessSession(
  paymentId: string,
  durationMinutes: number
) {
  const sessionToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const { data, error } = await supabase
    .from('access_sessions')
    .insert({
      payment_id: paymentId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### lib/auth.ts (Admin Authentication)

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '24h';

interface JWTPayload {
  sub: string;
  email: string;
  type: 'admin';
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJWT(adminId: string, email: string): string {
  return jwt.sign(
    {
      sub: adminId,
      email: email,
      type: 'admin',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
```

### lib/payments.ts (FastLipa Integration)

```typescript
import { supabase } from './db';

const FASTLIPA_API_URL = process.env.FASTLIPA_API_URL!;
const FASTLIPA_API_KEY = process.env.FASTLIPA_API_KEY!;

interface FastLipaCreateResponse {
  success: boolean;
  reference: string;
  status: string;
}

interface FastLipaVerifyResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed' | 'expired';
  reference: string;
}

export async function createFastLipaPayment(
  phone: string,
  amount: number
): Promise<FastLipaCreateResponse> {
  const response = await fetch(`${FASTLIPA_API_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FASTLIPA_API_KEY}`,
    },
    body: JSON.stringify({
      phone: phone,
      amount: amount,
      reference: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }),
  });

  if (!response.ok) {
    throw new Error('FastLipa API error');
  }

  return response.json();
}

export async function verifyFastLipaPayment(
  reference: string
): Promise<FastLipaVerifyResponse> {
  const response = await fetch(
    `${FASTLIPA_API_URL}/payment/verify?reference=${reference}`,
    {
      headers: {
        Authorization: `Bearer ${FASTLIPA_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('FastLipa verification failed');
  }

  return response.json();
}

export async function handlePaymentUpdate(
  paymentId: string,
  fastLipaStatus: string
) {
  const statusMap: Record<string, string> = {
    success: 'paid',
    pending: 'pending',
    failed: 'failed',
    expired: 'expired',
  };

  const newStatus = statusMap[fastLipaStatus] || 'pending';

  const { error } = await supabase
    .from('payments')
    .update({
      status: newStatus,
      verified_at:
        newStatus === 'paid' ? new Date().toISOString() : undefined,
    })
    .eq('id', paymentId);

  if (error) throw error;
}
```

### lib/access.ts (Premium Access Control)

```typescript
import { supabase } from './db';
import crypto from 'crypto';

export function generateSecureToken(): string {
  const bytes = crypto.randomBytes(32);
  return 'sess_' + bytes.toString('hex');
}

export async function checkPremiumAccess(
  sessionToken: string | null
): Promise<{
  has_access: boolean;
  expires_at: string | null;
}> {
  if (!sessionToken) {
    return { has_access: false, expires_at: null };
  }

  const session = await supabase
    .from('access_sessions')
    .select('expires_at')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (session.error || !session.data) {
    return { has_access: false, expires_at: null };
  }

  return { has_access: true, expires_at: session.data.expires_at };
}

export async function isPremiumContent(categoryId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('categories')
    .select('is_premium')
    .eq('id', categoryId)
    .single();

  if (error) return false;
  return data.is_premium;
}

export async function canAccessVideo(
  videoId: string,
  sessionToken: string | null
): Promise<{ can_access: boolean; reason?: string }> {
  // Get video with category
  const { data: video, error } = await supabase
    .from('videos')
    .select('*, categories(is_premium)')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    return { can_access: false, reason: 'VIDEO_NOT_FOUND' };
  }

  // If not premium, everyone can access
  if (!video.categories.is_premium) {
    return { can_access: true };
  }

  // Check if has active session
  const { has_access } = await checkPremiumAccess(sessionToken);

  if (!has_access) {
    return { can_access: false, reason: 'PREMIUM_ACCESS_REQUIRED' };
  }

  return { can_access: true };
}
```

### app/api/public/videos/[id]/route.ts (Video Detail Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { canAccessVideo } from '@/lib/access';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    const sessionToken =
      request.cookies.get('access_token')?.value || null;

    // Check access permissions
    const { can_access, reason } = await canAccessVideo(
      videoId,
      sessionToken
    );

    if (!can_access) {
      return NextResponse.json(
        {
          success: false,
          error: reason,
          message: 'Premium access required',
        },
        { status: 403 }
      );
    }

    // Get video details
    const { data: video, error } = await supabase
      .from('videos')
      .select('*, categories(id, name, is_premium)')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { success: false, error: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...video,
        access_granted: can_access,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### app/api/payment/create/route.ts (Create Payment)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { createFastLipaPayment } from '@/lib/payments';
import { z } from 'zod';

const CreatePaymentSchema = z.object({
  phone_number: z.string().regex(/^07\d{8}$/, 'Invalid phone number'),
  amount_tsh: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = CreatePaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const { phone_number, amount_tsh } = validation.data;

    // Create payment record in DB
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        provider: 'fastlipa',
        phone_number: phone_number,
        amount_tsh: amount_tsh,
        status: 'pending',
        provider_reference: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Call FastLipa API
    const fastLipaResponse = await createFastLipaPayment(
      phone_number,
      amount_tsh
    );

    if (!fastLipaResponse.success) {
      // Mark payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      return NextResponse.json(
        { success: false, error: 'PAYMENT_INITIATION_FAILED' },
        { status: 400 }
      );
    }

    // Update payment with FastLipa reference
    await supabase
      .from('payments')
      .update({
        provider_reference: fastLipaResponse.reference,
      })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment.id,
        provider_reference: fastLipaResponse.reference,
        amount_tsh: amount_tsh,
        status: 'pending',
        poll_interval_ms: 2000,
        message: 'Payment initiated. Confirm on your phone.',
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### app/api/payment/verify/route.ts (Verify Payment)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyFastLipaPayment, handlePaymentUpdate } from '@/lib/payments';
import { createAccessSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { payment_id, provider_reference } = await request.json();

    // Get payment from DB
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (dbError || !payment) {
      return NextResponse.json(
        { success: false, error: 'PAYMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify with FastLipa (server-to-server)
    const fastLipaStatus = await verifyFastLipaPayment(provider_reference);

    // Update payment status in DB
    await handlePaymentUpdate(payment_id, fastLipaStatus.status);

    // If payment is still pending
    if (fastLipaStatus.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_PENDING',
          status: 'pending',
          message: 'Please wait and try again',
        },
        { status: 202 }
      );
    }

    // If payment failed
    if (fastLipaStatus.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_FAILED',
          status: 'failed',
        },
        { status: 400 }
      );
    }

    // Payment succeeded - create access session
    if (fastLipaStatus.status === 'success') {
      const premiumDuration = await getSetting(
        'PREMIUM_DURATION_MINUTES'
      );
      const session = await createAccessSession(
        payment_id,
        parseInt(premiumDuration)
      );

      const response = NextResponse.json({
        success: true,
        data: {
          status: 'paid',
          verified_at: new Date().toISOString(),
          access_session: {
            session_token: session.session_token,
            expires_at: session.expires_at,
          },
        },
      });

      // Set httpOnly cookie
      response.cookies.set('access_token', session.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(premiumDuration) * 60,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'UNKNOWN_STATUS' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function getSetting(key: string): Promise<string> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  return data?.value || '60';
}
```

### middleware/adminAuth.ts (Admin Protection)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader } from '@/lib/auth';

export function adminAuthMiddleware(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const token = extractTokenFromHeader(
      request.headers.get('authorization')
    );

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);

    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Attach admin info to request
    (request as any).admin = { id: payload.sub, email: payload.email };

    return handler(request, ...args);
  };
}
```

---

## 🌍 ENVIRONMENT VARIABLES

### .env.local

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# FastLipa Integration
FASTLIPA_API_KEY=your-fastlipa-api-key-here
FASTLIPA_API_URL=https://api.fastlipa.com
FASTLIPA_WEBHOOK_SECRET=webhook_secret_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars

# Application
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Premium Settings
PREMIUM_PRICE_TSH=1000
PREMIUM_DURATION_MINUTES=60

# Logging
LOG_LEVEL=info
```

### .env.example

```env
# Copy this and fill in your actual values

# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# FastLipa Integration
FASTLIPA_API_KEY=
FASTLIPA_API_URL=https://api.fastlipa.com
FASTLIPA_WEBHOOK_SECRET=

# JWT Configuration
JWT_SECRET=

# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=

# Premium Settings
PREMIUM_PRICE_TSH=1000
PREMIUM_DURATION_MINUTES=60

# Logging
LOG_LEVEL=info
```

---

## 🚀 DEPLOYMENT STRATEGY

### Vercel Deployment

```
1. PREPARE FOR DEPLOYMENT

   a) Ensure all environment variables are set:
      - SUPABASE_SERVICE_KEY
      - JWT_SECRET (strong, 32+ chars)
      - FASTLIPA_API_KEY
      - Others as above

   b) Test locally:
      npm run build
      npm run start

2. VERCEL SETUP

   a) Connect repository to Vercel
   b) Add environment variables in Vercel Settings:
      - Copy from .env.local (never commit secrets!)
   c) Add these build command overrides:
      Build Command: npm run build
      Output Directory: .next

3. DEPLOY

   npm install -g vercel
   vercel --prod

4. POST-DEPLOYMENT

   - Verify environment variables are set
   - Test payment flow: /api/payment/create, /api/payment/verify
   - Test admin login: /api/admin/login
   - Monitor logs: vercel logs
```

### Database Initialization

```sql
-- 1. Run this SQL in Supabase SQL Editor to create tables

-- Drop existing (if needed)
-- DROP TABLE IF EXISTS access_sessions CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS videos CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;

-- Create tables (see DATABASE DESIGN section)

-- 2. Seed admin user
INSERT INTO admins (email, password_hash, is_active)
VALUES (
  'admin@example.com',
  -- Replace with: bcrypt hash of your password
  '$2b$10$...',
  true
);

-- 3. Seed settings
INSERT INTO settings (key, value)
VALUES
  ('PREMIUM_PRICE_TSH', '1000'),
  ('PREMIUM_DURATION_MINUTES', '60');

-- 4. Seed sample categories
INSERT INTO categories (name, slug, is_premium, is_active, sort_order)
VALUES
  ('Za moto', 'za-moto', false, true, 1),
  ('Za Kizungu', 'za-kizungu', false, true, 2),
  ('Premium Collection', 'premium-collection', true, true, 3);
```

### Performance Considerations

```
DATABASE INDEXING:
- categories.slug (unique)
- categories.is_active, is_premium
- videos.category_id
- videos.is_active
- payments.provider_reference (unique)
- payments.status, created_at
- access_sessions.session_token (unique)
- access_sessions.expires_at

QUERY OPTIMIZATION:
- Use select() to fetch only needed columns
- Use eq() and limit() to reduce data transfer
- Cache category list (rarely changes)
- Use connection pooling (Supabase default)

RATE LIMITING:
- /api/payment/verify: 10 requests per minute per IP
- /api/admin/login: 5 attempts per 15 minutes per IP
- /api/payment/create: 20 requests per hour per phone

CACHING:
- GET /api/public/categories: Cache 15 minutes
- GET /api/public/videos: Cache 5 minutes
- GET /api/public/videos/:id: Cache 5 minutes
```

---

## ✅ SECURITY CHECKLIST

### Before Production

- [ ] Change default admin password (bcrypt hash only, never plaintext)
- [ ] Set strong JWT_SECRET (32+ characters, cryptographically random)
- [ ] Rotate SUPABASE_SERVICE_KEY (use separate keys per environment)
- [ ] Enable HTTPS only (Vercel default)
- [ ] Set secure cookies (httpOnly, Secure, SameSite)
- [ ] Enable CORS only for specific frontend domain
- [ ] Disable debug logs in production
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting on payment endpoints
- [ ] Test admin authentication thoroughly
- [ ] Test premium access expiration
- [ ] Test payment verification (never trust client)
- [ ] Implement request logging for audits
- [ ] Backups enabled on Supabase

### Ongoing Security

- [ ] Monitor failed login attempts
- [ ] Rotate JWT_SECRET quarterly
- [ ] Monitor failed payment verification
- [ ] Update dependencies monthly
- [ ] Review Supabase logs weekly
- [ ] Test disaster recovery monthly
- [ ] Audit admin access quarterly
- [ ] Monitor payment reconciliation with FastLipa

---

## 📊 MONITORING & LOGGING

### Key Metrics

```
Track these metrics:
- Payment success rate
- Average payment verification time
- Failed login attempts
- Premium access redemption rate
- Average session duration
- Database query performance
- API response times
- Error rates by endpoint
```

### Logging Strategy

```typescript
// Use structured logging
logger.info('Payment created', {
  payment_id: '...',
  amount: 1000,
  phone: '07...',
});

logger.warn('Payment verification pending', {
  reference: '...',
  attempt: 1,
  retry_at: '...',
});

logger.error('FastLipa API error', {
  error: '...',
  payment_id: '...',
  severity: 'high',
});
```

---

## 🔄 DATABASE MIGRATIONS

For Next.js + Supabase, use Supabase Migrations:

```bash
# Create migration
npx supabase migration new create_initial_schema

# Apply migrations
npx supabase migration up

# Reset (dev only)
npx supabase db reset
```

---

## 📝 SUMMARY

This architecture provides:

✅ **Security**: JWT auth, bcrypt passwords, server-verified payments  
✅ **Scalability**: Indexed queries, efficient data model, connection pooling  
✅ **Simplicity**: No unnecessary complexity, clear data flows  
✅ **Maintainability**: Modular code, clear separation of concerns  
✅ **Production-Ready**: Error handling, logging, monitoring  

The frontend remains untouched. The backend can be deployed independently and the frontend can connect to it via the public API routes.

