import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify the requester is an OWNER
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { full_name, email, password } = await req.json()
  if (!full_name || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  // Use service role client — bypasses email confirmation
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create auth user
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'STAFF' }
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Create profile
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: newUser.user.id,
    full_name,
    role: 'STAFF',
    can_delete: false,
  })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}