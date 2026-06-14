import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import HoldingStockList from '@/components/inventory/HoldingStockList'

export default async function HoldingStockPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <Header title="Holding Stock" />
      <HoldingStockList />
    </div>
  )
}