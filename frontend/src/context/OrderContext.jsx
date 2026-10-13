import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderStatuses, setOrderStatuses] = useState({
    'Order Received': { color: 'blue', timestamp: null },
    'Preparing': { color: 'yellow', timestamp: null },
    'Out for Delivery': { color: 'orange', timestamp: null },
    'Delivered': { color: 'green', timestamp: null }
  });

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const validateOrderData = (customerData) => {
    const errors = {};
    
    // Name validation
    if (!customerData.name || customerData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
    }
    if (customerData.name && customerData.name.length > 50) {
      errors.name = 'Name cannot exceed 50 characters';
    }

    // Phone validation
    if (!customerData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!customerData.phone.startsWith('+94')) {
      errors.phone = 'Phone number must start with +94';
    } else if (customerData.phone.length < 12) {
      errors.phone = 'Phone number must be at least 12 characters (including +94)';
    }

    // Address validation
    if (!customerData.address || customerData.address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters long';
    }

    return errors;
  };

  const createOrder = (cartItems, customerData, paymentMethod = 'Cash') => {
    const validationErrors = validateOrderData(customerData);
    
    if (Object.keys(validationErrors).length > 0) {
      Object.values(validationErrors).forEach(error => {
        toast.error(error);
      });
      return { success: false, errors: validationErrors };
    }

    const orderId = generateOrderId();
    const totalAmount = cartItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
    const deliveryFee = 50; // Fixed delivery fee
    
    const newOrder = {
      id: orderId,
      customerInfo: {
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        email: customerData.email || ''
      },
      items: cartItems.map(item => ({
        id: item.menuItem._id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        subtotal: item.menuItem.price * item.quantity
      })),
      subtotal: totalAmount,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount + deliveryFee,
      status: 'Order Received',
      paymentMethod: paymentMethod,
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: new Date().toISOString(),
          note: 'Order placed successfully'
        }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    
    toast.success('Order placed successfully!');
    return { success: true, order: newOrder };
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          status: newStatus,
          statusHistory: [
            ...order.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString()
            }
          ]
        };
        
        if (currentOrder && currentOrder.id === orderId) {
          setCurrentOrder(updatedOrder);
        }
        
        return updatedOrder;
      }
      return order;
    }));
  };

  const updateDeliveryLocation = (orderId, location) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          deliveryLocation: location
        };
        
        if (currentOrder && currentOrder.id === orderId) {
          setCurrentOrder(updatedOrder);
        }
        
        return updatedOrder;
      }
      return order;
    }));
  };

  const getCustomerOrders = (customerPhone) => {
    return orders.filter(order => order.customerInfo.phone === customerPhone);
  };

  const getOrderById = (orderId) => {
    return orders.find(order => order.id === orderId);
  };

  const deleteOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    if (currentOrder && currentOrder.id === orderId) {
      setCurrentOrder(null);
    }
  };

  const simulateOrderProgress = (orderId) => {
    const statusSequence = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < statusSequence.length) {
        updateOrderStatus(orderId, statusSequence[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30000); // Update every 30 seconds for demo
  };

  return (
    <OrderContext.Provider value={{
      orders,
      currentOrder,
      orderStatuses,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      getCustomerOrders,
      getOrderById,
      setCurrentOrder,
      simulateOrderProgress,
      validateOrderData
    }}>
      {children}
    </OrderContext.Provider>
  );
};
