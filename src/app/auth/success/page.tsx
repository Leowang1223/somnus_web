'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthSuccess() {
    const router = useRouter();

    useEffect(() => {
        const initSession = async () => {
            console.log('🔄 Initializing session on client...');
            const supabase = createClient();

            try {
                // Force session refresh on client
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ Session error:', error);
                    router.push('/login?error=session_failed');
                    return;
                }

                if (session) {
                    console.log('✅ Session initialized on client for:', session.user.email);
                    // Give AuthContext time to initialize
                    setTimeout(() => {
                        router.push('/');
                    }, 500);
                } else {
                    console.error('❌ No session found after OAuth');
                    router.push('/login?error=no_session');
                }
            } catch (error) {
                console.error('💥 Exception initializing session:', error);
                router.push('/login?error=init_failed');
            }
        };

        initSession();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d8aa5b] mx-auto mb-4"></div>
                <p className="text-sm text-gray-400 mt-4">Completing login...</p>
            </div>
        </div>
    );
}
