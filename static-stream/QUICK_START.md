# ⚡ QUICK START: Backend to Frontend Connection

**Status:** Ready to implement  
**Time to Setup:** ~1-2 hours  
**Experience Level:** Intermediate React + Node.js  

---

## 🎯 OBJECTIVE

Connect your existing React frontend to a new Next.js backend API so that:
- ✅ Video data comes from backend (not hardcoded)
- ✅ Premium payments work
- ✅ Access control works
- ✅ Admin can manage content

---

## 📦 WHAT YOU HAVE

```
frontend/
├── src/
│   ├── pages/Index.tsx          (loads videos)
│   ├── components/VideoPlayer.tsx
│   ├── lib/videoData.ts         (currently hardcoded)
│   └── ...other components

backend-starter/
├── types/index.ts               (TypeScript types)
├── lib/
│   ├── db.ts                    (Supabase queries)
│   ├── auth.ts                  (JWT + bcrypt)
│   ├── payments.ts              (FastLipa)
│   ├── access.ts                (Premium sessions)
│   └── ...other libs
├── app/api/
│   └── ...example endpoints

Documentation/
├── BACKEND_ARCHITECTURE.md      (full design)
├── BACKEND_IMPLEMENTATION_GUIDE.md
├── BACKEND_FRONTEND_INTEGRATION_GUIDE.md (you are here)
```

---

## ✅ PREREQUISITE SETUP (DO THESE FIRST)

### 1. Create Supabase Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Fill in:
#   Name: chombezo-tamu
#   Password: (strong, store safely)
#   Region: (closest to your users, e.g., Africa/Johannesburg if available)
```

**After project creation:**
- Copy Project URL → save to `.env.local`
- Copy Service Role Key → save to `.env.local`

### 2. Run Database Migrations

In Supabase SQL Editor, copy-paste this entire SQL from [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md#database-schema):

```sql
-- Create tables
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  last_login_at TIMESTAMP
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- ... (see BACKEND_ARCHITECTURE.md for complete schema)
```

### 3. Create Admin Account

```bash
# Generate bcrypt hash of your admin password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourSecurePassword123', 10, (err, hash) => console.log(hash));"

# Copy the hash, then in Supabase SQL Editor:
INSERT INTO admins (email, password_hash, is_active)
VALUES ('admin@example.com', 'hash_from_above', true);
```

### 4. Create Settings

```sql
INSERT INTO settings (key, value) VALUES 
('PREMIUM_PRICE_TSH', '1000'),
('PREMIUM_DURATION_MINUTES', '60');
```

---

## 🔧 BACKEND SETUP (15 minutes)

### Step 1: Scaffold Project

```bash
# Create Next.js project in backend-starter
cd chombezo-backend
npm init -y
npm install next react react-dom typescript @types/node @types/react
npm install @supabase/supabase-js jsonwebtoken bcrypt zod dotenv
npm install -D @types/jsonwebtoken @types/bcrypt
```

### Step 2: Create Backend Structure

```bash
mkdir -p app/api/public
mkdir -p app/api/admin
mkdir -p app/api/payment
mkdir -p app/api/access
mkdir -p lib
mkdir -p types
```

### Step 3: Copy Library Files

From `backend-starter/lib/` to your project:
- `db.ts`
- `auth.ts`
- `payments.ts`
- `access.ts`
- `validation.ts`
- `errors.ts`
- `constants.ts`

From `backend-starter/types/` to your project:
- `index.ts`

### Step 4: Copy Example API Routes

Use example routes in `backend-starter/app/api/` as templates.

For each, rename `.example.ts` → `route.ts`:

```bash
# Public endpoints
cp app/api/public/categories/route.example.ts app/api/public/categories/route.ts
cp app/api/public/videos/route.example.ts app/api/public/videos/route.ts

# Payment endpoints
cp app/api/payment/create/route.example.ts app/api/payment/create/route.ts
cp app/api/payment/verify/route.example.ts app/api/payment/verify/route.ts

# Admin endpoints
cp app/api/admin/login/route.example.ts app/api/admin/login/route.ts
```

### Step 5: Create .env.local

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# FastLipa
FASTLIPA_API_KEY=your-fastlipa-api-key-here
FASTLIPA_API_URL=https://api.fastlipa.com

# JWT
JWT_SECRET=generate_random_32_char_string_here_make_it_very_secure

# Runtime
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 6: Test Backend

```bash
npm run dev

# In another terminal:
curl http://localhost:3000/api/public/categories

# Should return:
# {
#   "success": true,
#   "data": { "categories": [...] }
# }
```

---

## 🎨 FRONTEND SETUP (30 minutes)

### Step 1: Copy API Client

Copy `backend-starter/frontend-integration/api-client.ts` to:
```
frontend/src/lib/api-client.ts
```

### Step 2: Update Environment

In `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:3000
```

### Step 3: Update Index Component

Copy `backend-starter/frontend-integration/Index.example.tsx` and adapt:

**Current (hardcoded):**
```typescript
import { videoData } from '@/lib/videoData';

export default function Index() {
  const videos = videoData;
  // ...
}
```

**New (from backend):**
```typescript
import { apiClient } from '@/lib/api-client';

export default function Index() {
  const [videos, setVideos] = useState([]);
  
  useEffect(() => {
    apiClient.videos.getAll().then(res => {
      if (res.success) setVideos(res.data.videos);
    });
  }, []);
  // ...
}
```

### Step 4: Add Payment Modal

Copy `backend-starter/frontend-integration/PaymentModal.example.tsx` to:
```
frontend/src/components/PaymentModal.tsx
```

### Step 5: Integrate Payment UI

In `VideoPlayer.tsx`:

```typescript
import { PaymentModal } from '@/components/PaymentModal';
import { useState } from 'react';

export function VideoPlayer({ video }) {
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setPaymentOpen(true)}>
        Subscribe
      </Button>
      
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
```

---

## ✅ LOCAL TESTING CHECKLIST

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# http://localhost:3000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# http://localhost:8080
```

**Terminal 3: Test**
```bash
# Test categories endpoint
curl http://localhost:3000/api/public/categories

# Test login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourSecurePassword123"}'

# Open frontend
# http://localhost:8080
# Should show videos from backend
```

---

## 🚀 DEPLOYMENT (Vercel)

### Backend Deployment

```bash
cd backend
vercel --prod
```

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all `.env` variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `FASTLIPA_API_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_API_URL=https://backend-xxxx.vercel.app`

### Frontend Deployment

1. Update `frontend/.env.production`:
```env
REACT_APP_API_URL=https://backend-xxxx.vercel.app
```

2. Redeploy frontend on Vercel

---

## 🐛 TROUBLESHOOTING

### Backend won't start

```bash
# Check Node version (need 16+)
node -v

# Check env file
cat .env.local

# Clear and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Frontend says "Network error - backend unavailable"

```bash
# Check backend running
curl http://localhost:3000

# Check CORS isn't blocking
# Add to backend middleware if needed:
res.headers['Access-Control-Allow-Origin'] = '*';
```

### Payment always pending

```bash
# Check FastLipa API key
echo $FASTLIPA_API_KEY

# Check backend logs
npm run dev  # Look for API call logs

# Verify with FastLipa dashboard that payment went through
```

### Videos don't load after connecting backend

```bash
# Check Supabase connection
curl http://localhost:3000/api/public/videos

# If error, verify SUPABASE_URL and SUPABASE_SERVICE_KEY
# Remember to run migrations first!
```

---

## 📞 QUICK REFERENCE

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm run dev` |
| Test API | `curl http://localhost:3000/api/public/categories` |
| Generate JWT secret | `openssl rand -base64 32` |
| Hash password | `node -e "const bcrypt = require('bcrypt'); bcrypt.hash('pass', 10, (e, h) => console.log(h));"` |
| Run migrations | Copy SQL from schema into Supabase SQL Editor |
| Deploy backend | `cd backend && vercel --prod` |
| Deploy frontend | Commit to GitHub, auto-deploy via Vercel |

---

## 🎓 NEXT STEPS AFTER SETUP

1. **Implement remaining API routes** (use examples as templates)
2. **Add admin panel** for content management
3. **Set up automated backups** for Supabase
4. **Configure monitoring** (Sentry, LogRocket)
5. **Add analytics** (Mixpanel, Segment)
6. **Performance testing** (load test with k6/artillery)
7. **Security audit** (OWASP Top 10 checklist)

---

## 📚 REFERENCE DOCS

- [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) - Complete design
- [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) - Detailed steps
- [api-client.ts](frontend-integration/api-client.ts) - Frontend API client
- [PaymentModal.example.tsx](frontend-integration/PaymentModal.example.tsx) - Payment UI
- [Index.example.tsx](frontend-integration/Index.example.tsx) - Updated Index page

---

Good luck! 🚀
