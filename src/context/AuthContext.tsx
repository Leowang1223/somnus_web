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
    const supabase = createClient();

    useEffect(() => {
        // Check active session on mount
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);

                    // Fetch role from database
                    const { data: userData } = await supabase
                        .from('users')
                        .select('role')
                        .eq('email', session.user.email!)
                        .single();

                    setRole((userData?.role as UserRole) || 'consumer');
                } else {
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (session?.user) {
                setUser(session.user);

                // Fetch role from database
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', session.user.email!)
                    .single();

                setRole((userData?.role as UserRole) || 'consumer');
            } else {
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
        await supabase.auth.signOut();
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
