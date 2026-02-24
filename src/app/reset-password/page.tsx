'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [error, setError] = useState('');

    // Supabase sends access_token and refresh_token in URL hash
    // On page load, we need to detect the session from the URL
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
            // Set session so user can update password
            import('@/lib/supabase/client').then(({ createClient }) => {
                const supabase = createClient();
                supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('兩次密碼輸入不一致');
            return;
        }
        if (password.length < 6) {
            setError('密碼至少 6 個字元');
            return;
        }

        setStatus('loading');
        setError('');

        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                setError(updateError.message);
                setStatus('error');
            } else {
                setStatus('done');
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (e: any) {
            setError(e.message || '密碼更新失敗');
            setStatus('error');
        }
    };

    return (
        <div className="relative z-10 w-full max-w-md bg-[#0a0a09] border border-white/5 p-6 md:p-8 rounded-sm mx-4">
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl text-white mb-2">設定新密碼</h1>
                <p className="text-gray-500 text-sm">請輸入您的新密碼</p>
            </div>

            {status === 'done' ? (
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#d8aa5b]/20 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-[#d8aa5b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-white">密碼已更新！</p>
                    <p className="text-gray-500 text-sm">正在跳轉至登入頁面...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">新密碼</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="至少 6 個字元"
                            className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">確認密碼</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            placeholder="再次輸入新密碼"
                            className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                        />
                    </div>

                    {error && <div className="text-red-400 text-xs text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-[#d8aa5b] text-black h-12 font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {status === 'loading' ? '更新中...' : '確認更新密碼'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#d8aa5b] opacity-[0.03] blur-[150px] rounded-full" />
            <Suspense fallback={<div className="text-white font-display uppercase tracking-widest animate-pulse">載入中...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </main>
    );
}
