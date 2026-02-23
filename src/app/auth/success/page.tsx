'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthSuccess() {
    const hasRedirected = useRef(false);

    useEffect(() => {
        const supabase = createClient();

        const doRedirect = () => {
            if (hasRedirected.current) return;
            hasRedirected.current = true;
            // 硬跳轉：確保 AuthContext 在首頁完整重新讀取 session
            window.location.href = '/';
        };

        // 監聽 SIGNED_IN 事件（OAuth 完成後觸發）
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                subscription.unsubscribe();
                doRedirect();
            }
        });

        // 快速路徑：session 已在 cookies 中，直接偵測到
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                subscription.unsubscribe();
                doRedirect();
            }
        });

        // 3 秒 fallback，避免卡在此頁
        const timer = setTimeout(() => {
            subscription.unsubscribe();
            doRedirect();
        }, 3000);

        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d8aa5b] mx-auto mb-4"></div>
                <p className="text-sm text-gray-400 mt-4">Verifying session...</p>
            </div>
        </div>
    );
}
