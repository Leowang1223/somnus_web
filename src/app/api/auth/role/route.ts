import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ role: null })
        }

        const { data, error } = await supabase.rpc('get_my_role')
        if (error) {
            console.error('/api/auth/role: get_my_role error:', error.message)
            return NextResponse.json({ role: 'consumer' })
        }

        return NextResponse.json({ role: data || 'consumer' })
    } catch (e) {
        console.error('/api/auth/role: exception:', e)
        return NextResponse.json({ role: 'consumer' })
    }
}
