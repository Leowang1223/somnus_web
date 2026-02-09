'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'owner' | 'support' | 'consumer' | null;

type AuthContextType = {
    role: UserRole;
    user: User | null;
    login: (role: UserRole, redirectTo?: string) => void;
    logout: () => Promise<void>;
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
            setLoading(false);
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
                    console.log('Auth session restored - role:', userRole);
                    setRole(userRole);
                } else {
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                if (!isMountedRef.current) return;
                console.error('Error checking session:', error);
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMountedRef.current) return;

            console.log('Auth state changed:', event);

            if (session?.user) {
                setUser(session.user);
                const userRole = await fetchRole(session.user.id);
                if (!isMountedRef.current) return;
                console.log('Role after auth change:', userRole);
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

    const login = (newRole: UserRole, redirectTo?: string) => {
        setRole(newRole);

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
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setRole(null);
            setUser(null);
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{
            role,
            user,
            login,
            logout,
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
