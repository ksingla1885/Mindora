'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
    setIsLoading(false);
  }, []);

  // Sync cart with server if user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && !isLoading) {
      syncCartWithServer();
    }
  }, [status, isLoading]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoading]);

  const syncCartWithServer = async () => {
    try {
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        const { cart } = await response.json();
        setItems(cart.items || []);
      }
    } catch (error) {
      console.error('Error syncing cart with server:', error);
    }
  };

  const addItem = async (test, quantity = 1) => {
    // If user is not authenticated, redirect to sign in
    if (status !== 'authenticated') {
      router.push(`/auth/signin?callbackUrl=/marketplace`);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: test.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }

      const { cart } = await response.json();
      setItems(cart.items);
      
      toast.success('Added to cart', {
        description: test.title,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart'),
        },
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart', {
        description: error.message,
      });
    }
  };

  const removeItem = async (testId) => {
    try {
      setItems(prev => {
        const updated = prev.filter(item => item.testId !== testId);
        return updated;
      });

      if (status === 'authenticated') {
        await fetch(`/api/cart/${testId}`, {
          method: 'DELETE',
        });
      }

      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
    }
  };

  const updateQuantity = async (testId, quantity) => {
    if (quantity < 1) {
      removeItem(testId);
      return;
    }

    try {
      setItems(prev =>
        prev.map(item =>
          item.testId === testId ? { ...item, quantity } : item
        )
      );

      if (status === 'authenticated') {
        await fetch(`/api/cart/${testId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const clearCart = async () => {
    try {
      setItems([]);
      
      if (status === 'authenticated') {
        await fetch('/api/cart', {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartTotal,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
