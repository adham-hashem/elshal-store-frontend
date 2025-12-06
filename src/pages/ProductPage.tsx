import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// تم إضافة EyeOff للاستخدام المحتمل في رسائل الحالة
import { ArrowRight, ShoppingCart, Heart, Share2, Loader2, AlertTriangle, ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// --- UPDATED INTERFACE: KEPT ONLY PROPERTIES FROM THE RESPONSE ---
interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  createdAt: string;
  category: number;
  isHidden: boolean;
  isAvailable: boolean;
  season: number;
  sizes: string[];
  colors: string[];
  images: { imagePath: string; id: string; isMain: boolean }[]; // UPDATED TO MATCH RESPONSE STRUCTURE
  rowVersion: string;
}
// -------------------------

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const ProductPage: React.FC = () => {
  const { dispatch } = useApp();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  // --- NEW STATE for restricted products ---
  const [productRestricted, setProductRestricted] = useState<string | null>(null);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Effect to fetch product data if it wasn't passed via location state
  useEffect(() => {
    if (!product && id) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        setProductRestricted(null); // Reset restriction flag

        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${apiUrl}/api/products/${id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Product not found or access denied.');
          }
          const data: Product = await response.json();
          
          // --- NEW LOGIC: Check for restrictions ---
          if (data.isHidden) {
            setProductRestricted('هذا المنتج غير مرئي للجمهور حالياً.');
            // Do not set the product state if it's restricted, or set it but keep the restricted flag
          }
          if (!data.isAvailable) {
            setProductRestricted('المنتج غير متاح حالياً.');
          }
          
          setProduct(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'فشل في تحميل المنتج.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, product]);

  // Effect to set default options once the product is loaded
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || '');
    }
  }, [product]);

  // Handle touch start for swipe
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(null);
  };

  // Handle touch move for swipe
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.touches[0].clientX);
  };

  // Handle touch end for swipe
  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null && product) {
      const diff = touchStartX - touchEndX;
      const threshold = 30; // Reduced threshold for better mobile responsiveness

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swipe left: show next image
          setCurrentImageIndex((prev) => 
            prev < product.images.length - 1 ? prev + 1 : 0
          );
        } else {
          // Swipe right: show previous image
          setCurrentImageIndex((prev) => 
            prev > 0 ? prev - 1 : product.images.length - 1
          );
        }
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Handle next image
  const handleNextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev < product.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  // Handle previous image
  const handlePrevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : product.images.length - 1
      );
    }
  };

  const handleAddToCart = async () => {
    // Check against new restrictions before proceeding
    if (!product || addingToCart || productRestricted || product.isHidden || !product.isAvailable) return;

    setAddingToCart(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Debug: Log token details for troubleshooting
//       console.log('Token from localStorage:', token);
//       console.log('Token length:', token?.length);
//       console.log('Token type:', typeof token);
//       console.log('All localStorage keys:', Object.keys(localStorage));

      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
//         console.log('Token validation failed:', {
//           exists: !!token,
//           isEmpty: token?.trim() === '',
//           isNull: token === 'null',
//           isUndefined: token === 'undefined',
//         });
        alert('يرجى تسجيل الدخول أولاً');
        navigate('/login');
        return;
      }

      const response = await fetch(`${apiUrl}/api/cart/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في إضافة المنتج إلى السلة');
      }

      // Update local cart state for immediate UI feedback
      dispatch({
        type: 'ADD_TO_CART',
        payload: { 
            product: product, 
            quantity, 
            selectedSize, 
            selectedColor 
        },
      });

      // alert('تم إضافة المنتج إلى السلة بنجاح!');
    } catch (error) {
//       console.error('Error adding to cart:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المنتج إلى السلة');
    } finally {
      setAddingToCart(false);
    }
  };
  
  // Determine final status for disabling the purchase button
  const isPurchaseDisabled = addingToCart || !product || product.isHidden || !product.isAvailable;
  
  // Determine final status message (simplified based on new fields)
  let statusMessage = productRestricted; // Start with specific restriction message
  if (!statusMessage && product) {
      if (product.isHidden) {
          statusMessage = 'هذا المنتج غير مرئي للجمهور حالياً.';
      } else if (!product.isAvailable) {
          statusMessage = 'المنتج غير متاح حالياً.';
      } else {
          statusMessage = 'متوفر في المخزن وجاهز للشراء.';
      }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="animate-spin text-pink-600" size={48} />
        <span className="mr-3 text-gray-600">جاري تحميل المنتج...</span>
      </div>
    );
  }
  
  // Use productRestricted for the primary block screen
  if (error || !product || productRestricted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {error ? 'حدث خطأ' : productRestricted ? 'وصول مقيد' : 'المنتج غير موجود'}
            </h2>
            <p className="text-gray-600 mb-6">
                {error || productRestricted || 'عذراً، المنتج المطلوب غير متوفر.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
        {/* Footer or other sections if needed */}
      </div>
    );
  }
  
  // Product is loaded and visible
  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <AlertTriangle className="inline-block ml-2" size={20} />
            {error}
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="p-6">
              <div 
                className="relative mb-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={`${apiUrl}${product.images[currentImageIndex]?.imagePath || '/images/fallback.jpg'}`}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg select-none"
                />
                {/* Removed isOffer check since it wasn't in the provided JSON, 
                    but you can add a similar check for a derived 'isOffer' logic if needed */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="hidden md:block absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {product.images.map((_, index) => (
                        <span
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            currentImageIndex === index ? 'bg-pink-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                  </div>
                  </>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex space-x-reverse space-x-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-pink-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={`${apiUrl}${image.imagePath || '/images/fallback.jpg'}`}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-6 flex flex-col">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-mono">{product.code}</span>
                </div>
                <p className="text-gray-600 mb-4">{product.description}</p>
              </div>

              <div className="flex items-center space-x-reverse space-x-4 mb-6">
                <span className="text-3xl font-bold text-pink-600">{product.price.toFixed(2)} جنيه</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">{product.originalPrice.toFixed(2)} جنيه</span>
                )}
              </div>

              {/* Options */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">الألوان</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border ${
                          selectedColor === color ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        } transition-colors`}
                        disabled={isPurchaseDisabled} 
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">المقاسات</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border ${
                          selectedSize === size ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        } transition-colors`}
                        disabled={isPurchaseDisabled} 
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">الكمية</h3>
                  <div className="flex items-center space-x-reverse space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isPurchaseDisabled} 
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isPurchaseDisabled} 
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPurchaseDisabled} 
                  >
                    {addingToCart ? (
                      <Loader2 className="animate-spin ml-2" size={20} />
                    ) : (
                      <ShoppingCart size={20} className="ml-2" />
                    )}
                    <span>{addingToCart ? 'جاري الإضافة...' : 'أضف إلى السلة'}</span>
                  </button>
                </div>
                {/* UPDATED: Display status based on isHidden/isAvailable */}
                <div className={`mt-6 p-4 rounded-lg font-medium flex items-center ${
                    isPurchaseDisabled
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                }`}>
                    {isPurchaseDisabled ? (
                        <>
                            <AlertTriangle size={20} className="ml-2 flex-shrink-0" />
                            <span>
                                {/* Use the refined status message based on new fields */}
                                {product.isHidden ? '✗ هذا المنتج غير مرئي للجمهور حالياً.' : '✗ المنتج غير متاح حالياً.'}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-xl ml-2 flex-shrink-0">✓</span>
                            <span>{statusMessage}</span>
                        </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;