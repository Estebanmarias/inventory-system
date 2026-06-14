import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import AlertList from '@/components/alerts/AlertList'

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <Header title="Alerts" />
      <AlertList />
    </div>
  )
}