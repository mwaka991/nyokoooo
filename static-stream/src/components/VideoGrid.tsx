import { useState } from "react";
import type { Video } from "@/lib/videoData";
import VideoCard from "./VideoCard";
import { PaymentModal } from "./PaymentModal";
import type { PaymentVerificationResult } from "@/lib/payment-polling-client";

interface Category {
  is_premium?: boolean;
  name?: string;
}

interface VideoGridProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
  category?: Category;
}

interface PaidProduct {
  productId: string;
  paidAt: number;
}

interface ProductCard {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
}

const PREMIUM_PRODUCTS: ProductCard[] = [
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

const VideoGrid = ({ videos, onVideoClick, category }: VideoGridProps) => {
  const [paidProducts, setPaidProducts] = useState<Record<string, PaidProduct>>(() => {
    const saved = localStorage.getItem('paid_products_premium');
    return saved ? JSON.parse(saved) : {};
  });
  const [accessLinks, setAccessLinks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('access_links_premium');
    return saved ? JSON.parse(saved) : {};
  });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; productId?: string }>({
    isOpen: false,
  });

  const isMoviesZaWakubwa = category?.name === 'Muvi za kikubwa';

  const handlePayClick = (productId: string) => {
    setPaymentModal({ isOpen: true, productId });
  };

  const handlePaymentSuccess = (result: PaymentVerificationResult) => {
    const productId = paymentModal.productId;
    if (!productId) return;

    const paid: PaidProduct = {
      productId,
      paidAt: Date.now(),
    };
    const updated = { ...paidProducts, [productId]: paid };
    setPaidProducts(updated);
    localStorage.setItem('paid_products_premium', JSON.stringify(updated));

    setPaymentModal({ isOpen: false });
  };

  const handleAccessLinkSubmit = (productId: string, link: string) => {
    if (link.trim()) {
      const updated = { ...accessLinks, [productId]: link };
      setAccessLinks(updated);
      localStorage.setItem('access_links_premium', JSON.stringify(updated));
    }
  };

  const isProductPaid = (productId: string) => {
    return productId in paidProducts;
  };

  if (videos.length === 0 && !isMoviesZaWakubwa) {
    return (
      <div className="p-8 text-center text-muted-foreground font-body">
        No videos in this category.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Show premium products first if this is Muvi za kikubwa */}
        {isMoviesZaWakubwa && PREMIUM_PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition border border-border"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-muted overflow-hidden">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-white font-bold">{product.price} TSH</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-foreground mb-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>

              {/* Payment/Button Section */}
              {!isProductPaid(product.id) ? (
                <button
                  onClick={() => handlePayClick(product.id)}
                  className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition text-sm"
                >
                  PAY
                </button>
              ) : (
                <div className="space-y-2">
                  {/* Show success badge */}
                  <div className="bg-green-100 border border-green-600 rounded-lg p-2 text-center">
                    <p className="text-green-800 font-semibold text-sm">✓ UMEFANIKIWA</p>
                  </div>

                  {/* Access Link Input/Display */}
                  {accessLinks[product.id] ? (
                    <a
                      href={accessLinks[product.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center text-sm"
                    >
                      TIZAMA VIDEOS
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Paste link..."
                        defaultValue=""
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget as HTMLInputElement;
                            handleAccessLinkSubmit(product.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          handleAccessLinkSubmit(product.id, input.value);
                          input.value = '';
                        }}
                        className="w-full py-1 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
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

        {/* Show regular videos */}
        {videos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onClick={onVideoClick} 
            isPremium={category?.is_premium}
          />
        ))}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false })}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default VideoGrid;
