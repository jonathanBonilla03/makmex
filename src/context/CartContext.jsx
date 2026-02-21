import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { item } = action.payload;
      const existingItem = state.items.find(cartItem => 
        cartItem.id === item.id && cartItem.type === item.type
      );

      const availableQuantity = item.quantity || item.available_quantity || 1;

      if (existingItem) {
        // Check if we can add one more without exceeding availability
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity <= availableQuantity) {
          return {
            ...state,
            items: state.items.map(cartItem =>
              cartItem.id === item.id && cartItem.type === item.type
                ? { ...cartItem, quantity: newQuantity }
                : cartItem
            )
          };
        }
        // If we would exceed availability, don't add more
        return state;
      }

      // For new items, only add if quantity is available
      if (availableQuantity > 0) {
        return {
          ...state,
          items: [...state.items, { ...item, quantity: 1, available_quantity: availableQuantity }]
        };
      }
      
      return state;
    }
    
    case 'REMOVE_FROM_CART': {
      const { id, type } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => !(item.id === id && item.type === type))
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, type, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => !(item.id === id && item.type === type))
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id && item.type === type
            ? { ...item, quantity }
            : item
        )
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    default:
      return state;
  }
};

const initialState = {
  items: []
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const addToCart = (item) => {
    dispatch({ type: 'ADD_TO_CART', payload: { item } });
  };
  
  const removeFromCart = (id, type) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, type } });
  };
  
  const updateQuantity = (id, type, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, type, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const getCartItemsCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getItemQuantityInCart = (id, type) => {
    const item = state.items.find(cartItem => cartItem.id === id && cartItem.type === type);
    return item ? item.quantity : 0;
  };

  const canAddToCart = (item) => {
    const currentQuantityInCart = getItemQuantityInCart(item.id, item.type || 'product');
    const availableQuantity = item.quantity || item.available_quantity || 1;
    return currentQuantityInCart < availableQuantity;
  };

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getItemQuantityInCart,
    canAddToCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}