'use client';

import { useState } from 'react';
import { Package, Truck, Eye, Search, Filter } from "lucide-react";
import { updateOrderStatusAction } from "@/app/actions";

export default function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Manage Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', carrier: 'DHL', status: 'shipped' });

    const filteredOrders = orders.filter((order: any) => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shippingInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleManage = (order: any) => {
        setSelectedOrder(order);
        setTrackingForm({
            trackingNumber: order.trackingInfo?.trackingNumber || '',
            carrier: order.trackingInfo?.carrier || 'DHL',
            status: order.status
        });
        setIsManageModalOpen(true);
    };

    const handleSaveUpdate = async () => {
        if (!selectedOrder) return;

        const trackingInfo = trackingForm.status === 'shipped' || trackingForm.status === 'delivered' ? {
            trackingNumber: trackingForm.trackingNumber,
            carrier: trackingForm.carrier,
            trackingUrl: `https://www.google.com/search?q=${trackingForm.carrier}+tracking+${trackingForm.trackingNumber}` // Simplified
        } : undefined;

        await updateOrderStatusAction(selectedOrder.id, trackingForm.status, trackingInfo);

        // Optimistic update
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: trackingForm.status, ...(trackingInfo ? { trackingInfo } : {}) } : o));
        setIsManageModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div>
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4 bg-[#111] border border-white/10 p-2 rounded-sm w-full md:w-auto">
                    <Search className="text-gray-500 ml-2" size={18} />
                    <input
                        placeholder="Search Order ID or Customer..."
                        className="bg-transparent text-white focus:outline-none text-sm w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    {['all', 'paid', 'processing', 'shipped', 'delivered'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-sm border transition-colors ${filter === f ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-widest border-b border-white/5">
                        <tr>
                            <th className="p-6">Order ID</th>
                            <th className="p-6">Date</th>
                            <th className="p-6">Customer</th>
                            <th className="p-6">Total</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOrders.map((order: any) => (
                            <tr key={order.id} className="text-white hover:bg-white/5 transition-colors">
                                <td className="p-6 font-mono text-[#d8aa5b]">{order.id}</td>
                                <td className="p-6 text-sm text-gray-400">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="p-6">
                                    <div className="font-bold">{order.shippingInfo.fullName}</div>
                                    <div className="text-xs text-gray-500">{order.shippingInfo.email}</div>
                                </td>
                                <td className="p-6 font-mono">${order.total}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <button
                                        onClick={() => handleManage(order)}
                                        className="text-white hover:text-[#d8aa5b] transition-colors p-2"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No orders found.</div>
                )}
            </div>

            {/* Manage Modal */}
            {isManageModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-sm p-8 relative">
                        <button onClick={() => setIsManageModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                        <h2 className="text-2xl font-display text-white mb-6">Manage Order <span className="text-[#d8aa5b]">{selectedOrder.id}</span></h2>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Shipping To</h3>
                                <p className="text-white text-sm">
                                    {selectedOrder.shippingInfo.fullName}<br />
                                    {selectedOrder.shippingInfo.addressLine1}<br />
                                    {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Items</h3>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    {selectedOrder.items.map((item: any, i: number) => (
                                        <li key={i}>{item.quantity}x {item.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-6">
                            <h3 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                <Truck size={16} /> Logistics Update
                            </h3>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-2">Order Status</label>
                                <select
                                    className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm"
                                    value={trackingForm.status}
                                    onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                >
                                    <option value="paid">Paid (Unfulfilled)</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {(trackingForm.status === 'shipped' || trackingForm.status === 'delivered') && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-2">Carrier</label>
                                        <select
                                            className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm"
                                            value={trackingForm.carrier}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                                        >
                                            <option value="DHL">DHL</option>
                                            <option value="FedEx">FedEx</option>
                                            <option value="UPS">UPS</option>
                                            <option value="SF Express">SF Express</option>
                                            <option value="Black Cat">Black Cat (黑貓)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-2">Tracking Number</label>
                                        <input
                                            className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm focus:border-[#d8aa5b] outline-none"
                                            placeholder="Enter Value"
                                            value={trackingForm.trackingNumber}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            <button onClick={() => setIsManageModalOpen(false)} className="px-6 py-3 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleSaveUpdate} className="bg-[#d8aa5b] text-black px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm">Update Order</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
