'use client';

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { loginAction } from "@/app/actions";

function LoginContent() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const redirect = searchParams.get('redirect');
        const action = searchParams.get('action');

        let target = redirect || '/';
        if (action) {
            target += (target.includes('?') ? '&' : '?') + `action=${action}`;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const result = await loginAction(formData);

        if (result.success && result.user) {
            // Login successful - Supabase session is now set
            // Direct navigation instead of using AuthContext
            window.location.href = target;
        } else {
            setError(result.error || "Invalid credentials.");
        }
    };

    const fillCredentials = (type: 'admin' | 'user') => {
        if (type === 'admin') {
            setEmail("admin@somnus.com");
            setPassword("admin123");
        } else {
            setEmail("user@somnus.com");
            setPassword("user123");
        }
    };

    return (
        <div className="relative z-10 w-full max-w-md bg-[#0a0a09] border border-white/5 p-8 rounded-sm">
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl text-white mb-2">Member Access</h1>
                <p className="text-gray-500 text-sm">Enter your sanctuary credentials.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-xs text-center">{error}</div>
                )}

                <button type="submit" className="w-full bg-[#d8aa5b] text-black h-12 font-bold uppercase tracking-widest hover:bg-white transition-colors">
                    Enter Ritual
                </button>

                <div className="relative flex py-6 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-[10px] uppercase tracking-widest">Or Continue With</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: `${window.location.origin}/auth/callback`,
                            },
                        });
                        if (error) setError(error.message);
                    }}
                    className="w-full bg-white text-black h-12 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 rounded-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <button onClick={() => fillCredentials('user')} className="text-left group">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1 group-hover:text-white">Test User</span>
                    <span className="block text-xs text-gray-700 font-mono">user@somnus.com</span>
                </button>
                <button onClick={() => fillCredentials('admin')} className="text-right group">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1 group-hover:text-white">Test Admin</span>
                    <span className="block text-xs text-gray-700 font-mono">admin@somnus.com</span>
                </button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#d8aa5b] opacity-[0.03] blur-[150px] rounded-full"></div>

            <Suspense fallback={<div className="text-white font-display uppercase tracking-widest animate-pulse">Entering...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    );
}
