import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (!code) {
        return NextResponse.redirect(`${origin}/`)
    }

    // ① 先建立 redirect response，後續把 session cookies 直接寫在這個物件上
    //    這樣可確保 Set-Cookie headers 一定出現在 302 redirect response 中
    //    （使用 cookieStore.set() 的方式在某些 Next.js 15 版本中不會被包進 redirect response）
    const response = NextResponse.redirect(`${origin}/auth/success`)

    // ② createServerClient：getAll 讀取 request cookies（含 PKCE code verifier）
    //    setAll 直接寫進 response.cookies，確保 browser 收到 session tokens
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options ?? {})
                    })
                },
            },
        }
    )

    // Exchange code for session（PKCE flow：使用 code_verifier cookie 換取 tokens）
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('❌ Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.session?.user) {
        const user = data.session.user
        console.log('✅ User logged in:', user.email)

        // Check if user exists in our database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', user.email!)
            .single()

        if (userError || !userData) {
            console.log('📝 Creating new user in database:', user.email)
            // User doesn't exist - create with consumer role
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email!,
                    role: 'consumer',
                    name: user.user_metadata?.full_name || user.email!.split('@')[0],
                })

            if (insertError) {
                console.error('❌ Failed to create user:', insertError)
            }
        } else {
            console.log('✅ User found in database:', userData.email, 'Role:', userData.role)
        }
    }

    // ③ 回傳含 Set-Cookie headers 的 redirect response
    //    browser 收到後會存入 sb-* cookies，讓 client-side getSession() 可以讀取
    return response
}
