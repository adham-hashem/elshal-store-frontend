import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onViewProduct, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={`${apiUrl}${product.images[0]?.imagePath || '/images/fallback.jpg'}`}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isOffer && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            عرض خاص
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onViewProduct(product)}
            className="bg-white text-gray-800 px-4 py-2 rounded-lg mx-2 hover:bg-gray-100 transition-colors flex items-center space-x-reverse space-x-2"
          >
            <Eye size={18} />
            <span>عرض</span>
          </button>
          <button
            onClick={() => onAddToCart(product)}
            className={`bg-pink-600 text-white px-4 py-2 rounded-lg mx-2 hover:bg-pink-700 transition-colors flex items-center space-x-reverse space-x-2 ${
              !product.inStock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!product.inStock}
          >
            <ShoppingCart size={18} />
            <span>أضف</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-right flex-1">{product.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.code}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 text-right">{product.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-2">
            <span className="text-lg font-bold text-pink-600">{product.price} جنيه</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">{product.originalPrice} جنيه</span>
            )}
          </div>

          <div className="flex items-center space-x-reverse space-x-1">
            {product.colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: getColorCode(color) }}
                title={color} // Shows color name on hover
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {product.sizes.slice(0, 4).map((size, index) => (
            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {size}
            </span>
          ))}
          {product.sizes.length > 4 && (
            <span className="text-xs text-gray-500">+{product.sizes.length - 4}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const getColorCode = (colorName: string): string => {
  // Trim whitespace to handle API data with trailing spaces
  const trimmedColorName = colorName.trim();

  const colorMap: { [key: string]: string } = {
    أسود: '#000000',
    أبيض: '#ffffff',
    أحمر: '#dc2626',
    أزرق: '#2563eb',
    'أزرق داكن': '#1e3a8a',
    'أزرق فاتح': '#60a5fa',
    أخضر: '#16a34a',
    أصفر: '#eab308',
    وردي: '#ec4899',
    زهري: '#f472b6',
    بنفسجي: '#8b5cf6',
    بورجوندي: '#7c2d12',
    بني: '#a3a3a3',
    رمادي: '#6b7280',
    Green: '#16a34a',
    Red: '#dc2626',
    Blue: '#2563eb',
  };

  return colorMap[trimmedColorName] || '#6b7280'; // Default to gray if color not found
};

export default ProductCard;