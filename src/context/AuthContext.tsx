'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'owner' | 'support' | 'consumer' | null;

type AuthContextType = {
    role: UserRole;
    user: User | null;
    login: (role: UserRole, redirectTo?: string) => Promise<void>;
    logout: () => Promise<void>;
    syncSession: (accessToken: string, refreshToken: string, redirectTo?: string) => Promise<void>;
    loginWithCredentials: (email: string, password: string, redirectTo?: string) => Promise<{ error: string | null }>;
    isAuthenticated: boolean;
    isOwner: boolean;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isMountedRef = useRef(true);

    // Create Supabase client once using useState to ensure it persists across renders
    const [supabase] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                // Check if required env vars exist
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    console.warn('⚠️ Supabase environment variables not configured. Auth features will be limited.');
                    return null;
                }
                return createClient();
            } catch (error) {
                console.error('Failed to create Supabase client:', error);
                return null;
            }
        }
        return null;
    });

    // Shared helper: fetch role from DB by user ID, with email fallback
    // Email fallback handles cases where public.users.id differs from auth UID
    const fetchRole = async (userId: string, userEmail?: string): Promise<UserRole> => {
        if (!supabase) return 'consumer';

        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single() as { data: { role: string } | null; error: any };

            if (!error && data?.role) {
                return data.role as UserRole;
            }

            // ID 查不到時，用 email 作為 fallback（帳號建立方式不同造成 ID 不一致時）
            if (userEmail) {
                const { data: emailData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', userEmail)
                    .single() as { data: { role: string } | null; error: any };
                if (emailData?.role) {
                    return emailData.role as UserRole;
                }
            }

            if (error) console.error('Error fetching role:', error.message);
            return 'consumer';
        } catch (error) {
            console.error('Exception fetching role:', error);
            return 'consumer';
        }
    };

    useEffect(() => {
        if (!supabase) {
            console.warn('⚠️ Supabase client not available. Running in limited mode.');
            setLoading(false);
            setUser(null);
            setRole(null);
            return;
        }

        isMountedRef.current = true;

        // 只用 onAuthStateChange（Supabase 官方推薦），避免與 getSession() 的競態條件
        // INITIAL_SESSION 事件取代 getSession() 的初始 session 偵測功能
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMountedRef.current) return;

            if (session?.user) {
                setUser(session.user);
                try {
                    const userRole = await fetchRole(session.user.id, session.user.email ?? undefined);
                    if (!isMountedRef.current) return;
                    setRole(userRole);
                } catch (roleError) {
                    console.error('onAuthStateChange: error fetching role:', roleError);
                    if (isMountedRef.current) setRole('consumer');
                }
            } else {
                setUser(null);
                setRole(null);
            }

            // INITIAL_SESSION 觸發時（無論有無 session），結束 loading 狀態
            if (event === 'INITIAL_SESSION') {
                if (isMountedRef.current) setLoading(false);
            }
        });

        return () => {
            isMountedRef.current = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    // loginWithCredentials：直接在 AuthContext 的 supabase 實例上登入
    // 用 window.location.href 硬跳轉，確保新頁面 mount 時 onAuthStateChange 重新偵測 session
    // router.push() 在 concurrent mode 下無法保證 setState 在渲染前完成，硬跳轉最可靠
    const loginWithCredentials = async (email: string, password: string, redirectTo?: string): Promise<{ error: string | null }> => {
        if (!supabase) return { error: 'Auth not available' };

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return { error: error.message };

        // 硬跳轉：強制完整頁面重載，AuthProvider 重新 mount，checkSession() 重新讀取 session
        window.location.href = redirectTo || '/';
        return { error: null };
    };

    // syncSession：在 AuthContext 自己的 supabase 實例上呼叫 setSession，
    // 確保 onAuthStateChange 正確觸發，user/role state 立即更新
    const syncSession = async (accessToken: string, refreshToken: string, redirectTo?: string) => {
        if (!supabase) return;
        try {
            const { data } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
            if (data.session?.user) {
                setUser(data.session.user);
                const userRole = await fetchRole(data.session.user.id, data.session.user.email ?? undefined);
                if (isMountedRef.current) setRole(userRole);
            }
        } catch (e) {
            console.error('syncSession error:', e);
        }
        if (redirectTo) {
            router.push(redirectTo);
            router.refresh();
        }
    };

    const login = async (newRole: UserRole, redirectTo?: string) => {
        setRole(newRole);

        // Fetch the real session from browser client (cookies set by server action)
        if (supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                }
            } catch (e) {
                // Session will be picked up by onAuthStateChange
            }
        }

        if (redirectTo) {
            router.push(redirectTo);
        } else if (newRole === 'owner' || newRole === 'support') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    };

    const logout = async () => {
        // 1. Browser-side signOut（立即清除 Supabase client session 狀態，觸發 SIGNED_OUT 事件）
        //    這確保即使 window.location.href 沒有觸發 reload，UI 也立即切換為未登入狀態
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error('Browser signOut error:', e);
            }
        }

        // 2. Server-side cleanup（清除 server-side session cookies）
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout API error:', error);
        }

        // 3. 清除 browser 端所有 sb-* cookies（保險措施）
        if (typeof document !== 'undefined') {
            document.cookie.split(';').forEach((c) => {
                const name = c.split('=')[0].trim();
                if (name.startsWith('sb-')) {
                    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
                }
            });
        }

        // 4. 清除 React state
        setRole(null);
        setUser(null);

        // 5. 硬跳轉：強制完整頁面重載，確保所有 session 狀態歸零
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{
            role,
            user,
            login,
            logout,
            syncSession,
            loginWithCredentials,
            isAuthenticated: !!user,
            isOwner: role === 'owner',
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
}
