import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Heart, Share2, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// --- INLINE INTERFACE ---
interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: { imagePath: string }[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  isOffer?: boolean;
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
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${apiUrl}/api/products/${id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Product not found.');
          }
          const data: Product = await response.json();
          setProduct(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load product.');
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
    if (!product || addingToCart) return;

    setAddingToCart(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Debug: Log token details for troubleshooting
      console.log('Token from localStorage:', token);
      console.log('Token length:', token?.length);
      console.log('Token type:', typeof token);
      console.log('All localStorage keys:', Object.keys(localStorage));

      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        console.log('Token validation failed:', {
          exists: !!token,
          isEmpty: token?.trim() === '',
          isNull: token === 'null',
          isUndefined: token === 'undefined',
        });
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
        payload: { product, quantity, selectedSize, selectedColor },
      });

      // alert('تم إضافة المنتج إلى السلة بنجاح!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المنتج إلى السلة');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" size={48} />
        <span className="mr-3 text-gray-600">جاري تحميل المنتج...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {error ? 'حدث خطأ' : 'المنتج غير موجود'}
            </h2>
            <p className="text-gray-600 mb-6">{error || 'عذراً، المنتج المطلوب غير متوفر'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
                {product.isOffer && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    عرض خاص
                  </div>
                )}
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
                        disabled={addingToCart}
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
                        disabled={addingToCart}
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
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50"
                      disabled={addingToCart}
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50"
                      disabled={addingToCart}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!product.inStock || addingToCart}
                  >
                    {addingToCart ? (
                      <Loader2 className="animate-spin ml-2" size={20} />
                    ) : (
                      <ShoppingCart size={20} className="ml-2" />
                    )}
                    <span>{addingToCart ? 'جاري الإضافة...' : 'أضف إلى السلة'}</span>
                  </button>
                  {/* <button className="p-3 border rounded-lg hover:bg-gray-50" disabled={addingToCart}>
                    <Heart size={20} />
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-gray-50" disabled={addingToCart}>
                    <Share2 size={20} />
                  </button> */}
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-lg text-green-700 font-medium">
                  {product.inStock ? '✓ متوفر في المخزن' : '✗ غير متوفر حالياً'}
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