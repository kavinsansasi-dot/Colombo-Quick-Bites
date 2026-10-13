import React, { createContext, useContext, useReducer } from 'react';
import toast from 'react-hot-toast';

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { menuItem, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.menuItem._id === menuItem._id);

      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.menuItem._id === menuItem._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, { menuItem, quantity }];
      }

      const total = newItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter((item) => item.menuItem._id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload;

      if (quantity <= 0) {
        const newItems = state.items.filter((item) => item.menuItem._id !== menuItemId);
        const total = newItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          items: newItems,
          total,
          itemCount,
        };
      }

      const newItems = state.items.map((item) =>
        item.menuItem._id === menuItemId
          ? { ...item, quantity }
          : item
      );

      const total = newItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
};

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (menuItem, quantity = 1) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { menuItem, quantity },
    });
    toast.success(`${menuItem.name} added to cart!`);
  };

  const removeFromCart = (menuItemId) => {
    const item = state.items.find((cartItem) => cartItem.menuItem._id === menuItemId);
    if (item) {
      dispatch({
        type: 'REMOVE_FROM_CART',
        payload: menuItemId,
      });
      toast.success(`${item.menuItem.name} removed from cart`);
    }
  };

  const updateQuantity = (menuItemId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { menuItemId, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
