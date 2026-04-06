import { useState, useEffect, useRef } from 'react';
import { payments, access } from '@/lib/api-client';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  videoUrl?: string;
  director?: string;
  production?: string;
  duration_seconds?: number;
}

interface VideoPlayerProps {
  video: VideoData;
  onClose: () => void;
  isPremium?: boolean;
}

interface PaymentStatus {
  stage: 'input' | 'processing' | 'success' | 'failed';
  paymentReference?: string;
  error?: string;
  pollingCount: number;
}

interface AccessStatus {
  hasAccess: boolean;
  sessionToken?: string;
  expiresAt?: string;
  minutesRemaining?: number;
}

// Helper function to detect Google Drive embed URLs
const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com/file/d/') && url.includes('/preview');
};

const VideoPlayer = ({ video, onClose, isPremium }: VideoPlayerProps) => {
  const [showPaymentModal, setShowPaymentModal] = useState(isPremium);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    stage: 'input',
    pollingCount: 0,
  });
  const [accessStatus, setAccessStatus] = useState<AccessStatus>({ hasAccess: !isPremium });
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingAccess, setIsLoadingAccess] = useState(isPremium); // Track if checking for previous session
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  const maxPollingAttempts = 30; // Try for 60 seconds (2 sec intervals)

  const videoUrl = video.video_url || video.videoUrl;
  const director = video.director || 'Unknown';
  const production = video.production || 'Chombezo Tamu';

  // Check for existing session token on mount
  useEffect(() => {
    if (!isPremium) {
      setIsLoadingAccess(false);
      return;
    }

    const checkExistingSession = async () => {
      try {
        // Check if we have a stored session token
        const storedToken = localStorage.getItem(`premium_token_${video.id}`) || 
                           localStorage.getItem('premium_token_all');
        
        if (storedToken) {
          // Verify the token is still valid
          const verifyResult = await access.verifyToken(storedToken);
          
          if (verifyResult.success && verifyResult.data?.valid) {
            // Token is still valid - grant access
            setAccessStatus({
              hasAccess: true,
              sessionToken: storedToken,
              expiresAt: verifyResult.data?.expires_at,
              minutesRemaining: verifyResult.data?.minutes_remaining,
            });
            setShowPaymentModal(false);
          } else {
            // Token expired or invalid - show payment modal
            setShowPaymentModal(true);
          }
        } else {
          // No token - show payment modal
          setShowPaymentModal(true);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        // On error, show payment modal to be safe
        setShowPaymentModal(true);
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkExistingSession();
  }, [isPremium, video.id]);

  // Format remaining time display
  const formatTimeRemaining = (minutes?: number): string => {
    if (!minutes) return '';
    if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    if (minutes === 60) return '1 hour';
    return `${minutes}m`;
  };

  // Poll for payment status
  const pollPaymentStatus = async (reference: string) => {
    try {
      const currentCount = pollingCountRef.current;
      if (currentCount >= maxPollingAttempts) {
        // Stop polling after too many attempts
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setPaymentStatus((prev) => ({
          ...prev,
          stage: 'failed',
          error: 'Payment verification timeout. Please try again.',
        }));
        return;
      }

      pollingCountRef.current = currentCount + 1;

      // Call verify endpoint
      const verifyResult = await payments.verify(reference);

      if (!verifyResult.success) {
        // Still pending or error
        if (verifyResult.error?.message?.includes('still pending') || verifyResult.error?.message?.includes('still processing')) {
          // Keep polling
          setPaymentStatus((prev) => ({
            ...prev,
            pollingCount: currentCount + 1,
          }));
          return;
        } else {
          // Payment failed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setPaymentStatus((prev) => ({
            ...prev,
            stage: 'failed',
            error: verifyResult.error?.message || 'Payment failed. Please try again.',
          }));
          return;
        }
      }

      // Payment successful!
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Store session token in localStorage for access verification
      const sessionToken = verifyResult.data?.access?.session_token;
      if (sessionToken) {
        localStorage.setItem(`premium_token_${video.id}`, sessionToken);
        localStorage.setItem(`premium_token_all`, sessionToken); // Also store for all premium videos
      }

      setAccessStatus({
        hasAccess: true,
        sessionToken: sessionToken,
        expiresAt: verifyResult.data?.access?.expires_at,
        minutesRemaining: verifyResult.data?.access?.minutes_remaining,
      });

      setPaymentStatus((prev) => ({
        ...prev,
        stage: 'success',
      }));

      setShowPaymentModal(false);
      setSuccessMessage(verifyResult.data?.message || '✓ Payment successful! Enjoy the video.');

      // Hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Polling error:', error);
      // Continue polling on network error
    }
  };

  // Start polling when payment is initiated
  useEffect(() => {
    if (
      paymentStatus.stage === 'processing' &&
      paymentStatus.paymentReference
    ) {
      // Start polling immediately
      pollingCountRef.current = 0;
      pollPaymentStatus(paymentStatus.paymentReference);

      // Then poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollPaymentStatus(paymentStatus.paymentReference!);
      }, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [paymentStatus.stage, paymentStatus.paymentReference, video.id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      setPaymentStatus((prev) => ({
        ...prev,
        error: 'Please enter a phone number',
      }));
      return;
    }

    setPaymentStatus({ stage: 'processing', pollingCount: 0, error: undefined });

    try {
      // Initiate payment for 1000 TSH
      const result = await payments.create(phoneNumber, 1000);

      if (!result.success) {
        throw new Error(result.error?.message || 'Payment initiation failed');
      }

      const reference = result.data?.payment_reference;
      if (!reference) {
        throw new Error('No payment reference received');
      }

      setPaymentStatus((prev) => ({
        ...prev,
        paymentReference: reference,
      }));

      console.log(`Payment initiated: ${reference}`);
    } catch (error) {
      setPaymentStatus((prev) => ({
        ...prev,
        stage: 'failed',
        error: error instanceof Error ? error.message : 'Payment initiation error',
      }));
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: video.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${video.title}.mp4`;
    a.click();
  };

  return (
    <>
      {isLoadingAccess && isPremium ? (
        // Show loading overlay while checking session
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="animate-spin inline-block">
              <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full" />
            </div>
            <p className="text-muted-foreground font-body">Checking access...</p>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-foreground w-full max-w-3xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <h2 className="font-display font-bold text-foreground text-sm truncate">
                {video.title}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground font-body text-sm border border-border px-2 py-1"
              >
                CLOSE
              </button>
            </div>

            <div className="aspect-video bg-background flex items-center justify-center">
              {isPremium && !accessStatus.hasAccess ? (
              // Locked state - show lock message
              <div className="text-center space-y-4 p-6">
                <div className="text-6xl">🔒</div>
                <div>
                  <p className="font-bold text-foreground text-lg">PREMIUM CONTENT</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    weka namba ya malipo kufungua video zote
                  </p>
                </div>
              </div>
            ) : (
              // Unlocked - show video (either regular video tag or Google Drive iframe)
              isGoogleDriveUrl(videoUrl) ? (
                <iframe
                  src={videoUrl}
                  width="100%"
                  height="100%"
                  allow="autoplay"
                  style={{
                    border: 'none',
                    minHeight: '100%',
                  }}
                  title={video.title}
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              )
            )}
            </div>

            <div className="p-4 space-y-3">
              {/* Access Status Display */}
              {accessStatus.hasAccess && accessStatus.minutesRemaining !== undefined && (
                <div className="px-3 py-2 bg-green-900/20 border border-green-600 text-green-500 text-xs font-bold flex justify-between items-center">
                  <span>✓ PREMIUM ACCESS ACTIVE</span>
                  <span>Expires in {formatTimeRemaining(accessStatus.minutesRemaining)}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground font-body">
                {director} · {production}
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 border border-border text-foreground font-body text-sm"
              >
                  SHARE
                </button>
                {accessStatus.hasAccess && !isGoogleDriveUrl(videoUrl) && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 border border-foreground bg-foreground text-background font-body text-sm"
                  >
                    DOWNLOAD
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Payment Modal */}
      {showPaymentModal && isPremium && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-foreground w-full max-w-sm max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-border px-4 py-3 sticky top-0 bg-card">
              <h3 className="font-display font-bold text-foreground">
                🔒 PREMIUM UNLOCK
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Lipia 1000 kupata video zote
              </p>
            </div>

            <div className="p-4 space-y-4">
              {paymentStatus.stage === 'input' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground font-body mb-3">
                      Access all premium video for <strong>1000tsh</strong>. Enter your phone number to continue payment via FastLipa.
                    </p>

                    <form onSubmit={handlePayment} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          PHONE NUMBER
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 0712345678 or +255712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm placeholder-muted-foreground"
                          disabled={paymentStatus.stage !== 'input'}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tanzanian number (07... or +255...)
                        </p>
                      </div>

                      {paymentStatus.error && (
                        <div className="px-3 py-2 bg-red-900/20 border border-red-600 text-red-500 text-xs font-body">
                          ✗ {paymentStatus.error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-foreground text-background font-body font-bold text-sm disabled:opacity-50"
                      >
                        PAY 1000 TSH
                      </button>
                    </form>

                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full px-4 py-2 border border-border text-foreground font-body text-sm mt-2"
                    >
                      CANCEL
                    </button>
                  </div>
                </>
              )}

              {paymentStatus.stage === 'processing' && (
                <div className="text-center space-y-3 py-4">
                  <div className="flex justify-center">
                    <div className="animate-spin">
                      <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full" />
                    </div>
                  </div>
                  <p className="font-body text-sm text-muted-foreground">
                    Processing payment...
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Check your phone for FastLipa prompt
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    (Attempt {paymentStatus.pollingCount} of {maxPollingAttempts})
                  </p>
                  <button
                    onClick={() => {
                      setPaymentStatus({ stage: 'input', pollingCount: 0 });
                      if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                      }
                    }}
                    className="px-4 py-2 border border-border text-foreground font-body text-sm mx-auto"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              {paymentStatus.stage === 'success' && (
                <div className="text-center space-y-3 py-4">
                  <div className="text-4xl">✓</div>
                  <p className="font-bold text-foreground text-sm">
                    Payment Successful!
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Premium access granted  Enjoy!
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full px-4 py-2 bg-foreground text-background font-body font-bold text-sm"
                  >
                    CLOSE
                  </button>
                </div>
              )}

              {paymentStatus.stage === 'failed' && (
                <div className="text-center space-y-3 py-4">
                  <div className="flex justify-center">
                    <div className="animate-spin">
                      <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full" />
                    </div>
                  </div>
                  <p className="font-body text-sm text-muted-foreground">
                    Suburi kidogo...
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Completing your payment
                  </p>
                  <p className="font-body text-xs text-yellow-600 px-3 py-2 bg-yellow-900/20 border border-yellow-600 rounded">
                    Please wait while we process your payment.
                  </p>
                  <button
                    onClick={() => {
                      setPaymentStatus({ stage: 'input', pollingCount: 0, error: undefined });
                      setPhoneNumber('');
                      if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                      }
                    }}
                    className="px-4 py-2 border border-border text-foreground font-body text-sm mx-auto"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-[70] bg-green-600 text-white px-4 py-3 text-sm font-bold border border-green-400 max-w-xs">
          {successMessage}
        </div>
      )}
    </>
  );
};

export default VideoPlayer;
