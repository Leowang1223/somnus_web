import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Protect /admin routes: require authenticated user with admin role
        if (request.nextUrl.pathname.startsWith('/admin')) {
            if (!user) {
                const loginUrl = new URL('/login', request.url)
                loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
                return NextResponse.redirect(loginUrl)
            }

            // Check role via get_my_role() RPC（SECURITY DEFINER，繞過 RLS）
            // 能正確處理 public.users.id ≠ auth.uid() 的情況
            const { data: role } = await supabase.rpc('get_my_role')

            if (!role || !['owner', 'support'].includes(role as string)) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    } catch (e) {
        // getUser() 發生錯誤時（網路問題等），不觸發 _removeSession()，直接繼續
        console.error('Middleware auth check failed:', e)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
