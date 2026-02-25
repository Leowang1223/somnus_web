'use client';

import { useState, useEffect, useRef } from 'react';
import { submitTicketAction, getMyActiveTicketAction, getTicketUpdatesAction, replyToTicketAction, uploadFileAction } from "@/app/actions";
import { Send, User as UserIcon, Headphones, Paperclip, X } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

export default function SupportPage() {
    const { t } = useLanguage();
    const [view, setView] = useState<'department' | 'chat'>('department');
    const [department, setDepartment] = useState('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [startError, setStartError] = useState('');
    const [isRestoring, setIsRestoring] = useState(true);
    const [hasNewAgentReply, setHasNewAgentReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageCountRef = useRef(0);

    const departments = [
        t('support.dept1'),
        t('support.dept2'),
        t('support.dept3'),
    ];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resume the latest active ticket for logged-in users
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getMyActiveTicketAction();
                if (cancelled) return;
                if (res.success && res.ticket) {
                    setTicketId(res.ticket.id);
                    setDepartment(res.ticket.department || '');
                    setMessages(res.ticket.messages || []);
                    setView('chat');
                    lastMessageCountRef.current = (res.ticket.messages || []).length;
                }
            } finally {
                if (!cancelled) setIsRestoring(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Polling for new messages
    useEffect(() => {
        if (!ticketId) return;

        const interval = setInterval(async () => {
            const res = await getTicketUpdatesAction(ticketId, 'user');
            if (res.success && res.ticket) {
                const serverMessages = res.ticket.messages || [];
                const previousCount = lastMessageCountRef.current;
                if (serverMessages.length > previousCount) {
                    const latest = serverMessages[serverMessages.length - 1];
                    if (latest?.sender === 'admin') {
                        setHasNewAgentReply(true);
                    }
                }
                lastMessageCountRef.current = serverMessages.length;
                setMessages(prev => {
                    if (serverMessages.length !== prev.length) {
                        return serverMessages;
                    }
                    return prev;
                });
                if (res.ticket.department && !department) {
                    setDepartment(res.ticket.department);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [ticketId, department]);

    useEffect(() => {
        if (view !== 'chat') return;
        const onFocus = () => setHasNewAgentReply(false);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [view]);

    const startChat = async (msg: string) => {
        const trimmedMsg = msg.trim();
        if (!trimmedMsg && !pendingImage) return;
        setIsSending(true);
        setStartError('');
        const imageUrl = pendingImage;

        const formData = new FormData();
        formData.append('type', 'support');
        formData.append('department', department);
        formData.append('message', trimmedMsg);
        if (imageUrl) formData.append('imageUrl', imageUrl);

        try {
            const res = await submitTicketAction(formData);
            if (res.success && res.ticketId) {
                setTicketId(res.ticketId);
                if ((res as any).existing && (res as any).ticket) {
                    const existingTicket = (res as any).ticket;
                    setDepartment(existingTicket.department || department);
                    setMessages(existingTicket.messages || []);
                    lastMessageCountRef.current = (existingTicket.messages || []).length;
                } else {
                    const initialUiMsg = { id: 'init', sender: 'user', content: trimmedMsg, timestamp: Date.now(), image_url: imageUrl || undefined };
                    setMessages([initialUiMsg]);
                    lastMessageCountRef.current = 1;
                }
                setView('chat');
                setNewMessage('');
                setPendingImage(null);
                setStartError('');
                setHasNewAgentReply(false);
            } else {
                setStartError((res as any)?.error || 'Failed to send message. Please try again.');
            }
        } catch (e: any) {
            setStartError(e?.message || 'Unexpected error while sending message.');
        } finally {
            setIsSending(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', 'cs');
        const result = await uploadFileAction(formData);
        if (result.url) {
            setPendingImage(result.url);
        }
        setImageUploading(false);
        e.target.value = '';
    };

    const sendMessage = async () => {
        const trimmedMsg = newMessage.trim();
        if (!trimmedMsg && !pendingImage) return;
        if (!ticketId || isSending) return;

        setIsSending(true);
        setStartError('');

        const imgUrl = pendingImage;
        const msgToSend = trimmedMsg;
        const tempId = `temp-${Date.now()}`;
        const tempMsg = { id: tempId, sender: 'user', content: msgToSend, timestamp: Date.now(), image_url: imgUrl || undefined };

        setMessages(prev => {
            const next = [...prev, tempMsg];
            lastMessageCountRef.current = next.length;
            return next;
        });
        setNewMessage('');
        setPendingImage(null);

        const rollbackTemp = () => {
            setMessages(prev => {
                const next = prev.filter((msg) => msg.id !== tempId);
                lastMessageCountRef.current = next.length;
                return next;
            });
            setNewMessage(msgToSend);
            setPendingImage(imgUrl || null);
        };

        try {
            const res = await replyToTicketAction(ticketId, msgToSend, 'user', imgUrl || undefined);
            if (!res.success) {
                rollbackTemp();
                setStartError((res as any)?.error || 'Failed to send message. Please try again.');
            }
        } catch (e: any) {
            rollbackTemp();
            setStartError(e?.message || 'Unexpected error while sending message.');
        } finally {
            setIsSending(false);
        }
    };

    if (isRestoring) {
        return (
            <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-8 bg-[#050505] text-white flex flex-col items-center">
                <div className="text-sm tracking-widest uppercase text-white/60 animate-pulse">Loading support session...</div>
            </div>
        );
    }

    if (view === 'department') {
        return (
            <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-8 bg-[#050505] text-white flex flex-col items-center">
                <h1 className="font-display text-3xl md:text-4xl mb-6 text-center">{t('support.title')}</h1>
                <p className="text-gray-400 mb-10 md:mb-12 text-center max-w-md text-sm">
                    {t('support.subtitle')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl">
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => { setDepartment(dept); setView('chat'); }}
                            className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-sm hover:border-[#d8aa5b] transition-all group text-left"
                        >
                            <Headphones className="text-gray-600 group-hover:text-[#d8aa5b] mb-4 transition-colors" />
                            <h3 className="text-base md:text-lg font-bold mb-2 group-hover:text-[#d8aa5b] transition-colors">{dept}</h3>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Chat View
    return (
        <div className="min-h-screen pt-20 md:pt-24 px-4 bg-[#050505] text-white flex justify-center items-start">
            <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-sm shadow-2xl flex flex-col h-[calc(100vh-6rem)] md:h-[600px]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                    <div>
                        <h3 className="font-bold text-sm">{t('support.livechat')}</h3>
                        <p className="text-[10px] text-[#d8aa5b] uppercase tracking-widest">{department}</p>
                    </div>
                    <div className="flex gap-2">
                        {hasNewAgentReply && (
                            <div className="px-2 py-1 rounded bg-[#d8aa5b]/15 text-[#d8aa5b] text-[10px] uppercase tracking-widest">
                                New Reply
                            </div>
                        )}
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                    {!ticketId ? (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center shrink-0">
                                <Headphones size={14} />
                            </div>
                            <div className="bg-[#222] p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[85%]">
                                <p className="text-sm text-gray-300">{t('support.welcome')}</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-[#d8aa5b] text-black' : 'bg-[#333] text-gray-400'}`}>
                                    {msg.sender === 'user' ? <UserIcon size={14} /> : <Headphones size={14} />}
                                </div>
                                <div className={`p-3 max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-[#d8aa5b]/10 text-[#d8aa5b] rounded-tl-lg rounded-bl-lg rounded-br-lg' : 'bg-[#222] text-gray-300 rounded-tr-lg rounded-br-lg rounded-bl-lg'}`}>
                                    {msg.content && <p>{msg.content}</p>}
                                    {msg.image_url && (
                                        <a href={msg.image_url} target="_blank" rel="noreferrer" className="block mt-1">
                                            <img src={msg.image_url} alt="附件" className="max-w-[200px] rounded-sm hover:opacity-80 transition-opacity" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-[#151515]">
                    {startError && (
                        <p className="text-red-400 text-xs mb-2 px-1">{startError}</p>
                    )}
                    {pendingImage && (
                        <div className="mb-2 flex items-center gap-2">
                            <img src={pendingImage} alt="預覽" className="w-14 h-14 object-cover rounded-sm" />
                            <button onClick={() => setPendingImage(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
                        </div>
                    )}
                    <div className="relative flex items-center gap-2">
                        <>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={imageUploading || isSending}
                                    className="text-white/40 hover:text-[#d8aa5b] transition-colors shrink-0 disabled:opacity-30"
                                    title="上傳圖片"
                                >
                                    {imageUploading ? <span className="animate-spin inline-block w-4 h-4 border border-white/40 border-t-white rounded-full" /> : <Paperclip size={16} />}
                                </button>
                            </>
                        <div className="relative flex-1">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isSending) {
                                        ticketId ? sendMessage() : startChat(newMessage);
                                    }
                                }}
                                disabled={isSending}
                                className="w-full bg-[#0a0a09] border border-white/10 p-3 pr-10 rounded-sm text-sm focus:border-[#d8aa5b] outline-none disabled:opacity-50"
                                placeholder={ticketId ? t('support.inputReply') : t('support.inputStart')}
                            />
                            <button
                                onClick={() => ticketId ? sendMessage() : startChat(newMessage)}
                                disabled={isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#d8aa5b] hover:text-white disabled:opacity-40 transition-opacity"
                            >
                                {isSending
                                    ? <span className="animate-spin inline-block w-4 h-4 border border-[#d8aa5b]/40 border-t-[#d8aa5b] rounded-full" />
                                    : <Send size={16} />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
