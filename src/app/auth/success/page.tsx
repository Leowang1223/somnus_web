'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthSuccess() {
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (hasRedirected.current) return;

        const initSession = async () => {
            console.log('🔄 Initializing session on client...');
            const supabase = createClient();

            try {
                // Force session refresh on client
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ Session error:', error);
                    hasRedirected.current = true;
                    router.push('/login?error=session_failed');
                    return;
                }

                if (session) {
                    console.log('✅ Session initialized on client for:', session.user.email);
                    hasRedirected.current = true;
                    // Redirect immediately
                    router.push('/');
                } else {
                    console.error('❌ No session found after OAuth');
                    hasRedirected.current = true;
                    router.push('/login?error=no_session');
                }
            } catch (error) {
                console.error('💥 Exception initializing session:', error);
                hasRedirected.current = true;
                router.push('/login?error=init_failed');
            }
        };

        initSession();
    }, []); // Empty dependency array - only run once

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d8aa5b] mx-auto mb-4"></div>
                <p className="text-sm text-gray-400 mt-4">Completing login...</p>
            </div>
        </div>
    );
}
