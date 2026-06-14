import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import SettingsTabs from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'OWNER') {
    return (
      <div>
        <Header title="Settings" />
        <div className="px-4 py-10 text-center">
          <p className="text-[#888888] text-sm">Only the store owner can access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Settings" />
      <SettingsTabs />
    </div>
  )
}