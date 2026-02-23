'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logoutAction } from '@/app/actions';
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

    // Shared helper: fetch role from DB by user ID (matches RLS policy: auth.uid() = id)
    const fetchRole = async (userId: string): Promise<UserRole> => {
        if (!supabase) return 'consumer';

        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single() as { data: { role: string } | null; error: any };

            if (error) {
                console.error('Error fetching role:', error.message);
                return 'consumer';
            }

            if (data?.role) {
                return data.role as UserRole;
            }

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

        // Check active session on mount
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMountedRef.current) return;

                if (session?.user) {
                    setUser(session.user);
                    const userRole = await fetchRole(session.user.id);
                    if (!isMountedRef.current) return;
                    setRole(userRole);
                } else {
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                if (!isMountedRef.current) return;
                console.error('Error checking session:', error);
                // Even on error, ensure we set loading to false
                setUser(null);
                setRole(null);
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMountedRef.current) return;

            if (session?.user) {
                setUser(session.user);
                const userRole = await fetchRole(session.user.id);
                if (!isMountedRef.current) return;
                setRole(userRole);
            } else {
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            isMountedRef.current = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    // loginWithCredentials：直接在 AuthContext 的 supabase 實例上登入
    // signInWithPassword 成功後，onAuthStateChange 自動觸發，setUser/setRole 自動更新
    const loginWithCredentials = async (email: string, password: string, redirectTo?: string): Promise<{ error: string | null }> => {
        if (!supabase) return { error: 'Auth not available' };

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return { error: error.message };

        // onAuthStateChange 會自動呼叫 setUser / setRole，不需要手動同步
        router.push(redirectTo || '/');
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
                const userRole = await fetchRole(data.session.user.id);
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
        try {
            // 1. Sign out from browser client (clears browser cookies)
            if (supabase) {
                await supabase.auth.signOut();
            }

            // 2. Sign out from server (clears server-side cookies)
            await logoutAction();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // 3. Clear client state
            setRole(null);
            setUser(null);
            // 4. Client-side navigation + force refresh
            router.push('/');
            router.refresh();
        }
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
