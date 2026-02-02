'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'owner' | 'support' | 'consumer' | 'admin' | null;

type AuthContextType = {
    role: UserRole;
    login: (role: UserRole, redirectTo?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isOwner: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole>(null);
    const router = useRouter();

    useEffect(() => {
        const savedRole = localStorage.getItem('somnus-role') as UserRole;
        if (savedRole === 'admin') {
            // Legacy support: promote old 'admin' to 'owner'
            setRole('owner');
            localStorage.setItem('somnus-role', 'owner');
        } else if (savedRole) {
            setRole(savedRole);
        }
    }, []);

    const login = (newRole: UserRole, redirectTo?: string) => {
        setRole(newRole);
        if (newRole) localStorage.setItem('somnus-role', newRole);

        if (redirectTo) {
            router.push(redirectTo);
        } else if (newRole === 'owner' || newRole === 'admin' || newRole === 'support') {
            router.push('/admin');
        } else if (newRole === 'consumer') {
            router.push('/');
        }
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem('somnus-role');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ role, login, logout, isAuthenticated: !!role, isOwner: role === 'owner' || role === 'admin' }}>
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
