import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ResellerList from '@/components/resellers/ResellerList'

export default async function ResellersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <Header title="Resellers" />
      <ResellerList />
    </div>
  )
}