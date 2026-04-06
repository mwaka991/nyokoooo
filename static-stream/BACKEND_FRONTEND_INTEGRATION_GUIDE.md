# COMPLETE BACKEND & FRONTEND INTEGRATION GUIDE

**Date:** March 31, 2026  
**Project:** CHOMBEZO TAMU Premium Video Platform  
**Status:** Ready for Integration  

---

## 📋 EXECUTIVE SUMMARY

You now have:

1. **Existing Frontend** (`/src`) - React video player, categories, video grid
2. **Backend Architecture** (`BACKEND_ARCHITECTURE.md`) - Complete design document
3. **Starter Code** (`backend-starter/`) - Production-ready implementation templates
4. **Implementation Guide** (`BACKEND_IMPLEMENTATION_GUIDE.md`) - Step-by-step setup
5. **This Document** - Integration walkthrough

**Next Step:** Implement the backend starter code and connect to frontend.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current State

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                │
│  - Video browsing                                   │
│  - Category filtering                               │
│  - Video player                                     │
│  - Share/Download buttons                           │
│  - ALL VIDEO DATA HARDCODED (videoData.ts)          │
│  - No backend connection yet                        │
└─────────────────────────────────────────────────────┘
                      ↓
              (WILL CONNECT TO)
                      ↓
┌─────────────────────────────────────────────────────┐
│            BACKEND API (Next.js + Supabase)         │
│  - Serves video data from database                  │
│  - Manages categories and videos                    │
│  - Handles payments with FastLipa                   │
│  - Controls premium access                          │
│  - Admin panel for content management               │
│  - NOT YET CREATED (you'll build this)              │
└─────────────────────────────────────────────────────┘
                      ↓
         ┌────────────┴────────────┐
         ▼                         ▼
    ┌──────────────┐        ┌──────────────┐
    │ Supabase DB  │        │ FastLipa API │
    │ (PostgreSQL) │        │  (Payments)  │
    └──────────────┘        └──────────────┘
```

### Target State After Integration

```
Frontend fetches from Backend:
  ✓ Categories       ← /api/public/categories
  ✓ Videos           ← /api/public/videos
  ✓ Video details    ← /api/public/videos/:id
  ✓ Payment status   ← /api/payment/verify
  ✓ Access status    ← /api/access/check

Backend manages:
  ✓ All video data
  ✓ Category management
  ✓ Payment processing
  ✓ Premium access control
  ✓ Admin operations
```

---

## 🔧 INTEGRATION STEPS

### STEP 1: Create Backend Project

```bash
mkdir chombezo-backend
cd chombezo-backend
cp -r ../static-stream/backend-starter/* .
npm install
```

### STEP 2: Set up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy:
   - Project URL → `SUPABASE_URL`
   - Service Key → `SUPABASE_SERVICE_KEY`
4. Run migrations (see BACKEND_ARCHITECTURE.md)

### STEP 3: Configure Environment

`.env.local`:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# FastLipa (use from your account)
FASTLIPA_API_KEY=FastLipa_UX2wIH6xC2fyGPFsHCsY1DoBe
FASTLIPA_API_URL=https://api.fastlipa.com

# JWT
JWT_SECRET=your_secret_min_32_chars_very_random_string_here

# App
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### STEP 4: Create Admin User

Generate bcrypt hash of password:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('AdminPassword123', 10, (err, hash) => console.log(hash));"
```

Insert into Supabase:

```sql
INSERT INTO admins (email, password_hash, is_active)
VALUES (
  'admin@example.com',
  '$2b$10$...(hash from above)',
  true
);
```

### STEP 5: Implement API Routes

Use template files in `backend-starter/app/api/` as reference:

1. Copy structure to actual `route.ts` files
2. Test each endpoint
3. Add admin middleware

```bash
# Test public endpoint
curl http://localhost:3000/api/public/categories

# Test admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123"}'
```

### STEP 6: Update Frontend

Create API client:

`frontend/src/lib/api.ts`:

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = {
  // Categories
  getCategories: async (includePremium = false) => {
    const res = await fetch(
      `${API_URL}/api/public/categories?includePremium=${includePremium}`
    );
    return res.json();
  },

  // Videos
  getVideos: async (limit = 20, offset = 0) => {
    const res = await fetch(
      `${API_URL}/api/public/videos?limit=${limit}&offset=${offset}`
    );
    return res.json();
  },

  getVideoById: async (id: string) => {
    const res = await fetch(`${API_URL}/api/public/videos/${id}`, {
      credentials: 'include',
    });
    return res.json();
  },

  // Payment
  createPayment: async (phone: string, amount: number) => {
    const res = await fetch(`${API_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, amount_tsh: amount }),
    });
    return res.json();
  },

  verifyPayment: async (paymentId: string, reference: string) => {
    const res = await fetch(`${API_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        payment_id: paymentId,
        provider_reference: reference,
      }),
    });
    return res.json();
  },

  // Access
  checkAccess: async () => {
    const res = await fetch(`${API_URL}/api/access/check`, {
      credentials: 'include',
    });
    return res.json();
  },
};
```

### STEP 7: Update Frontend Components

Modify `src/pages/Index.tsx` to fetch from backend:

```typescript
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Index() {
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    // Fetch categories from backend
    api.getCategories().then(res => {
      if (res.success) {
        setCategories(res.data.categories);
      }
    });
  }, []);

  useEffect(() => {
    // Fetch videos from backend
    api.getVideos(20, 0).then(res => {
      if (res.success) {
        setVideos(res.data.videos);
      }
    });
  }, []);

  // Rest of component...
}
```

### STEP 8: Deploy

**Backend - Vercel:**

```bash
cd chombezo-backend
vercel --prod
```

Set environment variables in Vercel settings.

**Frontend - Vercel:**

Already deployed. Update environment variable:

```env
REACT_APP_API_URL=https://your-backend.vercel.app
```

---

## 🎯 TESTING WORKFLOW

### Local Testing

```bash
# Terminal 1: Backend
cd chombezo-backend
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Frontend  
cd ../static-stream
npm run dev
# Runs on http://localhost:8080

# Terminal 3: Test
curl http://localhost:3000/api/public/categories
curl http://localhost:3000/api/public/videos
```

### Manual Testing Checklist

- [ ] **Public endpoints**
  - [ ] GET `/api/public/categories` returns categories
  - [ ] GET `/api/public/videos` returns videos
  - [ ] GET `/api/public/videos/:id` returns single video
  - [ ] GET `/api/public/videos/category/:slug` filters by category

- [ ] **Payment flow**
  - [ ] POST `/api/payment/create` with valid phone
  - [ ] Payment appears in Supabase
  - [ ] FastLipa receives payment request
  - [ ] POST `/api/payment/verify` checks status
  - [ ] Verify returns pending → paid flow

- [ ] **Premium access**
  - [ ] After payment succeeds, access session created
  - [ ] Session token in httpOnly cookie
  - [ ] GET `/api/access/check` returns access status
  - [ ] Premium videos accessible with valid token

- [ ] **Admin panel**
  - [ ] POST `/api/admin/login` with credentials
  - [ ] Returns JWT token
  - [ ] Token allows access to admin routes
  - [ ] Admin can create/update/delete categories
  - [ ] Admin can create/update/delete videos

---

## 📋 DATA MIGRATION (Optional)

If you want to migrate hardcoded video data to database:

```typescript
// scripts/migrate-videos.js

import { supabase } from '@/lib/db';
import { videos } from '@/src/lib/videoData';

async function migrate() {
  const categoryMap = {};

  // Get or create categories
  for (const video of videos) {
    if (!categoryMap[video.category]) {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', video.category)
        .single();

      if (!data) {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({
            name: video.category,
            slug: video.category.toLowerCase().replace(/ /g, '-'),
            is_premium: false,
            is_active: true,
          })
          .select('id')
          .single();

        categoryMap[video.category] = newCat.id;
      } else {
        categoryMap[video.category] = data.id;
      }
    }
  }

  // Insert videos
  for (const video of videos) {
    await supabase.from('videos').insert({
      category_id: categoryMap[video.category],
      title: video.title,
      thumbnail_url: video.thumbnail,
      video_url: video.videoUrl,
      is_active: true,
    });
  }

  console.log('Migration complete');
}

migrate();
```

Run:
```bash
node scripts/migrate-videos.js
```

---

## 🔒 SECURITY REMINDERS

1. **Never commit secrets** (.env.local is listed in .gitignore)
2. **JWT_SECRET** - Generate random 32+ char string
3. **Database** - Use service key only on backend
4. **Passwords** - Always hash with bcrypt
5. **CORS** - Restrict to frontend domain in production
6. **Validation** - Validate all inputs with Zod
7. **FastLipa** - Verify payments server-to-server

---

## 🚀 DEPLOYMENT CHECKLIST

### Before going live:

- [ ] All environment variables set on Vercel
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] All API endpoints tested
- [ ] Premium access tested end-to-end
- [ ] Payment flow tested
- [ ] Frontend connects to backend API
- [ ] CORS configured
- [ ] Error handling verified
- [ ] Backups enabled
- [ ] Monitoring configured
- [ ] Rate limiting enabled
- [ ] Logging working

---

## 📞 COMMON ISSUES

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js jsonwebtoken bcrypt zod
```

**"SUPABASE_URL is not set"**
- Check `.env.local` file exists
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set
- Restart dev server after changing .env

**Payment always pending**
- Verify FastLipa API key
- Check phone validation
- Review FastLipa logs

**Frontend shows 403 premium required but should be public**
- Check `is_premium` flag on category in database
- Verify video is linked to correct category

---

## 📊 MONITORING

Track these KPIs:

```
Payment Metrics:
- Success rate (target: >95%)
- Average verification time (target: <5s)
- Payment amount distribution

Access Metrics:
- Premium content views
- Session conversion rate
- Average session duration

API Metrics:
- Response times (target: <500ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%)
```

---

## 🎓 LEARNING RESOURCES

To understand the architecture better:

1. **BACKEND_ARCHITECTURE.md** - Complete design document
2. **BACKEND_IMPLEMENTATION_GUIDE.md** - Step-by-step implementation
3. **Example routes** in `backend-starter/app/api/*/route.example.ts`
4. **Error handling** in `backend-starter/lib/errors.ts`
5. **Payment flow** in `backend-starter/lib/payments.ts`

---

## 🎯 SUCCESS CRITERIA

You'll know the integration is successful when:

✅ Frontend connects to backend without errors  
✅ Categories loaded from database  
✅ Videos played from backend URLs  
✅ Payment flow works end-to-end  
✅ Premium access granted after payment  
✅ Admin can manage content  
✅ All API endpoints respond correctly  
✅ No hardcoded video data needed  
✅ Production deployment stable  
✅ Team can deploy independently  

---

## 📞 SUPPORT RESOURCES

- BACKEND_ARCHITECTURE.md - Full technical design
- backend-starter/ - Starter code with examples
- BACKEND_IMPLEMENTATION_GUIDE.md - Step-by-step implementation
- Code comments in lib/ files
- Example route files

---

**You're ready to build a production-grade backend!** 🚀

Happy coding! 💻

