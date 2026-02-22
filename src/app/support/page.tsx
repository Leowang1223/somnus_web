'use client';

import { useState, useEffect, useRef } from 'react';
import { submitTicketAction, getTicketUpdatesAction, replyToTicketAction } from "@/app/actions";
import { Send, User as UserIcon, Headphones } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

export default function SupportPage() {
    const { t } = useLanguage();
    const [view, setView] = useState<'department' | 'chat'>('department');
    const [department, setDepartment] = useState('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const departments = [
        t('support.dept1'),
        t('support.dept2'),
        t('support.dept3'),
    ];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Polling for new messages
    useEffect(() => {
        if (!ticketId) return;

        const interval = setInterval(async () => {
            const res = await getTicketUpdatesAction(ticketId);
            if (res.success && res.ticket) {
                const serverMessages = res.ticket.messages || [];
                setMessages(prev => {
                    if (serverMessages.length > prev.length) {
                        return serverMessages;
                    }
                    return prev;
                });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [ticketId]);

    const startChat = async (msg: string) => {
        const formData = new FormData();
        formData.append('type', 'support');
        formData.append('department', department);
        formData.append('message', msg);

        const res = await submitTicketAction(formData);
        if (res.success && res.ticketId) {
            setTicketId(res.ticketId);
            setMessages([{ id: 'init', sender: 'user', content: msg, timestamp: Date.now() }]);
            setView('chat');
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !ticketId) return;

        const tempMsg = { id: `temp-${Date.now()}`, sender: 'user', content: newMessage, timestamp: Date.now() };
        setMessages(prev => [...prev, tempMsg]);
        const msgToSend = newMessage;
        setNewMessage('');

        await replyToTicketAction(ticketId, msgToSend, 'user');
    };

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
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-[#151515]">
                    <div className="relative">
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') ticketId ? sendMessage() : startChat(newMessage);
                            }}
                            className="w-full bg-[#0a0a09] border border-white/10 p-3 pr-10 rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                            placeholder={ticketId ? t('support.inputReply') : t('support.inputStart')}
                        />
                        <button
                            onClick={() => ticketId ? sendMessage() : startChat(newMessage)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#d8aa5b] hover:text-white"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
