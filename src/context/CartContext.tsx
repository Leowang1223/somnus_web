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
    updateQuantity: (productId: string, delta: number) => void;
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
        console.log("═══════════════════════════════════════");
        console.log("🛒 CART: addToCart called");
        console.log("📦 Product received:", product);
        console.log("🔑 Product ID:", product?.id);
        console.log("📝 Product Name:", product?.name);
        console.log("💰 Product Price:", product?.price);

        if (!product.id) {
            console.error("❌ CART ERROR: Product ID is missing!");
            console.log("Product object:", JSON.stringify(product, null, 2));
            return;
        }

        console.log("📊 Current cart state BEFORE:", items.length, "items");
        items.forEach((item, idx) => {
            console.log(`  Item ${idx}: ${item.product.id} - ${item.product.name} (qty: ${item.quantity})`);
        });

        setItems(prev => {
            console.log("🔄 setItems callback executing...");
            const existing = prev.find(item => String(item.product.id) === String(product.id));

            if (existing) {
                console.log("✅ Found existing item, incrementing quantity");
                console.log("   Old quantity:", existing.quantity);
                const newItems = prev.map(item =>
                    String(item.product.id) === String(product.id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
                console.log("   New cart:", newItems);
                return newItems;
            }

            console.log("➕ Adding new item to cart");
            const newItems = [...prev, { product, quantity: 1 }];
            console.log("   New cart:", newItems);
            return newItems;
        });

        console.log("🚪 Setting isOpen to true");
        setIsOpen(true);
        console.log("✓ addToCart completed");
        console.log("═══════════════════════════════════════");
    };

    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setItems(prev => {
            return prev.map(item => {
                if (String(item.product.id) === String(productId)) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const toggleCart = () => setIsOpen(!isOpen);

    const cartTotal = items.reduce((total, item) => {
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        return total + (price * item.quantity);
    }, 0);

    // Debug: Expose toggleCart and inspection to window
    useEffect(() => {
        (window as any).debugToggleCart = toggleCart;
        (window as any).toggleCart = toggleCart;
        (window as any).inspectCart = () => {
            console.log("═══ CART INSPECTION ═══");
            console.log("📊 Total items:", items.length);
            console.log("🚪 isOpen:", isOpen);
            console.log("💰 Cart total:", cartTotal);
            console.log("📦 Items:");
            items.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.product.name} (ID: ${item.product.id}) - Qty: ${item.quantity} - Price: $${item.product.price}`);
            });
            console.log("═════════════════════");
        };
        console.log("Cart debug functions ready: debugToggleCart(), toggleCart(), inspectCart()");
    }, [toggleCart, items, isOpen, cartTotal]);

    return (
        <CartContext.Provider value={{ items, isOpen, addToCart, removeFromCart, updateQuantity, toggleCart, cartTotal }}>
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
