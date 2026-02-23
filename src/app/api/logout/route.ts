import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
    const cookieStore = await cookies()

    // 建立 response 物件，稍後在上面清除 cookies
    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options ?? {})
                    })
                },
            },
        }
    )

    // server-side signOut：會觸發 onAuthStateChange(SIGNED_OUT)
    // createServerClient 的 listener 會呼叫 applyServerStorage → setAll → 清除 cookies
    await supabase.auth.signOut()

    // 額外保險：手動把所有 sb-* cookies 設為過期
    // 這能確保即使 signOut() 內部出錯，cookies 也一定被清除
    const allCookies = cookieStore.getAll()
    allCookies.forEach(({ name }) => {
        if (name.startsWith('sb-')) {
            response.cookies.set(name, '', {
                path: '/',
                maxAge: 0,
                sameSite: 'lax',
                httpOnly: false,
            })
        }
    })

    return response
}
