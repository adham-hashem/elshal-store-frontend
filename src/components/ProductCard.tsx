import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';

// Define a placeholder type for Product to ensure the file is self-contained and runnable
// In a real application, this would be imported from '../types'
type Product = {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  isOffer: boolean;
  images: { imagePath: string }[];
  colors: string[];
  sizes: string[];
};

// Assuming apiUrl is globally defined or available via context/import
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// --- Interface Definitions ---

interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

// --- Utility Function to Map Color Names to Hex Codes (English Keys) ---

const getColorCode = (colorName: string): string => {
  // Trim whitespace to handle potential API data inconsistencies
  const trimmedColorName = colorName.trim();

  // Mapping English color names to their respective hex codes
  const colorMap: { [key: string]: string } = {
    'Black': '#000000',
    'White': '#ffffff',
    'Red': '#dc2626',
    'Blue': '#2563eb',
    'Dark Blue': '#1e3a8a',
    'Light Blue': '#60a5fa',
    'Green': '#16a34a',
    'Yellow': '#eab308',
    'Pink': '#ec4899',
    'Rose': '#f472b6',
    'Purple': '#8b5cf6',
    'Burgundy': '#7c2d12',
    'Brown': '#a3a3a3',
    'Gray': '#6b7280',
    // Including common mixed Arabic/English if necessary for compatibility
    'أسود': '#000000',
    'أبيض': '#ffffff',
    'أحمر': '#dc2626',
    'أزرق': '#2563eb',
    'وردي': '#ec4899',
  };

  // Default to gray if the color name is not found in the map
  return colorMap[trimmedColorName] || '#6b7280';
};

// --- ProductCard Component ---

const ProductCard: React.FC<ProductCardProps> = ({ product, onViewProduct, onAddToCart }) => {
  
  /**
   * Handles click events on the main card container.
   * This function ensures that clicking anywhere on the card (especially on mobile)
   * opens the product view page.
   * On larger screens, it allows the separate 'Add to Cart' button to function.
   * @param e - The mouse event
   */
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // IMPORTANT: Prevent opening the product view if the 'Add to Cart' button (or any specific
    // interactive element we define) was clicked, which is crucial for larger screens.
    if (target.closest('button[data-action="add-to-cart"]')) {
      return; 
    }
    
    // Trigger the view function for the product page
    onViewProduct(product);
  };

  return (
    // The entire card container is now clickable
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 group hover:shadow-2xl cursor-pointer transform hover:scale-[1.02] active:scale-[0.99]"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        {/* Product Image */}
        <img
          src={`${apiUrl}${product.images[0]?.imagePath || 'https://placehold.co/600x400/F0F0F0/6B7280?text=Product+Image'}`}
          alt={product.name}
          onError={(e) => {
            // Fallback image in case the main image fails to load
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevents infinite loop
            target.src = 'https://placehold.co/600x400/F0F0F0/6B7280?text=Image+Not+Found';
          }}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Special Offer Tag */}
        {product.isOffer && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            Special Offer
          </div>
        )}

        {/* Action Buttons Overlay (Hidden on small screens, shown on md and above hover) */}
        {/* The 'hidden' class ensures these buttons do not interfere with mobile taps */}
        <div className="hidden md:absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 md:flex items-center justify-center opacity-0 group-hover:opacity-100">
          
          {/* View Button (Redundant on click, but kept for desktop UX/consistency) */}
          <button
            onClick={(e) => { e.stopPropagation(); onViewProduct(product); }} // Prevents card click propagation
            className="bg-white text-gray-800 px-5 py-2 rounded-full mx-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Eye size={18} />
            <span>View</span>
          </button>
          
          {/* Add to Cart Button (Must stop propagation) */}
          <button
            data-action="add-to-cart" // Identifier for handleCardClick
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} // Prevents card click propagation
            className={`bg-pink-600 text-white px-5 py-2 rounded-full mx-2 hover:bg-pink-700 transition-colors flex items-center space-x-2 shadow-lg ${
              !product.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:ring-4 ring-pink-300'
            }`}
            disabled={!product.inStock}
          >
            <ShoppingCart size={18} />
            <span>{product.inStock ? 'Add' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col space-y-3">
        
        {/* Name and Code */}
        <div className="flex justify-between items-start">
          <h3 className="font-extrabold text-xl text-gray-900 flex-1 text-right">{product.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full shadow-inner">
            SKU: {product.code}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 text-right">{product.description}</p>

        {/* Price and Colors */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          
          {/* Price */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl font-bold text-pink-600">{product.price} EGP</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">{product.originalPrice} EGP</span>
            )}
          </div>
          
          {/* Available Colors Indicators */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {product.colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: getColorCode(color) }}
                title={color} // Shows color name on hover
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded-full">+{product.colors.length - 3}</span>
            )}
          </div>
        </div>

        {/* Available Sizes */}
        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          {product.sizes.slice(0, 4).map((size, index) => (
            <span key={index} className="text-xs font-medium bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
              {size}
            </span>
          ))}
          {product.sizes.length > 4 && (
            <span className="text-xs text-gray-500 py-1">+{product.sizes.length - 4} sizes</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the component as the default export
export default ProductCard;