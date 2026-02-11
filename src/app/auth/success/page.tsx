'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthSuccess() {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (hasRedirected.current) return;

        // If context says we're authenticated, redirect immediately
        if (!loading && isAuthenticated) {
            console.log('✅ Auth confirmed by Context, redirecting...');
            hasRedirected.current = true;
            router.push('/');
            return;
        }

        // Safety timeout - if technically "loading" stuck or auth never confirms despite being here
        const timer = setTimeout(() => {
            if (!hasRedirected.current) {
                console.log('⚠️ Auth check timeout in success page, redirecting anyway to check at root...');
                hasRedirected.current = true;
                router.push('/');
            }
        }, 4000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d8aa5b] mx-auto mb-4"></div>
                <p className="text-sm text-gray-400 mt-4">Verifying session...</p>
            </div>
        </div>
    );
}
