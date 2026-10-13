import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CheckoutForm from '../components/CheckoutForm';
import {
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const cleanBaseUrl = baseUrl.replace('/api', '');
      return `${cleanBaseUrl}${imagePath}`;
    }
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}/uploads/${imagePath}`;
  };

  const handleQuantityChange = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      updateQuantity(menuItemId, quantity);
    }
  };

  const handleBackToMenu = () => {
    navigate('/menu');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Menu
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
        </div>
        <div className="text-sm text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Cart Items</h2>
            
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.menuItem._id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.menuItem.image ? (
                        <img
                          src={getImageUrl(item.menuItem.image)}
                          alt={item.menuItem.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: item.menuItem.image ? 'none' : 'flex' }}
                      >
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{item.menuItem.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.menuItem._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">{item.menuItem.category}</div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.menuItem._id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Price: {formatCurrency(item.menuItem.price)}</div>
                          <div className="font-semibold text-gray-900">
                            Total: {formatCurrency(item.menuItem.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <TrashIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-sm">Add some delicious items to get started!</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-8">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
            
            {/* Cart Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Cart Total</span>
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setShowCheckout(true)}
                disabled={items.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                Proceed to Checkout
              </button>

              {/* Clear Cart Button */}
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="btn-ghost w-full"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Form Modal */}
      {showCheckout && (
        <CheckoutForm onClose={() => setShowCheckout(false)} />
      )}
    </>
  );
};

export default CartPage;
