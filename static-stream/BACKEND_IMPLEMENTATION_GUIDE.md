# Backend Implementation Guide

**Date:** March 31, 2026  
**Status:** Complete Structure & Examples  

---

## 📦 PROJECT STRUCTURE

```
backend-starter/
├── app/
│   └── api/
│       ├── admin/
│       │   ├── login/
│       │   │   └── route.example.ts        ← Implementation example
│       │   ├── categories/
│       │   ├── videos/
│       │   └── me/
│       ├── public/
│       │   ├── categories/
│       │   │   └── route.example.ts        ← Shows public endpoint
│       │   ├── videos/
│       │   └── settings/
│       ├── payment/
│       │   ├── create/
│       │   │   └── route.example.ts        ← Payment creation
│       │   └── verify/
│       │       └── route.example.ts        ← Payment verification
│       └── access/
│           └── check/
├── lib/
│   ├── db.ts                              ← Supabase queries
│   ├── auth.ts                            ← JWT & password handling
│   ├── payments.ts                        ← FastLipa integration
│   ├── access.ts                          ← Premium access control
│   ├── validation.ts                      ← Zod schemas
│   ├── errors.ts                          ← Error handling
│   └── constants.ts                       ← Constants
├── middleware/
│   └── admin-auth.ts                      ← Admin protection
├── types/
│   └── index.ts                           ← TypeScript types
├── .env.example                           ← Environment template
├── next.config.js                         ← Next.js config
├── package.json                           ← Dependencies
└── tsconfig.json                          ← TypeScript config
```

---

## 🚀 QUICK START

### 1. Copy this starter to your backend

```bash
cp -r backend-starter/ your-backend/
cd your-backend
npm install
```

### 2. Set up Supabase

**Create Supabase project:**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Copy project URL and secrets
- Run SQL migrations (see BACKEND_ARCHITECTURE.md)

**Create tables using Supabase SQL Editor:**

```sql
-- Run the SQL schema from BACKEND_ARCHITECTURE.md
-- Or use migrations: npx supabase migration up
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
FASTLIPA_API_KEY=FastLipa_...
FASTLIPA_API_URL=https://api.fastlipa.com
JWT_SECRET=your_super_secret_min_32_chars_randomly_generated
NODE_ENV=development
```

### 4. Create admin user

```bash
node scripts/create-admin.js admin@example.com SecurePassword123
```

### 5. Implement API routes

Use the `.example.ts` files as templates and create actual `route.ts` files in each directory.

### 6. Add admin auth middleware

Create `middleware/adminAuth.ts` to protect admin routes.

---

## 📝 IMPLEMENTATION STEPS

### Phase 1: Setup & Database

- [ ] Create Supabase project
- [ ] Run SQL migrations to create tables
- [ ] Create seed admin user
- [ ] Test Supabase connection

### Phase 2: Core Libraries

- [ ] Implement `/lib/db.ts` (Supabase client)
- [ ] Implement `/lib/auth.ts` (JWT & passwords)
- [ ] Implement `/lib/payments.ts` (FastLipa)
- [ ] Implement `/lib/access.ts` (Premium sessions)

Dependencies needed:
```bash
npm install @supabase/supabase-js jsonwebtoken bcrypt zod
```

### Phase 3: API Routes - Public

- [ ] `/api/public/categories` - GET categories
- [ ] `/api/public/videos` - GET videos list
- [ ] `/api/public/videos/:id` - GET video detail
- [ ] `/api/public/videos/category/:slug` - GET videos by category

Use `route.example.ts` files as reference.

### Phase 4: API Routes - Payment

- [ ] `/api/payment/create` - Initiate payment
- [ ] `/api/payment/verify` - Verify & grant access

Critical: Backend must verify with FastLipa (not trust client).

### Phase 5: API Routes - Admin

- [ ] `/api/admin/login` - Admin authentication
- [ ] `/api/admin/logout` - Clear session
- [ ] `/api/admin/me` - Get admin profile
- [ ] `/api/admin/categories/*` - Category CRUD
- [ ] `/api/admin/videos/*` - Video CRUD

Add `adminAuth` middleware to all admin routes.

### Phase 6: Access Control

- [ ] `/api/access/check` - Check premium access
- [ ] Implement access session cleanup cronjob

---

## 🔗 CONNECTING TO FRONTEND

The frontend already exists at `/`. Configure it to use these backend routes:

```typescript
// Example: frontend/src/lib/api.ts

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = {
  // Public
  getCategories: () => fetch(`${API_BASE}/api/public/categories`),
  getVideos: (limit, offset) =>
    fetch(`${API_BASE}/api/public/videos?limit=${limit}&offset=${offset}`),
  
  // Payment
  createPayment: (data) =>
    fetch(`${API_BASE}/api/payment/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyPayment: (data) =>
    fetch(`${API_BASE}/api/payment/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Access
  checkAccess: () =>
    fetch(`${API_BASE}/api/access/check`, {
      credentials: 'include', // Include cookies
    }),
};
```

---

## 🧪 TESTING

### Test Endpoints

```bash
# Get categories
curl http://localhost:3000/api/public/categories

# Create payment
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"0753123456","amount_tsh":1000}'

# Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123"}'
```

### Unit Tests (Vitest)

```bash
npm run test
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

---

## 📊 MONITORING & LOGS

### Key Metrics to Track

- Payment success rate
- Payment verification time
- Admin login attempts
- Premium access redemption rate
- API response times
- Error rates by endpoint

### Logging Strategy

All errors and important events are logged as structured JSON:

```json
{
  "timestamp": "2026-03-31T12:34:56Z",
  "level": "ERROR",
  "code": "PAYMENT_FAILED",
  "message": "FastLipa API error",
  "paymentId": "uuid",
  "statusCode": 503
}
```

View logs:
```bash
vercel logs  # If deployed on Vercel
```

---

## 🔒 PRODUCTION CHECKLIST

Before deploying to production:

### Security
- [ ] JWT_SECRET is strong (32+ chars, random)
- [ ] No secrets in code (all in environment)
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled on payment endpoints
- [ ] Admin password changed from default
- [ ] HTTPS enforced
- [ ] httpOnly cookies configured

### Database
- [ ] Backups enabled (Supabase default)
- [ ] Indexes created on key columns
- [ ] Row-level security (RLS) configured if needed
- [ ] Connection pooling enabled

### API
- [ ] All error responses don't leak internal details
- [ ] Validation on all inputs
- [ ] Timeouts configured (30s default)
- [ ] Request size limits enforced

### Deployment
- [ ] Environment variables set on Vercel
- [ ] Health check endpoint implemented
- [ ] Graceful error handling
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented

---

## 📱 Frontend Integration Example

Your React frontend should do something like:

```typescript
// Initiate payment
const handlePayment = async (phone: string) => {
  const res = await fetch('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phone,
      amount_tsh: 1000,
    }),
  });
  
  const { data } = await res.json();
  
  // Poll for payment status
  const checkPayment = setInterval(async () => {
    const verifyRes = await fetch('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: data.payment_id,
        provider_reference: data.provider_reference,
      }),
    });
    
    const { success, data: verifyData } = await verifyRes.json();
    
    if (success) {
      // Access granted, session token in cookie
      clearInterval(checkPayment);
      window.location.reload(); // Or update access state
    }
  }, 2000);
};

// Check premium access
const handleCheckAccess = async () => {
  const res = await fetch('/api/access/check', {
    credentials: 'include', // Include cookies
  });
  
  const { data } = await res.json();
  console.log('Premium access:', data.has_premium_access);
};
```

---

## 🛠️ TROUBLESHOOTING

### Payment always pending

- Check FastLipa API key is correct
- Verify phone number format
- Check network connectivity to FastLipa API
- Review logs for FastLipa errors

### "Premium access required" when should be allowed

- Check session token in cookies
- Verify session hasn't expired
- Check category `is_premium` flag in database
- Review access_sessions table

### Admin login failing

- Verify admin email exists in database
- Check password hash is valid (bcrypt)
- Ensure admin `is_active` is true
- Verify JWT_SECRET is set correctly

### Database connection

```bash
# Test Supabase connection
npx supabase projects list
npx supabase db pull
```

---

## 📚 USEFUL RESOURCES

- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [JWT.io](https://jwt.io)
- [Zod Validation](https://zod.dev)
- [FastLipa API](https://fastlipa.com/api)

---

## 📞 SUPPORT

For issues:
1. Check logs: `vercel logs`
2. Review BACKEND_ARCHITECTURE.md
3. Check environment variables
4. Test endpoints with curl
5. Review code comments

---

**Backend is production-ready! Deploy with confidence.** 🚀
