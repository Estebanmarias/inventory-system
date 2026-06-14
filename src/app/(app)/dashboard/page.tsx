import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import DashboardStats from '@/components/dashboard/DashboardStats'
import AlertBanner from '@/components/layout/AlertBanner'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  console.log('profile:', profile, 'error:', error)

  return (
    <div>
      <Header title="Stockr" />
      <div className="px-4 py-6 space-y-6">
        <div>
          <p className="text-[#888888] text-sm">Welcome back,</p>
          <p className="text-white text-lg font-semibold">
            {profile?.full_name ?? 'Unknown'}
          </p>
          <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider">
            {profile?.role ?? 'STAFF'}
          </span>
        </div>
        <AlertBanner />
        <DashboardStats role={profile?.role ?? 'STAFF'} userId={user.id} />
      </div>
    </div>
  )
}