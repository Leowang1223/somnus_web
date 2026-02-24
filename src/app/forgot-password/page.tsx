'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                setError(resetError.message);
                setStatus('error');
            } else {
                setStatus('sent');
            }
        } catch (e: any) {
            setError(e.message || '發送失敗，請稍後再試');
            setStatus('error');
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#d8aa5b] opacity-[0.03] blur-[150px] rounded-full" />

            <div className="relative z-10 w-full max-w-md bg-[#0a0a09] border border-white/5 p-6 md:p-8 rounded-sm mx-4">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl text-white mb-2">重設密碼</h1>
                    <p className="text-gray-500 text-sm">輸入您的 Email，我們將發送重設連結</p>
                </div>

                {status === 'sent' ? (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-[#d8aa5b]/20 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-[#d8aa5b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-white text-sm">重設連結已發送至</p>
                        <p className="text-[#d8aa5b] font-bold">{email}</p>
                        <p className="text-gray-500 text-xs">請檢查您的收件匣（包含垃圾郵件）</p>
                        <Link href="/login" className="block mt-6 text-gray-500 hover:text-white text-xs uppercase tracking-widest transition-colors">
                            返回登入
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                                className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                            />
                        </div>

                        {error && <div className="text-red-400 text-xs text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-[#d8aa5b] text-black h-12 font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? '發送中...' : '發送重設連結'}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-gray-500 hover:text-[#d8aa5b] text-xs transition-colors uppercase tracking-widest">
                                返回登入
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
