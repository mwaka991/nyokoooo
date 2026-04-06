import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '@/components/PaymentModal';
import type { PaymentVerificationResult } from '@/lib/payment-polling-client';

interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
}

interface PaidProduct {
  productId: string;
  paidAt: number;
  accessLink?: string;
}

const products: Product[] = [
  {
    id: 'vibao-kata',
    title: 'VIBAO KATA ZAIDI',
    price: 2000,
    description: 'Kupata drive ya vibao kata zaidi za video 300+',
    image: '/bataazar.jpg',
  },
  {
    id: 'movies-wakubwa',
    title: 'MOVIES ZA WAKUBWA',
    price: 3000,
    description: 'Kupata drive ya movies za wakubwa zaidi ya movie 200+',
    image: '/hero-bg.jpg',
  },
];

const MoviesZaWakubwa = () => {
  const navigate = useNavigate();
  const [paidProducts, setPaidProducts] = useState<Record<string, PaidProduct>>({});
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; productId?: string }>({
    isOpen: false,
  });
  const [accessLinks, setAccessLinks] = useState<Record<string, string>>({});

  // Load paid products from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('paid_products_movies');
    if (saved) {
      setPaidProducts(JSON.parse(saved));
    }
    const savedLinks = localStorage.getItem('access_links_movies');
    if (savedLinks) {
      setAccessLinks(JSON.parse(savedLinks));
    }
  }, []);

  const handlePayClick = (productId: string) => {
    setPaymentModal({ isOpen: true, productId });
  };

  const handlePaymentSuccess = (result: PaymentVerificationResult) => {
    const productId = paymentModal.productId;
    if (!productId) return;

    // Mark product as paid
    const paid: PaidProduct = {
      productId,
      paidAt: Date.now(),
    };
    const updated = { ...paidProducts, [productId]: paid };
    setPaidProducts(updated);
    localStorage.setItem('paid_products_movies', JSON.stringify(updated));

    setPaymentModal({ isOpen: false });
  };

  const handleAccessLinkSubmit = (productId: string, link: string) => {
    if (link.trim()) {
      const updated = { ...accessLinks, [productId]: link };
      setAccessLinks(updated);
      localStorage.setItem('access_links_movies', JSON.stringify(updated));
    }
  };

  const isProductPaid = (productId: string) => {
    return productId in paidProducts;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            ← Rudi Nyuma
          </button>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            MOVIES ZA WAKUBWA
          </h1>
          <p className="text-lg text-muted-foreground">
            Kula kwa kuorodha kwa movies za 4K na stories nzuri
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition border border-border"
            >
              {/* Product Image */}
              <div className="relative h-64 bg-muted overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-2">📁</div>
                    <p className="text-white font-bold text-xl">{product.price} TSH</p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {product.title}
                  </h2>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>

                {/* Payment/Button Section */}
                {!isProductPaid(product.id) ? (
                  <button
                    onClick={() => handlePayClick(product.id)}
                    className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                  >
                    PAY
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Show success badge */}
                    <div className="bg-green-100 border border-green-600 rounded-lg p-3 text-center">
                      <p className="text-green-800 font-semibold">✓ UMEFANIKIWA</p>
                    </div>

                    {/* Access Link Input/Display */}
                    {accessLinks[product.id] ? (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-2">Access Link:</p>
                        <a
                          href={accessLinks[product.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold break-all"
                        >
                          TIZAMA VIDEOS
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Tapa link ya access:</p>
                        <input
                          type="text"
                          placeholder="Paste your drive link here..."
                          defaultValue=""
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget as HTMLInputElement;
                              handleAccessLinkSubmit(product.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            handleAccessLinkSubmit(product.id, input.value);
                            input.value = '';
                          }}
                          className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          SET TIZAMA
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false })}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default MoviesZaWakubwa;
