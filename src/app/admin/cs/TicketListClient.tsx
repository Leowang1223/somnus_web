'use client';

import { useState } from 'react';
import { updateTicketStatusAction, claimTicketAction, replyToTicketAction } from "@/app/actions";
import { CheckCircle, XCircle, MessageSquare, AlertTriangle, Eye, RefreshCw, UserPlus, Send } from "lucide-react";

export default function TicketListClient({ tickets }: { tickets: any[] }) {
    const [view, setView] = useState<'queue' | 'mine'>('queue');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    // In a real app, we'd get the current currentAdminId from session
    const currentAdminId = 'admin-1';

    const unassignedTickets = tickets.filter(t => !t.assignedTo && t.status !== 'closed');
    const myTickets = tickets.filter(t => t.assignedTo === currentAdminId);

    const shownTickets = view === 'queue' ? unassignedTickets : myTickets;
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const handleClaim = async (id: string) => {
        await claimTicketAction(id, currentAdminId);
        setView('mine'); // Switch to my view to see the claimed ticket
    };

    const handleReply = async () => {
        if (!selectedTicketId || !replyMessage.trim()) return;
        await replyToTicketAction(selectedTicketId, replyMessage, 'admin');
        setReplyMessage('');
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        await updateTicketStatusAction(id, newStatus);
    };

    // Chat Detail View
    if (selectedTicket) {
        return (
            <div className="flex h-[600px] gap-6">
                {/* Left: Chat Area */}
                <div className="flex-1 bg-[#111] border border-white/10 rounded-sm flex flex-col">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                        <div>
                            <button onClick={() => setSelectedTicketId(null)} className="text-xs text-gray-500 hover:text-white mb-1">← Back to List</button>
                            <h3 className="font-bold text-white">Ticket #{selectedTicket.id}</h3>
                            <p className="text-xs text-[#d8aa5b]">{selectedTicket.department}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleStatusUpdate(selectedTicket.id, 'closed')} className="bg-red-500/10 text-red-500 px-3 py-1 rounded text-xs">Close Ticket</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {(selectedTicket.messages || []).length > 0 ? (
                            selectedTicket.messages.map((msg: any, idx: number) => (
                                <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 max-w-[80%] text-sm rounded-sm ${msg.sender === 'admin' ? 'bg-[#d8aa5b] text-black' : 'bg-[#222] text-gray-300'}`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        ) : (
                            // Legacy ticket support (migrating old structure)
                            <div className="bg-[#222] p-4 text-gray-300 rounded-sm">
                                {selectedTicket.message}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-[#151515]">
                        <div className="relative">
                            <input
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                className="w-full bg-[#0a0a09] border border-white/10 p-4 pr-12 rounded-sm text-sm focus:border-[#d8aa5b] outline-none text-white"
                                placeholder="Type a reply..."
                            />
                            <button
                                onClick={handleReply}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#d8aa5b] hover:text-white"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="w-80 bg-[#111] border border-white/10 rounded-sm p-6 space-y-6">
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Order Context</h4>
                        {selectedTicket.orderId ? (
                            <div className="text-white font-mono text-sm">{selectedTicket.orderId}</div>
                        ) : (
                            <div className="text-gray-600 text-sm italic">No Order ID</div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Customer Context</h4>
                        <div className="text-white text-sm">Guest User</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* View Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setView('queue')}
                    className={`text-xs uppercase tracking-widest px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${view === 'queue' ? 'bg-[#d8aa5b] text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                >
                    <RefreshCw size={14} /> Unassigned Queue ({tickets.filter(t => !t.assignedTo && t.status !== 'closed').length})
                </button>
                <button
                    onClick={() => setView('mine')}
                    className={`text-xs uppercase tracking-widest px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${view === 'mine' ? 'bg-[#d8aa5b] text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                >
                    <CheckCircle size={14} /> My Workspace ({tickets.filter(t => t.assignedTo === currentAdminId).length})
                </button>
            </div>

            {/* Ticket List */}
            <div className="space-y-4">
                {shownTickets.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 bg-[#111] rounded-sm text-gray-600">
                        {view === 'queue' ? 'Queue is clear. Good job!' : 'You have no active tickets. Go claim some!'}
                    </div>
                ) : (
                    shownTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-[#111] border border-white/10 p-6 rounded-sm hover:border-white/20 transition-all group">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest bg-blue-900/30 text-blue-400`}>
                                            {ticket.department || 'General'}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${ticket.status === 'open' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <h3 className="text-lg text-white font-medium">{ticket.department} Inquiry</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed truncate max-w-xl">
                                        {ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].content : ticket.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                    {view === 'queue' ? (
                                        <button
                                            onClick={() => handleClaim(ticket.id)}
                                            className="flex items-center gap-2 bg-[#d8aa5b] text-black px-4 py-2 rounded-sm text-xs uppercase font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(216,170,91,0.3)]"
                                        >
                                            <UserPlus size={16} /> Claim Ticket
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedTicketId(ticket.id)}
                                            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-sm text-xs uppercase font-bold hover:bg-white/20 transition-all"
                                        >
                                            <MessageSquare size={16} /> Open Chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
