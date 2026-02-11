'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
    product: any;
    quantity: number;
    variant?: { id: string, name: string };
};

type CartContextType = {
    items: CartItem[];
    isOpen: boolean;
    addToCart: (product: any, variant?: { id: string, name: string }) => void;
    removeFromCart: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, delta: number, variantId?: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Mock persistence
    useEffect(() => {
        const saved = localStorage.getItem('somnus-cart');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('somnus-cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: any, variant?: { id: string, name: string }) => {
        if (!product.id) return;

        setItems(prev => {
            // Find existing item matching BOTH product ID and variant ID
            const existing = prev.find(item =>
                String(item.product.id) === String(product.id) &&
                item.variant?.id === variant?.id
            );

            if (existing) {
                return prev.map(item =>
                    (String(item.product.id) === String(product.id) && item.variant?.id === variant?.id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, { product, quantity: 1, variant }];
        });

        setIsOpen(true);
    };

    const removeFromCart = (productId: string, variantId?: string) => {
        setItems(prev => prev.filter(item =>
            !(String(item.product.id) === String(productId) && item.variant?.id === variantId)
        ));
    };

    const updateQuantity = (productId: string, delta: number, variantId?: string) => {
        setItems(prev => {
            return prev.map(item => {
                if (String(item.product.id) === String(productId) && item.variant?.id === variantId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('somnus-cart');
    };

    const toggleCart = () => setIsOpen(!isOpen);

    const cartTotal = items.reduce((total, item) => {
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        return total + (price * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{ items, isOpen, addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
