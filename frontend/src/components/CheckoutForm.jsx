import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CheckoutForm = ({ onClose }) => {
  const { createOrder } = useOrder();
  const { items = [], clearCart = () => {}, total = 0 } = useCart();
  const { user } = useAuth();
  
  const [customerData, setCustomerData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    email: user?.email || '',
    paymentMethod: 'Cash'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    console.log('Validating form with data:', customerData);
    
    // Name validation
    if (!customerData.name || customerData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
    }
    if (customerData.name && customerData.name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(customerData.name)) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Phone validation (temporarily less strict for testing)
    if (!customerData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!customerData.phone.startsWith('+94')) {
      newErrors.phone = 'Phone number must start with +94';
    } else if (customerData.phone.length < 12) {
      newErrors.phone = 'Phone number must be at least 12 characters';
    }

    // Address validation
    if (!customerData.address || customerData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }
    if (customerData.address && customerData.address.length > 200) {
      newErrors.address = 'Address cannot exceed 200 characters';
    }

    // Email validation (optional but if provided, must be valid)
    if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      // Only allow +94 followed by digits
      const phoneRegex = /^(\+94)?[0-9]*$/;
      if (value === '' || phoneRegex.test(value)) {
        setCustomerData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'name') {
      // Only allow letters and spaces for name
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (value === '' || nameRegex.test(value)) {
        setCustomerData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setCustomerData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    console.log('Validation passed, creating order...');
    setIsSubmitting(true);

    try {
      console.log('Creating order with:', { items, customerData });
      const result = createOrder(items, customerData, customerData.paymentMethod);
      console.log('Order result:', result);
      
      if (result.success) {
        clearCart();
        toast.success('Order placed successfully!');
        
        // Redirect to order tracking page
        setTimeout(() => {
          window.location.href = `/track-order/${result.order.id}`;
        }, 2000);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Auto-format phone number
    if (!value) return value;
    
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +94
    if (!cleaned.startsWith('+94') && cleaned.length > 0) {
      cleaned = '+94' + cleaned.replace(/^94/, '');
    }
    
    // Limit to +94 followed by 9 digits
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }
    
    return cleaned;
  };

  // Safety check - if cartItems is not available, show error
  if (!items || !Array.isArray(items)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">Unable to load cart information. Please try again.</p>
          <button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              {items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.menuItem.name} x{item.quantity}</span>
                  <span>Rs. {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-gray-500">+{items.length - 3} more items</div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-orange-500">Rs. {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                maxLength={50}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={customerData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setCustomerData(prev => ({ ...prev, phone: formatted }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+94XXXXXXXXX"
                maxLength={12}
                required
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Format: +94 followed by 9 digits (e.g., +94771234567)
              </p>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                name="address"
                value={customerData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your complete delivery address"
                rows={3}
                maxLength={200}
                required
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {customerData.address.length}/200 characters
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  customerData.paymentMethod === 'Cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                }">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={customerData.paymentMethod === 'Cash'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-2 flex items-center justify-center">
                      {customerData.paymentMethod === 'Cash' && (
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      )}
                    </div>
                    <span className="font-medium">Cash on Delivery</span>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  customerData.paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                }">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Online"
                    checked={customerData.paymentMethod === 'Online'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-2 flex items-center justify-center">
                      {customerData.paymentMethod === 'Online' && (
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      )}
                    </div>
                    <span className="font-medium">Online Payment</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Security & Privacy</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your information is encrypted and secure</li>
              <li>• We only use your details for delivery purposes</li>
              <li>• Payment is processed securely</li>
              <li>• Your data is never shared with third parties</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
