# Database Audit - Quick Reference

## Critical Issues Found: 4 🔴

### 1. ACCESS_SESSIONS Missing phone_number
- **File**: `lib/access.ts` line 139
- **Issue**: Column defined but never written by `createPremiumSession()`
- **Impact**: Can't track which phone has which session

### 2. ACCESS_SESSIONS Missing payment_id
- **File**: `lib/access.ts` line 146
- **Issue**: Foreign key parameter provided but not inserted
- **Impact**: Sessions not linked to payments for reconciliation

### 3. Dual Active Flags (active + is_active)
- **Files**: Multiple - `checkAccessSession()`, `countAccessSessions()`
- **Issue**: Same field duplicated with different names
- **Impact**: Code inconsistency and maintenance burden

### 4. Dual Expiry Dates (expires_at + access_expiry_time)
- **Files**: Multiple - `checkAccessSession()`, `getSessionRemainingMinutes()`
- **Issue**: Schema aliasing creating duplicate columns
- **Impact**: Must check both fields, inefficient queries

---

## Major Issues Found: 4 🟡

### 5. PAYMENTS paid_at UNUSED
- Defined in schema but never written
- Cannot track actual payment completion timestamp

### 6. VIDEOS views_count UNUSED
- Defined and in TypeScript interface but never incremented
- Analytics will be incomplete

### 7. No Transaction Atomicity
- Payment update and session creation not in transaction
- If session succeeds but payment update fails: data inconsistency

### 8. Metadata Storage Inefficiency
- Critical session data (token, expiry) stored in JSONB
- Less efficient than proper columns

---

## All Unused Columns

| Table | Column | Issue |
|-------|--------|-------|
| payments | paid_at | Never set on successful payment |
| payments | expires_at | Never used |
| access_sessions | payment_id | Foreign key never populated |
| access_sessions | phone_number | Never written |
| access_sessions | access_start_time | Never read |
| access_sessions | accessed_at | Alias for last_accessed |
| access_sessions | active | Duplicate of is_active |
| access_sessions | expires_at | Alias for access_expiry_time |
| access_sessions | created_at | Never read |
| videos | views_count | Never incremented |
| admins | created_at | Never read |
| settings | id | Never used (key is unique) |

---

## Database Objects by Usage Frequency

### HIGH - Used in Every Request
- `payments` table - payment processing pipeline
- `access_sessions` table - access control
- `videos` + `categories` - content delivery

### MEDIUM - Used Weekly
- `admins` table - admin dashboard
- Dashboard stats queries

### LOW - Setup Only
- `settings` table - configuration
- Schema rarely changes

---

## Payment Flow - Exact Database Operations

```
1. POST /api/payment/create
   ↓ Write: payments(id, provider, provider_reference, phone_number, amount_tsh, status, metadata, created_at)
   ↓ Status: pending

2. GET /api/payment/verify/[reference]
   ↓ Read: SELECT * FROM payments WHERE provider_reference = ?
   ↓ Verify with FastLipa
   ↓ Write: UPDATE payments SET status='paid', verified_at=NOW()
   ↓ Call: createPremiumSession({user_identifier: phone_number})
   ↓ Write: access_sessions(...) [MISSING: payment_id, phone_number]
   ↓ Status: paid + session created

3. POST /api/access/verify-token
   ↓ Read: SELECT * FROM access_sessions WHERE session_token = ? AND active = true
   ↓ Validate: access_expiry_time > NOW()
   ↓ Write: UPDATE access_sessions SET accessed_at = NOW() WHERE id = ?
   ↓ Status: token valid
```

---

## Exact Columns Each Function Accesses

### `lib/db.ts::createPayment(input)`
**WRITE**: payments(
  - id (auto)
  - provider (from input or default)
  - provider_reference (from input)
  - phone_number (from input)
  - amount_tsh (from input)
  - status (from input or default 'pending')
  - metadata (from input)
  - created_at (auto)
)

### `lib/db.ts::getPaymentByReference(reference)`
**READ**: payments(*) 
**FILTER**: WHERE provider_reference = ?

### `lib/db.ts::updatePaymentStatus(id, status, verified_at?)`
**WRITE**: payments(
  - status
  - verified_at (optional, if flag true)
  - updated_at (auto trigger)
)
**FILTER**: WHERE id = ?

### `lib/access.ts::createPremiumSession(input)`
**WRITE**: access_sessions(
  - id (auto)
  - session_token (generated)
  - user_identifier (from input)
  - access_start_time (NOW())
  - access_expiry_time (NOW() + 1 hour)
  - expires_at (NOW() + 1 hour)
  - active (true)
  - is_active (true)
  - last_accessed (NOW())
  - accessed_at (NOW())
  - created_at (auto)
)
**MISSING WRITES**:
  - payment_id
  - phone_number

### `lib/access.ts::checkAccessSession(token)`
**READ**: access_sessions(*)
**FILTER**: 
  - WHERE session_token = ?
  - AND active = true
**VALIDATE**: 
  - access_expiry_time or expires_at > NOW()

### `lib/access.ts::getSessionRemainingMinutes(session)`
**READ**: Uses session object (already fetched)
**CALCULATE**: 
  - expiry = session.access_expiry_time or session.expires_at
  - diffMs = expiry - NOW()
  - minutes = ceil(diffMs / 60000)

---

## All Indexes in Database

| Index Name | Table | Column(s) | Type | Purpose |
|------------|-------|-----------|------|---------|
| payments_pkey | payments | id | PRIMARY | |
| idx_payments_phone_number | payments | phone_number | BTREE | Quick lookup by phone |
| idx_payments_provider_reference | payments | provider_reference | UNIQUE | Payment reference lookup |
| idx_payments_status | payments | status | BTREE | Admin stats filtering |
| idx_payments_created_at | payments | created_at DESC | BTREE | Time-series queries |
| access_sessions_pkey | access_sessions | id | PRIMARY | |
| idx_access_sessions_token | access_sessions | session_token | UNIQUE | Token verification |
| idx_access_sessions_phone | access_sessions | phone_number | BTREE | User session lookup |
| idx_access_sessions_active | access_sessions | active WHERE active=true | PARTIAL | Active sessions count |
| idx_access_sessions_expiry | access_sessions | access_expiry_time DESC | BTREE | Cleanup queries |
| idx_access_sessions_payment_id | access_sessions | payment_id | BTREE | Payment linking |

---

## API Endpoints vs Database

| Endpoint | Method | DB Table(s) | Operations |
|----------|--------|-------------|-----------|
| /api/payment/create | POST | payments | INSERT |
| /api/payment/verify/[ref] | GET | payments, access_sessions | SELECT, UPDATE, INSERT |
| /api/access/check | POST | videos, categories, access_sessions | SELECT, SELECT, SELECT |
| /api/access/verify-token | POST | access_sessions | SELECT, UPDATE |
| /api/access/verify | POST | access_sessions | SELECT, UPDATE |
| /api/access/get-session | POST | access_sessions | INSERT |
| /api/admin/payments | GET | payments | SELECT (with count) |
| /api/admin/stats | GET | payments, videos, categories, access_sessions | COUNT * 4 |
| /api/admin/categories | GET | categories | SELECT (with count) |
| /api/admin/videos | GET | videos | SELECT (with count) |
| /api/public/categories | GET | categories | SELECT |
| /api/public/videos | GET | videos, categories | SELECT, JOIN |

---

## Quick Fix Checklist

- [ ] Add `payment_id` to `createPremiumSession()` call in verify route
- [ ] Add `phone_number` to `createPremiumSession()` parameters
- [ ] Pass payment object to `createPremiumSession()` function
- [ ] Update `createPremiumSession()` to insert phone_number and payment_id
- [ ] Change all `active` column checks to `is_active` (or vice versa)
- [ ] Remove alias columns (expires_at, accessed_at) after migration
- [ ] Add transaction wrapper for payment → session creation
- [ ] Set `paid_at` field on successful payment
- [ ] Create views update endpoint to track views_count

---

**Generated:** April 2, 2026  
**Status:** Complete Audit with 8 Issues Identified
