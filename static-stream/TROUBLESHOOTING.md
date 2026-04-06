# 🆘 INTEGRATION TROUBLESHOOTING & FAQ

**Last Updated:** March 31, 2026  
**Version:** 1.0  

---

## 🔍 DIAGNOSIS CHECKLIST

Run through these checks in order:

### 1. Backend Server Running?

```bash
# Terminal - Backend directory
npm run dev

# Should output:
# > next dev
# ▲ Next.js 14.0.0
# - ready started server on 0.0.0.0:3000

# If error, see "Backend Won't Start" below
```

### 2. Database Connected?

```bash
# Test endpoint
curl http://localhost:3000/api/public/categories

# Response should be:
# {
#   "success": true,
#   "data": { "categories": [...] }
# }

# If error, see "Database Connection" below
```

### 3. Frontend Running?

```bash
# Terminal - Frontend directory
npm run dev

# Should output:
# > vite
# VITE v7.3.1
# ➜  Local:   http://localhost:8080/

# Open http://localhost:8080 in browser
```

### 4. Frontend → Backend Connection?

Open browser DevTools (F12) → Network tab → Try loading page

- **If "Failed to fetch"** → Backend not running (check #1)
- **If 404 errors** → API route not created (check file exists)
- **If 500 errors** → Backend error (check #2)
- **If works** → Good to go! ✅

---

## 🔴 COMMON ISSUES & SOLUTIONS

### ❌ "Backend won't start - Module not found"

**Error:**
```
Error: Cannot find module '@supabase/supabase-js'
```

**Solution:**
```bash
# Install missing dependencies
npm install @supabase/supabase-js jsonwebtoken bcrypt zod

# Verify
npm ls @supabase/supabase-js
```

---

### ❌ "Backend starts but API returns 500"

**Diagnosis:**
```bash
# Check .env file exists
cat .env.local

# Check SUPABASE_URL is set
echo $SUPABASE_URL

# See actual error in terminal where npm run dev is running
```

**Solution:**

**If SUPABASE_URL not set:**
```bash
# Edit .env.local
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Restart backend
# Ctrl+C to stop, then:
npm run dev
```

**If still failing:**
```bash
# Check Supabase connection in backend code
# Visit https://supabase.com and verify:
# 1. Project exists
# 2. Service role key is correct (not user/anon key)
# 3. Database tables exist (check SQL editor)
```

---

### ❌ "Frontend says 'Network error - backend unavailable'"

**UI shows:**
```
Network error - backend unavailable
```

**Diagnosis:**
```bash
# Check backend is running
curl http://localhost:3000

# If command not found, try:
curl -I http://localhost:3000

# Should return: HTTP/1.1 200 OK
```

**Solutions:**

**Option A: Backend not running**
```bash
# Terminal - Backend directory
npm run dev
```

**Option B: Wrong API URL in frontend**
```bash
# Check frontend/.env.local
cat .env.local

# Should have:
REACT_APP_API_URL=http://localhost:3000

# If different, update and restart frontend
npm run dev
```

**Option C: CORS blocking requests**
```bash
# In browser DevTools, check Network tab for CORS error

# Solution: Add CORS middleware to backend
# In backend root, create middleware.ts:

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### ❌ "Videos don't load from backend"

**Symptoms:**
- Frontend loads but shows "No videos available"
- No errors in console

**Diagnosis:**
```bash
# Test API directly
curl http://localhost:3000/api/public/videos

# Should return videos:
# {
#   "success": true,
#   "data": {
#     "videos": [{ id: "...", title: "...", ... }]
#   }
# }
```

**Solutions:**

**If API returns empty array:**
```bash
# Videos not in database - insert sample data

# Option 1: Manual insert via Supabase
# Go to Supabase dashboard → SQL Editor
INSERT INTO videos (category_id, title, thumbnail_url, video_url, is_active)
VALUES (
  'category-uuid-here',
  'Sample Video',
  'https://example.com/thumb.jpg',
  'https://example.com/video.mp4',
  true
);

# Option 2: Migrate from hardcoded data
# Node.js script to insert videos:
const { supabase } = require('./lib/db');
const { videos } = require('./src/lib/videoData');

async function migrate() {
  for (const video of videos) {
    await supabase.from('videos').insert({
      title: video.title,
      category_id: 'get-from-db',
      thumbnail_url: video.thumbnail,
      video_url: video.videoUrl,
    });
  }
}

migrate();
```

**If API returns error:**
```bash
# Check table exists in Supabase
# SQL Editor → Run:
SELECT * FROM videos LIMIT 1;

# If "relation does not exist", run migrations:
# Copy entire SQL from BACKEND_ARCHITECTURE.md into SQL Editor
```

---

### ❌ "Payment modal doesn't appear"

**Symptoms:**
- Click "Subscribe" button → nothing happens
- No error in console

**Diagnosis:**
```javascript
// In browser console (F12)
// Try manually:
import { apiClient } from '@/lib/api-client';

// Should fail if not found:
console.log(apiClient);  // Should NOT be undefined
```

**Solutions:**

```bash
# 1. Check api-client.ts exists
ls frontend/src/lib/api-client.ts

# 2. If missing, copy it:
cp backend-starter/frontend-integration/api-client.ts frontend/src/lib/api-client.ts

# 3. Check PaymentModal component exists
ls frontend/src/components/PaymentModal.tsx

# 4. If missing, copy it:
cp backend-starter/frontend-integration/PaymentModal.example.tsx frontend/src/components/PaymentModal.tsx

# 5. Restart frontend
npm run dev
```

---

### ❌ "Payment initiated but status stays pending"

**Symptoms:**
- Modal shows "Waiting for confirmation..."
- Polling continues past 30 attempts
- Status never changes to "paid"

**Diagnosis:**
```bash
# Check backend received payment creation request
# In backend terminal, look for logs

# Test payment endpoint directly:
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"0712345678","amount_tsh":1000}'

# Should return:
# {
#   "success": true,
#   "data": {
#     "payment": { "id": "...", "status": "pending" }
#   }
# }
```

**Solutions:**

**Check FastLipa configuration:**
```bash
# Verify API key in .env.local
cat .env.local | grep FASTLIPA

# Correct format:
FASTLIPA_API_KEY=FastLipa_XXXXXXXXXXXXXXXXXXXX

# If wrong, update .env.local and restart backend
npm run dev
```

**Check payment was received by FastLipa:**
```bash
# Log actual FastLipa response in lib/payments.ts
// Add console.log before returning:
console.log('FastLipa response:', fastrlipaResponse);

// Restart backend and try payment again
// Check logs for FastLipa's actual response
```

**Check database setup:**
```bash
# Verify payments table exists in Supabase
# SQL Editor → Run:
SELECT * FROM payments LIMIT 1;

# If "relation does not exist", run migrations
```

---

### ❌ "Premium access not working after payment"

**Symptoms:**
- Payment succeeds ✓
- Session token set in cookie ✓
- But still can't see premium videos

**Diagnosis:**
```bash
# Test access check endpoint
curl http://localhost:3000/api/access/check

# Should return:
# {
#   "success": true,
#   "data": {
#     "has_access": true,
#     "premium_until": "2024-12-31T10:00:00Z"
#   }
# }
```

**Solutions:**

**Check session token is stored:**
```javascript
// In browser console
document.cookie
// Should include: access_token=sess_xxxx

// If not, check frontend creating payment correctly
```

**Check video marked as premium:**
```bash
# In Supabase, verify category is_premium = true
SELECT id, name, is_premium FROM categories;

# If is_premium = false, update it:
UPDATE categories SET is_premium = true WHERE id = 'xxx';
```

**Check session expiration:**
```bash
// In browser console:
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('access_token='))
  ?.split('=')[1];

console.log(token);  // Should show token

// Check if it's expired:
// Session duration set by PREMIUM_DURATION_MINUTES in settings
SELECT key, value FROM settings WHERE key = 'PREMIUM_DURATION_MINUTES';

# Default is 60 minutes
```

---

### ❌ "Admin login fails - Invalid credentials"

**Error:**
```
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Diagnosis:**
```bash
# Check admin exists in database
# Supabase SQL Editor:
SELECT email, is_active FROM admins;

# Should show your admin email
```

**Solutions:**

**If admin doesn't exist, create one:**
```bash
# 1. Generate bcrypt hash of password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPass123', 10, (err, hash) => console.log(hash));"

# Copy the hash, then in Supabase SQL Editor:
INSERT INTO admins (email, password_hash, is_active)
VALUES ('admin@example.com', 'hash_from_above', true);
```

**If admin exists but login fails:**
```bash
# Verify password hash was created correctly
# In Supabase SQL Editor:
SELECT email, password_hash FROM admins WHERE email = 'admin@example.com';

# Should return a hash starting with $2b$

# Try re-creating with bcrypt version check:
npm list bcrypt
# Verify version 5+ (required for Node 18+)
```

---

### ❌ "Supabase connection timeout"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# 1. Verify SUPABASE_URL in .env.local
cat .env.local | grep SUPABASE_URL

# Should be full URL like:
SUPABASE_URL=https://xxxxx.supabase.co

# 2. Verify SERVICE_KEY (not anon key!)
# Go to Supabase → Settings → API
# Copy SERVICE_ROLE_KEY (not ANON_PUBLIC_KEY)

# 3. Check internet connection
ping supabase.co

# 4. Check firewall/VPN not blocking
# Try disabling VPN temporarily

# 5. Restart backend
npm run dev
```

---

## ❓ FAQ

### Q: Can I use the same database for multiple environments (dev/staging/prod)?

**A:** No, use separate Supabase projects:

```bash
# Development
SUPABASE_URL=https://dev-xxxxx.supabase.co

# Production
SUPABASE_URL=https://prod-xxxxx.supabase.co
```

---

### Q: How do I change the premium price?

**A:** Update the settings table:

```sql
UPDATE settings 
SET value = '5000'  -- New price in TSH
WHERE key = 'PREMIUM_PRICE_TSH';

-- Verify:
SELECT * FROM settings WHERE key = 'PREMIUM_PRICE_TSH';
```

---

### Q: How do I change the premium duration?

**A:** Same process:

```sql
UPDATE settings 
SET value = '120'  -- 2 hours instead of 60 minutes
WHERE key = 'PREMIUM_DURATION_MINUTES';
```

---

### Q: What if payment processing is slow?

**A:** FastLipa polling might need adjustment:

```typescript
// In backend-starter/lib/constants.ts
export const PAYMENT = {
  POLL_INTERVAL_MS: 2000,   // Check every 2 seconds
  MAX_POLL_ATTEMPTS: 30,    // Try for 1 minute
};

// To increase timeout: 
// - Decrease interval (faster checking, more API calls)
// - Increase max attempts (longer timeout, more polling)
```

---

### Q: How do I add a new admin user?

**A:** Insert into database:

```bash
# Generate password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SecurePassword123', 10, (err, hash) => console.log(hash));"

# Add to database in Supabase SQL Editor:
INSERT INTO admins (email, password_hash, is_active)
VALUES ('manager@example.com', 'hash_from_above', true);
```

---

### Q: What if I need to disable a user?

**A:**

```sql
UPDATE admins 
SET is_active = false 
WHERE email = 'manager@example.com';
```

---

### Q: Can I test payments without phone?

**A:** Not easily - FastLipa requires real phone. For testing:

1. Use test account from FastLipa
2. Use sandbox/staging environment if FastLipa provides it
3. Mock payments in development:

```typescript
// In backend-starter/lib/payments.ts (development only):
if (process.env.NODE_ENV === 'development') {
  // Fake successful payment after 5 seconds
  setTimeout(() => {
    updatePaymentStatus(paymentId, 'paid');
  }, 5000);
}
```

---

### Q: How do I view backend logs?

**A:**

```bash
# Local development:
# Logs appear in terminal where `npm run dev` is running

# Production (Vercel):
# Go to Vercel dashboard → Deployments → Logs
```

---

### Q: How do I clear all expired sessions?

**A:**

```sql
-- Run manually in Supabase SQL Editor:
UPDATE access_sessions 
SET is_active = false 
WHERE expires_at < now();

-- Or schedule as background job
```

---

### Q: Can I backup my database?

**A:** Supabase automatic backups:

1. Go to Supabase Dashboard
2. Settings → Backups
3. Backup retention: automatic (7 days for free tier)

For manual backup:
```bash
# Export as JSON
# Supabase Dashboard → SQL Editor → Export as JSON
```

---

## 📞 SUPPORTING DOCUMENTATION

- [BACKEND_ARCHITECTURE.md](../BACKEND_ARCHITECTURE.md) - Design details
- [BACKEND_IMPLEMENTATION_GUIDE.md](../BACKEND_IMPLEMENTATION_GUIDE.md) - Implementation steps
- [QUICK_START.md](../QUICK_START.md) - Quick setup guide
- [backend-starter/lib/](../backend-starter/lib/) - Source code

---

## 🆘 STILL STUCK?

1. **Check logs** - Backend terminal should show errors
2. **Check network tab** - Browser DevTools → Network tab
3. **Verify env vars** - `cat .env.local`
4. **Restart** - Chrome full reload: Ctrl+Shift+R
5. **Search docs** - Check BACKEND_ARCHITECTURE.md for answer

---

Good luck! 💪

