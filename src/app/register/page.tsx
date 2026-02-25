'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useState, Suspense } from "react";
import Link from "next/link";

function RegisterContent() {
    const { t } = useLanguage();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const sanitizeEmail = (value: string) => value.replace(/\s+/g, "").trim();
    const mapSignUpError = (message: string) => {
        const lower = message.toLowerCase();
        if (lower.includes("invalid") && lower.includes("email")) {
            return "Invalid email format. Remove spaces and try again.";
        }
        if (lower.includes("rate limit")) {
            return "Too many attempts. Please try again later.";
        }
        if (lower.includes("already registered") || lower.includes("already been registered")) {
            return "This email is already registered. Please sign in instead.";
        }
        return message;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("兩次輸入的密碼不一致");
            return;
        }
        if (password.length < 6) {
            setError("密碼至少需要 6 個字元");
            return;
        }
        const normalizedEmail = sanitizeEmail(email);
        if (!normalizedEmail) {
            setError("Please enter an email address.");
            return;
        }


        setLoading(true);
        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });
            if (signUpError) {
                setError(mapSignUpError(signUpError.message));
            } else {
                setEmail(normalizedEmail);
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err?.message || "註冊失敗，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative z-10 w-full max-w-md bg-[#0a0a09] border border-white/5 p-6 md:p-8 rounded-sm mx-4 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#d8aa5b]/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#d8aa5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="font-display text-2xl text-white mb-2">請確認您的 Email</h2>
                    <p className="text-gray-500 text-sm">
                        我們已寄送驗證信至<br />
                        <span className="text-[#d8aa5b]">{email}</span><br />
                        請點擊信中連結完成帳號驗證。
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-block w-full bg-[#d8aa5b] text-black h-12 leading-[3rem] font-bold uppercase tracking-widest hover:bg-white transition-colors text-center"
                >
                    返回登入
                </Link>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full max-w-md bg-[#0a0a09] border border-white/5 p-6 md:p-8 rounded-sm mx-4">
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl text-white mb-2">建立帳號</h1>
                <p className="text-gray-500 text-sm">加入 SØMNS，探索香氛世界。</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">姓名</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="您的姓名（選填）"
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors placeholder:text-white/20"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                        required
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">密碼</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="至少 6 個字元"
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors placeholder:text-white/20"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">確認密碼</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors"
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-xs text-center">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#d8aa5b] text-black h-12 font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "處理中..." : "建立帳號"}
                </button>

                <div className="text-center pt-2">
                    <span className="text-gray-500 text-xs">已有帳號？</span>
                    {" "}
                    <Link href="/login" className="text-[#d8aa5b] hover:text-white text-xs transition-colors uppercase tracking-widest">
                        立即登入
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#d8aa5b] opacity-[0.03] blur-[150px] rounded-full"></div>

            <Suspense fallback={<div className="text-white font-display uppercase tracking-widest animate-pulse">載入中...</div>}>
                <RegisterContent />
            </Suspense>
        </main>
    );
}
