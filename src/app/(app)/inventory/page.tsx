import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import DeviceList from '@/components/inventory/DeviceList'

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <Header title="Inventory" />
      <DeviceList role={profile?.role ?? 'STAFF'} />
    </div>
  )
}