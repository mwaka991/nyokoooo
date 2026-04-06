import { useEffect, useState, useRef } from 'react';
import { pollPaymentWithFeedback } from '@/lib/payment-polling-client';
import type { PaymentVerificationResult } from '@/lib/payment-polling-client';

interface PaymentVerifierProps {
  reference: string;
  apiUrl: string;
  onSuccess: (result: PaymentVerificationResult) => void;
  onError: (message: string) => void;
}

export function PaymentVerifier({
  reference,
  apiUrl,
  onSuccess,
  onError,
}: PaymentVerifierProps) {
  const [status, setStatus] = useState<'verifying' | 'waiting_for_pin' | 'success' | 'failed' | 'error' | 'timeout'>(
    'verifying'
  );
  const [message, setMessage] = useState('Verifying payment...');
  const [progress, setProgress] = useState(0);
  const [nextRetrySeconds, setNextRetrySeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const explicitFailureRef = useRef<boolean>(false);

  // Track elapsed time
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle showing timeout after 30 seconds of PENDING
  useEffect(() => {
    // If we're in waiting_for_pin (PENDING) state and 30 seconds have passed without explicit failure,
    // transition to timeout to encourage user retry
    if (status === 'waiting_for_pin' && elapsedSeconds >= 30 && !explicitFailureRef.current) {
      console.log('[Payment] Auto-timeout triggered after 30 seconds of PENDING');
      setStatus('timeout');
      setMessage('Payment verification taking longer than expected. Please try again or check your payment status.');
      onError('Payment verification timeout - no response after 30 seconds');
    }
  }, [status, elapsedSeconds, onError]);

  useEffect(() => {
    const verify = async () => {
      try {
        await pollPaymentWithFeedback(apiUrl, reference, {
          onAttempt: (attempt) => {
            setProgress(Math.min((attempt / 20) * 100, 95));
          },

          onWaiting: (delayMs) => {
            setNextRetrySeconds(Math.round(delayMs / 1000));
            setMessage(`Payment processing... Next check in ${Math.round(delayMs / 1000)}s`);
          },

          onSuccess: (result) => {
            setProgress(100);
            
            // Explicitly check payment status - PENDING is NOT a failure!
            const paymentStatus = result.status?.toUpperCase();
            
            console.log('[Payment] Verification result:', {
              success: result.success,
              status: paymentStatus,
              isSettled: result.isSettled,
              message: result.message,
              elapsedSeconds,
            });
            
            if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS' || result.success) {
              // Success - payment confirmed
              setStatus('success');
              setMessage(result.message || 'Payment confirmed!');
              onSuccess(result);
            } else if (paymentStatus === 'PENDING') {
              // PENDING means still waiting for user to enter PIN on their phone
              // This is NOT a failure - do NOT show failure UI
              // The component will automatically transition to timeout after 30 seconds
              // if the payment is still not resolved
              setStatus('waiting_for_pin');
              setMessage('Subiri kidogo...');
              onSuccess(result);  // Pass result so parent can see it's still pending
            } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED') {
              // These are actual explicit failures from FastLipa - show immediately
              explicitFailureRef.current = true;
              setStatus('failed');
              setMessage(result.message || `Payment ${paymentStatus.toLowerCase()}`);
              onError(result.message || `Payment ${paymentStatus.toLowerCase()}`);
            } else if (result.message?.includes('timeout') || result.message?.includes('Polling timeout')) {
              // Polling max attempts reached - show as timeout, not failure
              setStatus('timeout');
              setMessage(result.message || 'Payment verification timed out. Please check your payment status.');
              onError(result.message || 'Payment verification timed out');
            } else {
              // Unknown status - mark as explicit failure
              explicitFailureRef.current = true;
              setStatus('failed');
              setMessage(result.message || 'Payment verification failed');
              onError(result.message || 'Payment verification failed');
            }
          },

          onError: (error) => {
            setStatus('error');
            setMessage(error.message || 'Network error');
            onError(error.message || 'Network error');
          },
        });
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unknown error');
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    verify();
  }, [reference, apiUrl, onSuccess, onError]);

  return (
    <div className="space-y-4 p-6">
      {(status === 'verifying' || status === 'waiting_for_pin') && (
        <>
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-lg font-semibold mt-4">
              {status === 'waiting_for_pin' ? 'Subiri Kidogo' : 'Verifying Payment'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {message}
            </p>
            {nextRetrySeconds > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Checking payment status in {nextRetrySeconds}s...
              </p>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500">
            {status === 'waiting_for_pin' 
              ? `Waiting for you to enter your PIN on your phone... (${elapsedSeconds}s elapsed)`
              : `Progress: ${Math.round(progress)}%`
            }
          </p>
        </>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
            <p className="text-sm text-green-700 mt-2">{message}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Premium access has been granted. You can now watch all premium videos!
            </p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-4 text-red-600">✕</div>
            <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
            <p className="text-sm text-red-700 mt-2">{message}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Your payment could not be processed. Please try again or contact support.
            </p>
          </div>
        </div>
      )}

      {status === 'timeout' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-4 text-yellow-600">⏱</div>
            <h3 className="text-xl font-bold text-yellow-600">Verification Timeout</h3>
            <p className="text-sm text-yellow-700 mt-2">{message}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              We couldn't confirm your payment in time. Please check your payment status or try again.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-4 text-yellow-600">⚠</div>
            <h3 className="text-xl font-bold text-yellow-600">Connection Error</h3>
            <p className="text-sm text-yellow-700 mt-2">{message}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please check your internet connection and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
