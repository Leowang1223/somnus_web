import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createClient()

        // Exchange code for session
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
    }

    // Redirect to home page
    return NextResponse.redirect(`${origin}/`)
}
