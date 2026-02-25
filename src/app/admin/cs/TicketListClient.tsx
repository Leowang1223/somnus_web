'use client';

import { useState, useEffect, useRef } from 'react';
import { updateTicketStatusAction, claimTicketAction, unassignTicketAction, replyToTicketAction, getAdminTicketsAction, getTicketUpdatesAction, uploadFileAction } from "@/app/actions";
import { CheckCircle, MessageSquare, RefreshCw, UserPlus, Send, Paperclip, X } from "lucide-react";

export default function TicketListClient({ tickets: initialTickets, adminEmail, adminId }: { tickets: any[], adminEmail: string, adminId: string }) {
    const [view, setView] = useState<'queue' | 'mine'>('queue');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [tickets, setTickets] = useState(initialTickets);
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [adminError, setAdminError] = useState('');
    const [hasIncomingUserMessage, setHasIncomingUserMessage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sortTicketsByRecent = (items: any[]) => {
        return [...items].sort((a, b) => {
            const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
            if (bTime !== aTime) return bTime - aTime;
            return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
        });
    };

    // Poll for ticket list updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await getAdminTicketsAction();
            if (res.success && res.tickets) {
                setTickets(prev => {
                    const prevUnreadMap = new Map(prev.map((t: any) => [t.id, !!t.hasUnreadForAdmin]));
                    const next = sortTicketsByRecent(res.tickets || []);
                    const hasNewUnread = next.some((t: any) => t.hasUnreadForAdmin && !prevUnreadMap.get(t.id));
                    if (hasNewUnread) setHasIncomingUserMessage(true);
                    return next;
                });
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Poll for selected ticket messages every 3 seconds
    useEffect(() => {
        if (!selectedTicketId) return;
        const interval = setInterval(async () => {
            const res = await getTicketUpdatesAction(selectedTicketId, 'admin');
            if (res.success && res.ticket) {
                setTickets(prev => prev.map(t =>
                    t.id === selectedTicketId ? { ...t, ...res.ticket } : t
                ).sort((a, b) => {
                    const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
                    const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
                    return bTime - aTime;
                }));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedTicketId]);

    const orderedTickets = sortTicketsByRecent(tickets);
    const unassignedTickets = orderedTickets.filter(t => !t.assignedTo && t.status !== 'closed');
    const myTickets = orderedTickets.filter(t => t.assignedTo === adminId && t.status !== 'closed');

    const shownTickets = view === 'queue' ? unassignedTickets : myTickets;
    const selectedTicket = orderedTickets.find(t => t.id === selectedTicketId);

    const handleClaim = async (id: string) => {
        setAdminError('');
        const res = await claimTicketAction(id, adminId);
        if (!res.success) {
            setAdminError((res as any)?.error || 'Failed to claim ticket');
            return;
        }
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, assignedTo: adminId, assignedAt: new Date().toISOString(), status: 'open' } : t
        ));
        setView('mine');
    };

    const handleUnassign = async (id: string) => {
        setAdminError('');
        const res = await unassignTicketAction(id);
        if (!res.success) {
            setAdminError((res as any)?.error || 'Failed to unassign ticket');
            return;
        }
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, assignedTo: null, assignedAt: null } : t
        ));
        setSelectedTicketId(null);
        setView('queue');
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', 'cs-admin');
        const result = await uploadFileAction(formData);
        if (result.url) setPendingImage(result.url);
        setImageUploading(false);
        e.target.value = '';
    };

    const handleReply = async () => {
        if (!selectedTicketId || (!replyMessage.trim() && !pendingImage)) return;
        setAdminError('');
        const msg = replyMessage;
        const imgUrl = pendingImage;
        setReplyMessage('');
        setPendingImage(null);
        setHasIncomingUserMessage(false);

        // Optimistic UI
        const nowIso = new Date().toISOString();
        const tempMsg: any = { id: `msg-${Date.now()}`, sender: 'admin', content: msg, timestamp: Date.now() };
        if (imgUrl) tempMsg.image_url = imgUrl;
        setTickets(prev => prev.map(t =>
            t.id === selectedTicketId ? {
                ...t,
                messages: [...(t.messages || []), tempMsg],
                lastMessageAt: nowIso,
                lastMessageSender: 'admin',
                lastMessagePreview: (msg || '').trim() ? msg.trim().slice(0, 200) : '[image]',
                hasUnreadForAdmin: false,
            } : t
        ));

        const res = await replyToTicketAction(selectedTicketId, msg, 'admin', imgUrl || undefined);
        if (!res.success) {
            setAdminError((res as any)?.error || 'Failed to send reply');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setAdminError('');
        const res = await updateTicketStatusAction(id, newStatus);
        if (!res.success) {
            setAdminError((res as any)?.error || 'Failed to update ticket status');
            return;
        }
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));
        if (newStatus === 'closed') setSelectedTicketId(null);
    };

    // Chat Detail View
    if (selectedTicket) {
        return (
            <div className="flex h-[600px] gap-6">
                {/* Left: Chat Area */}
                <div className="flex-1 bg-[#111] border border-white/10 rounded-sm flex flex-col">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                        <div>
                            <button onClick={() => setSelectedTicketId(null)} className="text-xs text-gray-500 hover:text-white mb-1">&larr; Back to List</button>
                            <h3 className="font-bold text-white">Ticket #{selectedTicket.id}</h3>
                            <p className="text-xs text-[#d8aa5b]">{selectedTicket.department}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            {selectedTicket.assignedTo === adminId && (
                                <button onClick={() => handleUnassign(selectedTicket.id)} className="bg-white/5 text-white/80 px-3 py-1 rounded text-xs hover:bg-white/10">Leave / Unassign</button>
                            )}
                            {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                                <button onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')} className="bg-green-500/10 text-green-400 px-3 py-1 rounded text-xs">Resolve</button>
                            )}
                            {selectedTicket.status !== 'closed' && (
                                <button onClick={() => handleStatusUpdate(selectedTicket.id, 'closed')} className="bg-red-500/10 text-red-500 px-3 py-1 rounded text-xs">Close</button>
                            )}
                            {selectedTicket.status !== 'open' && selectedTicket.status !== 'closed' && (
                                <button onClick={() => handleStatusUpdate(selectedTicket.id, 'open')} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded text-xs">Reopen</button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {(selectedTicket.messages || []).length > 0 ? (
                            selectedTicket.messages.map((msg: any, idx: number) => (
                                <div key={msg.id || idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 max-w-[80%] text-sm rounded-sm ${msg.sender === 'admin' ? 'bg-[#d8aa5b] text-black' : 'bg-[#222] text-gray-300'}`}>
                                        {msg.content && <p>{msg.content}</p>}
                                        {msg.image_url && (
                                            <a href={msg.image_url} target="_blank" rel="noreferrer" className="block mt-1">
                                                <img src={msg.image_url} alt="附件" className="max-w-[200px] rounded-sm hover:opacity-80 transition-opacity" />
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-600 py-10">No messages yet.</div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-[#151515]">
                        {adminError && <p className="text-red-400 text-xs mb-2">{adminError}</p>}
                        {pendingImage && (
                            <div className="mb-2 flex items-center gap-2">
                                <img src={pendingImage} alt="預覽" className="w-14 h-14 object-cover rounded-sm" />
                                <button onClick={() => setPendingImage(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
                            </div>
                        )}
                        <div className="relative flex items-center gap-2">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imageUploading}
                                className="text-white/40 hover:text-[#d8aa5b] transition-colors shrink-0 disabled:opacity-30"
                                title="上傳圖片"
                            >
                                {imageUploading ? <span className="animate-spin inline-block w-4 h-4 border border-white/40 border-t-white rounded-full" /> : <Paperclip size={16} />}
                            </button>
                            <div className="relative flex-1">
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
                </div>

                {/* Right: Info */}
                <div className="w-80 bg-[#111] border border-white/10 rounded-sm p-6 space-y-6">
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Customer</h4>
                        <div className="text-white text-sm font-mono">{selectedTicket.userEmail || 'Guest User'}</div>
                    </div>
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Order Context</h4>
                        {selectedTicket.orderId ? (
                            <div className="text-white font-mono text-sm">{selectedTicket.orderId}</div>
                        ) : (
                            <div className="text-gray-600 text-sm italic">No Order ID</div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Status</h4>
                        <div className="text-[#d8aa5b] text-sm uppercase font-bold">{selectedTicket.status}</div>
                    </div>
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Assigned To</h4>
                        <div className="text-white text-sm">{selectedTicket.assignedTo === adminId ? `You (${adminEmail})` : selectedTicket.assignedTo || 'Unassigned'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {hasIncomingUserMessage && (
                <div className="border border-[#d8aa5b]/30 bg-[#d8aa5b]/5 text-[#d8aa5b] text-xs px-4 py-3 rounded-sm flex items-center justify-between">
                    <span>New customer message received.</span>
                    <button className="underline underline-offset-2" onClick={() => setHasIncomingUserMessage(false)}>Dismiss</button>
                </div>
            )}
            {adminError && (
                <div className="border border-red-500/20 bg-red-500/5 text-red-300 text-xs px-4 py-3 rounded-sm">
                    {adminError}
                </div>
            )}
            {/* View Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setView('queue')}
                    className={`text-xs uppercase tracking-widest px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${view === 'queue' ? 'bg-[#d8aa5b] text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                >
                    <RefreshCw size={14} /> Unassigned Queue ({unassignedTickets.length})
                </button>
                <button
                    onClick={() => setView('mine')}
                    className={`text-xs uppercase tracking-widest px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${view === 'mine' ? 'bg-[#d8aa5b] text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                >
                    <CheckCircle size={14} /> My Workspace ({myTickets.length})
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
                                        <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest bg-blue-900/30 text-blue-400">
                                            {ticket.department || 'General'}
                                        </span>
                                        {ticket.hasUnreadForAdmin && (
                                            <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest bg-[#d8aa5b]/15 text-[#d8aa5b]">
                                                New
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${ticket.status === 'open' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg text-white font-medium">{ticket.department} Inquiry</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed truncate max-w-xl">
                                        {ticket.lastMessagePreview || (ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].content : 'No messages')}
                                    </p>
                                    <p className="text-[10px] text-gray-600 font-mono">{ticket.userEmail || 'Guest'}</p>
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
