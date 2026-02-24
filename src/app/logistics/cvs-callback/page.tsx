'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CVSCallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');

    useEffect(() => {
        const storeId      = searchParams.get('store_id')      || '';
        const storeName    = searchParams.get('store_name')     || '';
        const storeAddress = searchParams.get('store_address')  || '';
        const subType      = searchParams.get('sub_type')       || 'UNIMART';
        const displayType  = searchParams.get('display_type')   || '711';

        if (!storeId) {
            setStatus('error');
            return;
        }

        const store = { storeId, storeName, storeAddress, subType, displayType };

        // 傳送門市資訊給開啟此 popup 的父視窗
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'CVS_STORE_SELECTED', store }, '*');
            setStatus('done');
            // 稍後自動關閉
            setTimeout(() => window.close(), 800);
        } else {
            // 若無 opener（直接開啟），顯示資訊
            setStatus('done');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <div className="text-center space-y-4">
                {status === 'processing' && (
                    <>
                        <div className="w-10 h-10 border-2 border-[#d8aa5b] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-gray-400 text-sm">正在回傳門市資訊...</p>
                    </>
                )}
                {status === 'done' && (
                    <>
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-white font-display tracking-widest">門市已選擇</p>
                        <p className="text-gray-500 text-xs">此視窗即將關閉</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <p className="text-red-400">門市資訊不完整，請重新選擇</p>
                        <button onClick={() => window.close()} className="text-xs text-gray-500 underline">關閉</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CVSCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#d8aa5b] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CVSCallbackContent />
        </Suspense>
    );
}
