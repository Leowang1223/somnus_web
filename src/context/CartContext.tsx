'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
    product: any;
    quantity: number;
    variant?: { id: string, name: string };
    // 預購資訊
    is_preorder?: boolean;
    expected_ship_date?: string;
    deposit_amount?: number;
    full_amount?: number;
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

            // 計算預購資訊
            const isPreorder = product.is_preorder || false;
            let depositAmount = product.price;
            let fullAmount = product.price;

            if (isPreorder && product.preorder_deposit_percentage) {
                const percentage = product.preorder_deposit_percentage;
                depositAmount = Math.round((product.price * percentage) / 100 * 100) / 100;
                fullAmount = product.price;
            }

            const cartItem: CartItem = {
                product,
                quantity: 1,
                variant,
                is_preorder: isPreorder,
                expected_ship_date: product.expected_ship_date,
                deposit_amount: depositAmount,
                full_amount: fullAmount
            };

            if (existing) {
                return prev.map(item =>
                    (String(item.product.id) === String(product.id) && item.variant?.id === variant?.id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, cartItem];
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

    // 計算購物車總額（預購商品使用訂金）
    const cartTotal = items.reduce((total, item) => {
        let price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;

        // 如果是預購商品，使用訂金金額
        if (item.is_preorder && item.deposit_amount) {
            price = item.deposit_amount;
        }

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
