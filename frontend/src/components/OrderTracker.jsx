import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import BillGenerator from './BillGenerator';

const OrderTracker = ({ orderId }) => {
  const { getOrderById, orderStatuses } = useOrder();
  const [order, setOrder] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Initial order fetch
    const orderData = getOrderById(orderId);
    setOrder(orderData);

    // Set up polling for status updates (every 5 seconds)
    const pollInterval = setInterval(() => {
      const updatedOrder = getOrderById(orderId);
      setOrder(updatedOrder);
      setLastUpdated(new Date());
      setCurrentTime(new Date());
    }, 5000);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [orderId, getOrderById]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Order Received': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Preparing': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Out for Delivery': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Delivered': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    };
    return icons[status] || icons['Order Received'];
  };

  const isStatusCompleted = (status) => {
    const statusIndex = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'].indexOf(status);
    const currentStatusIndex = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'].indexOf(order.status);
    return statusIndex <= currentStatusIndex;
  };

  const isCurrentStatus = (status) => {
    return status === order.status;
  };

  const getEstimatedTimeRemaining = () => {
    const now = currentTime.getTime();
    const estimated = new Date(order.estimatedDeliveryTime).getTime();
    const remaining = estimated - now;
    
    if (remaining <= 0) return 'Delivered';
    
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Tracking</h1>
              <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{order.id}</span></p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Estimated Delivery</div>
              <div className="text-lg font-semibold text-orange-500">
                {getEstimatedTimeRemaining()}
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Order Status</h2>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live updates • Last checked: {formatTime(lastUpdated)}
            </div>
          </div>
          <div className="space-y-4">
            {['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'].map((status, index) => (
              <div key={status} className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isStatusCompleted(status) 
                      ? isCurrentStatus(status)
                        ? 'bg-orange-500 text-white animate-pulse'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      isStatusCompleted(status) ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {status}
                    </h3>
                    {isStatusCompleted(status) && (
                      <span className="text-sm text-gray-500">
                        {formatTime(order.statusHistory.find(h => h.status === status)?.timestamp || order.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {status === 'Order Received' && 'Your order has been received and is being processed.'}
                    {status === 'Preparing' && 'The restaurant is preparing your delicious food.'}
                    {status === 'Out for Delivery' && 'Your order is on the way to your location.'}
                    {status === 'Delivered' && 'Your order has been delivered successfully!'}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`flex-shrink-0 w-8 h-8 ml-4 ${
                    isStatusCompleted(status) ? 'border-green-500' : 'border-gray-300'
                  } border-l-2 border-t-2 transform rotate-90 origin-left`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <h3 className="font-medium mb-3">Delivery Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {order.customerInfo.name}</p>
                <p><span className="font-medium">Phone:</span> {order.customerInfo.phone}</p>
                <p><span className="font-medium">Address:</span> {order.customerInfo.address}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Order Date:</span> {formatDate(order.createdAt)}</p>
                <p><span className="font-medium">Order Time:</span> {formatTime(order.createdAt)}</p>
                <p><span className="font-medium">Total Items:</span> {order.items.length}</p>
                <p><span className="font-medium">Total Amount:</span> <span className="text-orange-500 font-semibold">Rs. {order.totalAmount.toFixed(2)}</span></p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Items Ordered</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">Rs. {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowBill(true)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Bill
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>

      {/* Bill Modal */}
      {showBill && (
        <BillGenerator 
          order={order} 
          onClose={() => setShowBill(false)} 
        />
      )}
    </div>
  );
};

export default OrderTracker;
