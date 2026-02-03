import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createClient()

        // Exchange code for session
        const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
            console.error('❌ Auth callback error:', sessionError)
            return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
        }

        if (session?.user) {
            // Check if user exists in our database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, email')
                .eq('email', session.user.email!)
                .single()

            if (userError || !userData) {
                // User doesn't exist in our database - create with 'consumer' role
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        email: session.user.email!,
                        role: 'consumer', // Default role for new users
                        full_name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
                    })

                if (insertError) {
                    console.error('❌ Failed to create user:', insertError)
                }
            }
        }
    }

    // Redirect to home page
    return NextResponse.redirect(`${requestUrl.origin}/`)
}
