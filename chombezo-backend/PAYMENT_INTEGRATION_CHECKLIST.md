# Payment Polling Implementation Checklist

Complete these steps to integrate optimized payment polling into your frontend.

## Step 1: Copy Polling Utilities to Frontend

Copy these files from backend to your frontend project:

```bash
# Copy polling utilities
cp lib/polling.ts src/lib/
cp lib/payment-polling-client.ts src/lib/
```

Or manually copy the content from:
- `lib/polling.ts` → `src/lib/polling.ts`
- `lib/payment-polling-client.ts` → `src/lib/payment-polling-client.ts`

## Step 2: Update Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
# or production:
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Step 3: Create PaymentVerifier Component

Create `src/components/PaymentVerifier.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { verifyPayment } from '@/lib/payment-polling-client';
import type { PaymentVerificationResult } from '@/lib/payment-polling-client';

interface PaymentVerifierProps {
  reference: string;
  onSuccess: (result: PaymentVerificationResult) => void;
  onError: (message: string) => void;
}

export function PaymentVerifier({
  reference,
  onSuccess,
  onError,
}: PaymentVerifierProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'error'>(
    'verifying'
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyPayment(
          process.env.NEXT_PUBLIC_API_URL!,
          reference
        );

        if (result.success) {
          setStatus('success');
          onSuccess(result);
        } else {
          setStatus('failed');
          onError(result.message || 'Payment verification failed');
        }
      } catch (error) {
        setStatus('error');
        onError(error instanceof Error ? error.message : 'Network error');
      }
    };

    verify();
  }, [reference, onSuccess, onError]);

  return (
    <div className="space-y-4">
      {status === 'verifying' && (
        <>
          <div className="animate-pulse text-center">
            <p className="text-lg font-semibold">Verifying payment...</p>
            <p className="text-sm text-gray-600">
              Please wait while we confirm your payment with FastLipa
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">✓ Payment successful!</p>
          <p className="text-sm text-green-700">Your premium access is now active.</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">✗ Payment failed</p>
          <p className="text-sm text-red-700">Please try again or contact support.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold">Network error</p>
          <p className="text-sm text-yellow-700">
            Please check your connection and try again.
          </p>
        </div>
      )}
    </div>
  );
}
```

## Step 4: Update Payment Modal

If you have a `PaymentModal.tsx`, update it:

```typescript
'use client';

import { useState } from 'react';
import { PaymentVerifier } from './PaymentVerifier';
import type { PaymentVerificationResult } from '@/lib/payment-polling-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'form' | 'verifying' | 'complete'>('form');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [amount] = useState(1000); // Premium access price

  const handleCreatePayment = async (phoneNumber: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: phoneNumber,
            amount_tsh: amount,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPaymentReference(data.data.provider_reference);
        setStep('verifying');
      } else {
        alert('Failed to create payment: ' + data.message);
      }
    } catch (error) {
      alert('Error creating payment: ' + error);
    }
  };

  const handleVerificationSuccess = (result: PaymentVerificationResult) => {
    // Store access token
    if (result.accessToken) {
      localStorage.setItem('access_token', result.accessToken);
      localStorage.setItem('token_expires_at', result.expiresAt || '');
    }

    setStep('complete');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const handleVerificationError = (message: string) => {
    alert('Verification failed: ' + message);
    setStep('form');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Premium Access</h2>

        {step === 'form' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const phone = new FormData(e.currentTarget).get('phone') as string;
              handleCreatePayment(phone);
            }}
          >
            <input
              type="tel"
              name="phone"
              placeholder="07xxxxxxxxx"
              required
              className="w-full border rounded-lg p-2 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Pay {amount} TSH
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 text-gray-600 py-2 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </form>
        )}

        {step === 'verifying' && (
          <PaymentVerifier
            reference={paymentReference}
            onSuccess={handleVerificationSuccess}
            onError={handleVerificationError}
          />
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">✓</div>
            <h3 className="text-xl font-bold text-green-600">Success!</h3>
            <p className="text-gray-700">Your premium access is now active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 5: Update Tests

Add tests for polling in `src/__tests__/payment-polling.test.ts`:

```typescript
import { verifyPayment } from '@/lib/payment-polling-client';

describe('Payment Polling', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('verifies successful payment', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        status: 'paid',
        isSettled: true,
        data: {
          access: {
            session_token: 'sess_test',
            expires_at: '2025-12-31T00:00:00Z',
            minutes_remaining: 60,
          },
        },
        message: 'Payment successful',
      })
    );

    const result = await verifyPayment('http://api.test', 'pay_test123');

    expect(result.success).toBe(true);
    expect(result.accessToken).toBe('sess_test');
  });

  test('handles pending payment with retry', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        success: false,
        status: 'pending',
        isSettled: false,
        shouldRetry: true,
        nextRetryMs: 1000,
        message: 'Payment processing',
      })
    );

    fetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        status: 'paid',
        isSettled: true,
        message: 'Payment successful',
      })
    );

    const result = await verifyPayment('http://api.test', 'pay_test123');

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('stops after max attempts', async () => {
    // Mock 21 pending responses (more than max 20)
    for (let i = 0; i < 21; i++) {
      fetch.mockResponseOnce(
        JSON.stringify({
          success: false,
          status: 'pending',
          isSettled: false,
          shouldRetry: i < 20,
          message: 'Payment processing',
        })
      );
    }

    const result = await verifyPayment('http://api.test', 'pay_test123');

    expect(result.success).toBe(false);
    expect(result.isSettled).toBe(true);
  });
});
```

## Step 6: Update Documentation

Add to your frontend README:

```markdown
## Payment Verification

The payment system uses exponential backoff polling for optimal performance:

- Initial retry: 1 second
- Maximum retry: 8 seconds  
- Exponential backoff: 1.5x multiplier
- Random jitter: ±20% to prevent load spikes
- Max attempts: 20 (~60 seconds total)

### Example

\`\`\`typescript
import { verifyPayment } from '@/lib/payment-polling-client';

const result = await verifyPayment(
  process.env.NEXT_PUBLIC_API_URL,
  paymentReference
);

if (result.success) {
  // Grant premium access
}
\`\`\`

See [PAYMENT_POLLING_GUIDE.md](../PAYMENT_POLLING_GUIDE.md) for detailed documentation.
```

## Step 7: Testing in Development

```bash
# Terminal 1: Start backend
cd chombezo-backend
npm run dev

# Terminal 2: Start frontend
npm run dev

# Test payment flow:
# 1. Click "Get Premium Access"
# 2. Enter phone number (e.g., 07xxxxxxxxx)
# 3. Payment will be created
# 4. Polling will start with exponential backoff
# 5. Monitor console for retry delays
```

## Step 8: Monitor in Production

Add monitoring to track polling effectiveness:

```typescript
import { verifyPayment } from '@/lib/payment-polling-client';

const startTime = Date.now();

const result = await verifyPayment(
  API_URL,
  reference
);

const duration = Date.now() - startTime;

// Send metrics
analytics.event('payment_verified', {
  success: result.success,
  duration_ms: duration,
  attempts: result._attempts || 1,
});
```

## Verification Checklist

- [ ] Polling utilities copied to frontend
- [ ] Environment variables configured
- [ ] PaymentVerifier component created
- [ ] Payment modal updated
- [ ] Unit tests added
- [ ] Documentation updated
- [ ] No manual sleep/setInterval calls
- [ ] Error handling implemented
- [ ] Loading states shown to user
- [ ] Tested with actual FastLipa (or mock in dev)
- [ ] Production monitoring enabled

## Common Issues

### "API not found" error
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running
- Check CORS settings

### "Payment still pending" after 60 seconds
- FastLipa is genuinely slow
- User may have network issues
- Consider increasing `POLLING_TIMEOUT_SECONDS`

### Too many API calls in console
- This is normal - exponential backoff means fewer over time
- First few are fast (debugging), then spread out

## Next Steps

1. Deploy to staging
2. Test with real FastLipa credentials
3. Monitor payment success rates
4. Adjust polling config based on payment speeds
5. Deploy to production
6. Monitor metrics continuously

---

Questions? See [PAYMENT_POLLING_GUIDE.md](../PAYMENT_POLLING_GUIDE.md) for detailed documentation.
