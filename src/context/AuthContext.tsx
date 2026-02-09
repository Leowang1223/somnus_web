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

        let isMounted = true; // ← Prevent state updates after unmount

        // Check active session on mount
        const checkSession = async () => {
            if (!isMounted) return; // ← Skip if unmounted

            console.log('🔄 Checking session...');
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return; // ← Check again after async operation

                console.log('📊 Session data:', session ? {
                    user_email: session.user?.email,
                    expires_at: session.expires_at
                } : 'NO SESSION');

                if (session?.user) {
                    console.log('👤 User found:', session.user.email);
                    setUser(session.user);

                    // Fetch role from database with error handling
                    try {
                        console.log('🔍 Fetching role from database...');
                        const { data: userData, error: roleError } = await supabase
                            .from('users')
                            .select('role')
                            .eq('email', session.user.email!)
                            .single();

                        if (!isMounted) return; // ← Check after role fetch

                        console.log('📦 Query result - Data:', userData, 'Error:', roleError);

                        if (roleError) {
                            console.error('❌ Error fetching role:', roleError);
                            console.warn('⚠️ Setting default role: consumer (due to error)');
                            setRole('consumer');
                        } else if (userData && userData.role) {
                            console.log('✅ User data from DB:', userData);
                            const userRole = userData.role as UserRole;
                            console.log('👑 Setting role to:', userRole);
                            setRole(userRole);
                        } else {
                            console.warn('⚠️ No user data found, setting default role: consumer');
                            setRole('consumer');
                        }
                    } catch (error) {
                        if (!isMounted) return; // ← Ignore errors if unmounted
                        console.error('💥 Exception while fetching role:', error);
                        console.warn('⚠️ Setting default role: consumer (due to exception)');
                        setRole('consumer');
                    }
                } else {
                    console.log('⚠️ No session found');
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                if (!isMounted) {
                    console.log('⏭️ Ignoring session check error - component unmounted');
                    return;
                }
                console.error('❌ Error checking session:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    console.log('✓ Session check complete');
                }
            }
        };

        checkSession();

        // Listen for auth changes
        console.log('👂 Setting up auth state change listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return; // ← Check mounted state in listener

            console.log('🔔 Auth state changed:', event, session ? {
                user_email: session.user?.email
            } : 'NO SESSION');


            if (session?.user) {
                console.log('👤 Setting user:', session.user.email);
                setUser(session.user);

                // Fetch role from database with error handling
                try {
                    console.log('🔍 Fetching role after auth change...');
                    const { data: userData, error: roleError } = await supabase
                        .from('users')
                        .select('role')
                        .eq('email', session.user.email!)
                        .single();

                    if (!isMounted) return; // ← Check after async

                    console.log('📦 Query result - Data:', userData, 'Error:', roleError);

                    if (roleError) {
                        console.error('❌ Error fetching role:', roleError);
                        console.warn('⚠️ Setting default role: consumer (due to error)');
                        setRole('consumer');
                    } else if (userData && userData.role) {
                        const userRole = userData.role as UserRole;
                        console.log('👑 Setting role to:', userRole);
                        setRole(userRole);
                    } else {
                        console.warn('⚠️ No user data found, setting default role: consumer');
                        setRole('consumer');
                    }
                } catch (error) {
                    if (!isMounted) return;
                    console.error('💥 Exception while fetching role:', error);
                    console.warn('⚠️ Setting default role: consumer (due to exception)');
                    setRole('consumer');
                }
            } else {
                console.log('🚪 User logged out or no session');
                setUser(null);
                setRole(null);
            }
        });

        return () => {
            isMounted = false; // ← Set flag BEFORE cleanup
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
        try {
            if (supabase) {
                console.log('🚪 Logging out...');
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('❌ Logout error:', error);
                } else {
                    console.log('✅ Logged out successfully');
                }
            } else {
                console.warn('⚠️ No Supabase client available for logout');
            }
        } catch (error) {
            console.error('💥 Exception during logout:', error);
        } finally {
            // Always clear local state regardless of Supabase signOut result
            // Always clear local state regardless of Supabase signOut result
            console.log('🧹 Clearing local auth state');
            setRole(null);
            setUser(null);
            // Force hard reload to clear all server/client state
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
