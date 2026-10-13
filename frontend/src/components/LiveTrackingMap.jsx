import React, { useState, useEffect, useRef } from 'react';
import { useOrder } from '../context/OrderContext';

const LiveTrackingMap = ({ orderId }) => {
  const { getOrderById, updateDeliveryLocation } = useOrder();
  const [order, setOrder] = useState(null);
  const [map, setMap] = useState(null);
  const [deliveryMarker, setDeliveryMarker] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [routeLine, setRouteLine] = useState(null);
  const mapRef = useRef(null);

  // Sample delivery route coordinates (in a real app, this would come from your backend)
  const deliveryRoute = [
    { lat: 6.9271, lng: 79.8612 }, // Starting point (restaurant)
    { lat: 6.9321, lng: 79.8662 },
    { lat: 6.9371, lng: 79.8712 },
    { lat: 6.9421, lng: 79.8762 },
    { lat: 6.9471, lng: 79.8812 }, // Customer location
  ];

  useEffect(() => {
    const orderData = getOrderById(orderId);
    setOrder(orderData);
  }, [orderId, getOrderById]);

  useEffect(() => {
    // Initialize map when component mounts
    if (!mapRef.current && window.google && window.google.maps) {
      try {
        const mapElement = document.getElementById('tracking-map');
        const mapInstance = new window.google.maps.Map(mapElement, {
          center: { lat: 6.9371, lng: 79.8712 }, // Center of Colombo
          zoom: 14,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f5f5f5" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#c9e8f7" }]
            }
          ]
        });
        
        setMap(mapInstance);
        mapRef.current = mapInstance;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (map && order) {
      // Clear existing markers and routes
      if (deliveryMarker) deliveryMarker.setMap(null);
      if (customerMarker) customerMarker.setMap(null);
      if (routeLine) routeLine.setMap(null);

      // Customer location marker
      const customerLoc = { lat: 6.9471, lng: 79.8812 };
      const newCustomerMarker = new window.google.maps.Marker({
        position: customerLoc,
        map: map,
        title: 'Delivery Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });
      setCustomerMarker(newCustomerMarker);

      // Delivery person marker (animated)
      const newDeliveryMarker = new window.google.maps.Marker({
        position: deliveryRoute[0],
        map: map,
        title: 'Delivery Person',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        animation: window.google.maps.Animation.DROP
      });
      setDeliveryMarker(newDeliveryMarker);

      // Draw route
      const routePath = new window.google.maps.Polyline({
        path: deliveryRoute,
        geodesic: true,
        strokeColor: '#F97316',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map
      });
      setRouteLine(routePath);

      // Fit map to show entire route
      const bounds = new window.google.maps.LatLngBounds();
      deliveryRoute.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

      // Simulate delivery person movement
      if (order.status === 'Out for Delivery') {
        simulateDeliveryMovement(newDeliveryMarker);
      }
    }
  }, [map, order]);

  const simulateDeliveryMovement = (marker) => {
    let currentIndex = 0;
    
    const moveMarker = () => {
      if (currentIndex < deliveryRoute.length - 1) {
        currentIndex++;
        const newPosition = deliveryRoute[currentIndex];
        
        // Animate marker movement
        marker.setPosition(newPosition);
        
        // Update order with new location
        updateDeliveryLocation(order.id, newPosition);
        
        // Continue movement
        setTimeout(moveMarker, 3000); // Move every 3 seconds
      }
    };

    setTimeout(moveMarker, 2000); // Start after 2 seconds
  };

  const loadGoogleMapsScript = () => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDummyKeyForDemo&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('Failed to load Google Maps');
      };
      
      script.onload = () => {
        console.log('Google Maps loaded successfully');
        // Re-initialize map when script loads
        setMap(null);
        mapRef.current = null;
      };
      
      document.head.appendChild(script);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Live Location Tracking</h2>
        {order.status === 'Out for Delivery' && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-green-600 font-medium">Live Tracking Active</span>
          </div>
        )}
      </div>
      
      {/* Map Container */}
      <div 
        id="tracking-map" 
        className="w-full h-96 rounded-lg border border-gray-200 mb-4"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        {(!window.google || !window.google.maps) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Loading</h3>
              <p className="text-gray-600 mb-2">Live tracking map is initializing...</p>
              <p className="text-sm text-gray-500">
                For production: Add your Google Maps API key
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Delivery Person</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Your Location</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-orange-500 mr-2"></div>
          <span className="text-sm text-gray-600">Delivery Route</span>
        </div>
      </div>

      {/* Delivery Info */}
      {order.status === 'Out for Delivery' && (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2">Delivery Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estimated Arrival:</span>
              <span className="ml-2 font-medium">15-20 minutes</span>
            </div>
            <div>
              <span className="text-gray-600">Distance:</span>
              <span className="ml-2 font-medium">2.5 km</span>
            </div>
            <div>
              <span className="text-gray-600">Delivery Person:</span>
              <span className="ml-2 font-medium">R. Kumar</span>
            </div>
            <div>
              <span className="text-gray-600">Contact:</span>
              <span className="ml-2 font-medium">+94 71 234 5678</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Tracking Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• The green dot shows the delivery person's current location</li>
          <li>• The blue dot shows your delivery address</li>
          <li>• The orange line shows the delivery route</li>
          <li>• Location updates every 30 seconds</li>
          <li>• Keep your phone nearby for delivery updates</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
