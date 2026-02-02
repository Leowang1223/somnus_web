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
            login(result.user.role as any, target); // login from AuthContext automatically redirects if needed
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
