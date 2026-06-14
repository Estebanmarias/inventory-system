import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ResellerDetail from '@/components/resellers/ResellerDetail'

export default async function ResellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reseller } = await supabase.from('resellers').select('*').eq('id', id).single()
  if (!reseller) notFound()

  return (
    <div>
      <Header title={reseller.full_name} />
      <ResellerDetail reseller={reseller} />
    </div>
  )
}