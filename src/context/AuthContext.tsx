'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // Create Supabase client once using useState to ensure it persists across renders
    const [supabase] = useState(() => {
        if (typeof window !== 'undefined') {
            console.log('🔧 Creating Supabase client...');
            try {
                const client = createClient();
                console.log('✅ Supabase client created successfully');
                return client;
            } catch (error) {
                console.error('❌ Failed to create Supabase client:', error);
                return null;
            }
        }
        console.log('⏭️ Skipping Supabase client creation (SSR)');
        return null;
    });

    useEffect(() => {
        console.log('🔍 AuthContext mounted, supabase client:', supabase ? 'EXISTS' : 'NULL');

        if (!supabase) {
            console.warn('⚠️ No Supabase client available');
            setLoading(false);
            return;
        }

        // Check active session on mount
        const checkSession = async () => {
            console.log('🔄 Checking session...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('📊 Session data:', session ? {
                    user_email: session.user?.email,
                    expires_at: session.expires_at
                } : 'NO SESSION');

                if (session?.user) {
                    console.log('👤 User found:', session.user.email);
                    setUser(session.user);

                    // Fetch role from database
                    console.log('🔍 Fetching role from database...');
                    const { data: userData, error: roleError } = await supabase
                        .from('users')
                        .select('role')
                        .eq('email', session.user.email!)
                        .single();

                    if (roleError) {
                        console.error('❌ Error fetching role:', roleError);
                    } else {
                        console.log('✅ User data from DB:', userData);
                        const userRole = (userData?.role as UserRole) || 'consumer';
                        console.log('👑 Setting role to:', userRole);
                        setRole(userRole);
                    }
                } else {
                    console.log('⚠️ No session found');
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                console.error('❌ Error checking session:', error);
            } finally {
                setLoading(false);
                console.log('✓ Session check complete');
            }
        };

        checkSession();

        // Listen for auth changes
        console.log('👂 Setting up auth state change listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 Auth state changed:', event, session ? {
                user_email: session.user?.email
            } : 'NO SESSION');

            if (session?.user) {
                console.log('👤 Setting user:', session.user.email);
                setUser(session.user);

                // Fetch role from database
                console.log('🔍 Fetching role after auth change...');
                const { data: userData, error: roleError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', session.user.email!)
                    .single();

                if (roleError) {
                    console.error('❌ Error fetching role:', roleError);
                } else {
                    const userRole = (userData?.role as UserRole) || 'consumer';
                    console.log('👑 Setting role to:', userRole);
                    setRole(userRole);
                }
            } else {
                console.log('🚪 User logged out or no session');
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const login = (newRole: UserRole, redirectTo?: string) => {
        // This is now just for navigation after server-side login
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
        if (supabase) {
            await supabase.auth.signOut();
        }
        setRole(null);
        setUser(null);
        router.push('/');
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
