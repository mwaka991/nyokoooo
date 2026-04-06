import { useState } from 'react';
import { payments, API_URL } from '@/lib/api-client';
import { PaymentVerifier } from './PaymentVerifier';
import type { PaymentVerificationResult } from '@/lib/payment-polling-client';

const PRICE_TSH = 1000;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: PaymentVerificationResult) => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'form' | 'verifying' | 'complete'>('form');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Create payment
      const result = await payments.create(phoneNumber, PRICE_TSH);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create payment');
      }

      const reference = (result.data as any)?.provider_reference;
      if (!reference) {
        throw new Error('No payment reference received');
      }

      setPaymentReference(reference);
      setStep('verifying');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (result: PaymentVerificationResult) => {
    // Store access token
    if (result.accessToken) {
      localStorage.setItem('access_token', result.accessToken);
      localStorage.setItem('token_expires_at', result.expiresAt || '');
    }

    setStep('complete');
    
    // Wait before closing
    setTimeout(() => {
      onSuccess(result);
      resetModal();
      onClose();
    }, 2000);
  };

  const handleVerificationError = (message: string) => {
    setError(message);
    setStep('form');
  };

  const resetModal = () => {
    setStep('form');
    setPhoneNumber('');
    setPaymentReference('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Get Premium</h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-blue-700 rounded-full p-1 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Unlock All Premium Videos
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  weka namba ya malipo kufungua video zote
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="07xxxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  FastLipa will send payment instructions to this number
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Premium Access (1 hour)
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {PRICE_TSH} TSH
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg transition disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Lipia 1000 kupata video zote
              </p>
            </form>
          )}

          {step === 'verifying' && (
            <PaymentVerifier
              reference={paymentReference}
              apiUrl={API_URL}
              onSuccess={handleVerificationSuccess}
              onError={handleVerificationError}
            />
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4 py-8">
              <div className="text-6xl animate-bounce">✓</div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                <p className="text-gray-700">
                  Your premium access is now active. Closing...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
