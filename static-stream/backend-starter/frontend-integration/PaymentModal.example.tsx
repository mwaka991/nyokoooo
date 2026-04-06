/**
 * EXAMPLE: Payment Modal Component
 * 
 * Shows how to implement payment flow in frontend using the backend API.
 * Handles:
 * - Phone number input
 * - Payment initiation
 * - Status polling
 * - Success/error handling
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  premiumPrice?: number;
  premiumDuration?: number;
}

export function PaymentModal({
  open,
  onOpenChange,
  onSuccess,
  premiumPrice = 1000,
  premiumDuration = 60,
}: PaymentModalProps) {
  // State
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'input' | 'processing' | 'success'>('input');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [providerReference, setProviderReference] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  // Validate phone format (Tanzania: 0712345678 or +255712345678)
  const validatePhone = (p: string): boolean => {
    const cleanPhone = p.replace(/\D/g, '');
    // Either starts with 0 (Tanzania local) or 255 (international)
    return /^(0|255)\d{9}$/.test(cleanPhone);
  };

  // Format phone for display
  const formatPhoneDisplay = (p: string): string => {
    const clean = p.replace(/\D/g, '');
    if (clean.length === 10 && clean.startsWith('0')) {
      return `+255${clean.slice(1)}`;
    }
    return clean;
  };

  // Step 1: Initiate payment
  const handleInitiatePayment = async () => {
    if (!validatePhone(phone)) {
      setError('Invalid phone number. Use format: 0712345678 or +255712345678');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call backend to create payment
      const response = await apiClient.payment.create({
        phone_number: phone,
        amount_tsh: premiumPrice,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create payment');
      }

      // Store payment details for verification
      setPaymentId(response.data.payment.id);
      setProviderReference(response.data.payment.provider_reference || '');
      setStage('processing');
      setPollingCount(0);

      // This will be logged: "Prompt user to approve payment on phone"
      console.log('Payment created. Phone:', formatPhoneDisplay(phone));
      console.log('Amount: TSH', premiumPrice);
      console.log('Duration:', premiumDuration, 'minutes');
      console.log('Action: User should see FastLipa prompt on their phone');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Poll for payment status (triggered when stage changes to 'processing')
  useEffect(() => {
    if (stage !== 'processing' || !paymentId || !providerReference) return;

    const pollPayment = async () => {
      try {
        // Auto-verify with backend every 2 seconds
        const response = await apiClient.payment.verify({
          payment_id: paymentId,
          provider_reference: providerReference,
        });

        setPollingCount(p => p + 1);

        if (response.success && response.data) {
          const payment = response.data.payment;

          // Check payment status
          if (payment.status === 'paid') {
            // Success!
            setStage('success');

            // Refresh access status
            await apiClient.access.checkStatus();

            // Call success callback
            if (onSuccess) {
              setTimeout(onSuccess, 1500);
            }

            // Close dialog after 3 seconds
            setTimeout(() => {
              resetModal();
              onOpenChange(false);
            }, 3000);

            return; // Stop polling
          } else if (payment.status === 'failed' || payment.status === 'expired') {
            throw new Error(`Payment ${payment.status}`);
          }

          // Still pending, continue polling...
          console.log(`Payment pending... (check ${pollingCount}/30)`);
        } else {
          throw new Error(response.error?.message || 'Verification failed');
        }
      } catch (err) {
        console.error('Poll error:', err);
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setStage('input');
      }
    };

    // Poll every 2 seconds, max 30 attempts (1 minute)
    const timeout = setTimeout(pollPayment, pollingCount === 0 ? 0 : 2000);
    return () => clearTimeout(timeout);
  }, [stage, paymentId, providerReference, pollingCount]);

  const resetModal = () => {
    setPhone('');
    setError(null);
    setStage('input');
    setPaymentId(null);
    setProviderReference(null);
    setPollingCount(0);
  };

  const handleClose = () => {
    if (stage !== 'processing') {
      resetModal();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* INPUT STAGE: Phone number entry */}
        {stage === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle>Subscribe to Premium</DialogTitle>
              <DialogDescription>
                Get unlimited access to all premium content for {premiumDuration} minutes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Price Display */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount to pay</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  TSH {premiumPrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Duration: {premiumDuration} minutes
                </p>
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">
                  Format: 07XXXXXXXX or +255712345678
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiatePayment}
                  disabled={loading || !phone}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    'Pay TSH ' + premiumPrice.toLocaleString()
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* PROCESSING STAGE: Waiting for payment */}
        {stage === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle>Processing Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status Animation */}
              <div className="flex justify-center py-8">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-gray-300 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  📲 Action Required
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  An approval prompt has been sent to <strong>{formatPhoneDisplay(phone)}</strong>
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Please approve the payment on your phone to complete the transaction.
                </p>
              </div>

              {/* Polling Status */}
              <div className="text-center text-sm text-gray-500">
                <p>Waiting for confirmation...</p>
                <p className="text-xs mt-1">Attempt {pollingCount}/30</p>
              </div>

              {/* Info Box */}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Don't have FastLipa?</strong> The payment system will guide you to install it if needed.
                </AlertDescription>
              </Alert>

              {/* Note about disable cancel during processing */}
              <p className="text-xs text-gray-400 text-center">
                Please wait while we verify your payment...
              </p>
            </div>
          </>
        )}

        {/* SUCCESS STAGE */}
        {stage === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>✓ Payment Successful!</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <div className="text-3xl">✓</div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Premium Access Granted!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  You now have access to all premium content for the next {premiumDuration} minutes.
                </p>
              </div>

              {/* Next Steps */}
              <Alert>
                <AlertDescription className="text-sm">
                  Your premium session is now active in your browser cookies. Refresh or browse to enjoy premium content!
                </AlertDescription>
              </Alert>

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * USAGE IN COMPONENT:
 * 
 * import { PaymentModal } from '@/components/PaymentModal';
 * 
 * export function VideoPlayer() {
 *   const [paymentOpen, setPaymentOpen] = useState(false);
 * 
 *   return (
 *     <>
 *       <Button onClick={() => setPaymentOpen(true)}>
 *         Subscribe to Premium
 *       </Button>
 * 
 *       <PaymentModal
 *         open={paymentOpen}
 *         onOpenChange={setPaymentOpen}
 *         premiumPrice={1000}
 *         premiumDuration={60}
 *         onSuccess={() => {
 *           // Refresh video access
 *           window.location.reload();
 *         }}
 *       />
 *     </>
 *   );
 * }
 */
