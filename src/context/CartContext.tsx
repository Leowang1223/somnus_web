'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
    product: any;
    quantity: number;
};

type CartContextType = {
    items: CartItem[];
    isOpen: boolean;
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
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

    const addToCart = (product: any) => {
        setItems(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setIsOpen(true);
    };

    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const toggleCart = () => setIsOpen(!isOpen);

    const cartTotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, isOpen, addToCart, removeFromCart, toggleCart, cartTotal }}>
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
