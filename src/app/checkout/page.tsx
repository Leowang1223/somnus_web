'use client';

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/app/actions";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial form state
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'Taiwan'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const orderData = {
            total: cartTotal,
            items: items.map(item => ({
                productId: item.product.id,
                variantId: item.variant?.id,
                name: item.product.name + (item.variant ? ` - ${item.variant.name}` : ''),
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.image
            })),
            shippingInfo: formData
        };

        const result = await createOrderAction(orderData);

        if (result.success) {
            clearCart();
            router.push(`/order-confirmation/${result.orderId}`);
        } else {
            alert('Order creation failed. Please try again.');
            setIsLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-display text-white mb-4">Your Ritual is Empty</h1>
                    <Link href="/collection" className="text-[#d8aa5b] hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border-b border-[#d8aa5b]">
                        Return to Collection
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12">
            <div className="container mx-auto px-6 max-w-6xl">
                <Link href="/collection" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Continue Shopping
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Left: Form */}
                    <div>
                        <h1 className="text-3xl font-display mb-8">Secure Checkout</h1>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4">Contact</h2>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm"
                                />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-8">Shipping Address</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="col-span-2 w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                    <input required name="addressLine1" placeholder="Address" value={formData.addressLine1} onChange={handleChange} className="col-span-2 w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                    <input required name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                    <input required name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleChange} className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                    <input required name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="col-span-2 w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                </div>
                            </div>

                            <div className="pt-8">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#d8aa5b] text-black h-14 font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><ShieldCheck size={18} /> Place Order &mdash; ${cartTotal}</span>}
                                </button>
                                <p className="text-center text-gray-600 text-[10px] mt-4 uppercase tracking-widest">
                                    Secure Checkout
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="bg-[#111] p-8 rounded-sm h-fit sticky top-24 border border-white/5">
                        <h2 className="text-xl font-display mb-8">Your Ritual</h2>
                        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-16 h-20 bg-[#050505] rounded-sm relative overflow-hidden flex-shrink-0">
                                        {item.product.image ? (
                                            <img src={item.product.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#111] flex items-center justify-center text-white/10">
                                                <div className="w-4 h-4 rounded-full bg-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 bg-[#d8aa5b] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                                            {item.quantity}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-display text-sm">{item.product.name}</h3>
                                        <p className="text-gray-500 text-xs">{item.variant?.name}</p>
                                        <p className="text-[#d8aa5b] text-sm mt-1">${item.product.price * item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-6 space-y-2">
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>Subtotal</span>
                                <span>${cartTotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between text-white text-lg font-display pt-4 border-t border-white/10 mt-4">
                                <span>Total</span>
                                <span className="text-[#d8aa5b]">${cartTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
