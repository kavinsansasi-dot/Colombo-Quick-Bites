import React from 'react';
import { useParams } from 'react-router-dom';
import OrderTracker from '../components/OrderTracker';

const TrackOrderPage = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <OrderTracker orderId={orderId} />
      </div>
    </div>
  );
};

export default TrackOrderPage;
