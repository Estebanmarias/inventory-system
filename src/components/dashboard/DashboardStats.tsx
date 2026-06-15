'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Package, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react'

interface Props {
  role: string
  userId: string
}

interface Stats {
  totalStock: number
  todayRevenue: number
  resellerDebt: number
  overdueCount: number
}

export default function DashboardStats({ role, userId }: Props) {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totalStock: 0,
    todayRevenue: 0,
    resellerDebt: 0,
    overdueCount: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [stockRes, revenueRes, debtRes, overdueRes, transactionsRes] = await Promise.all([
        supabase.from('devices').select('id', { count: 'exact' }).eq('status', 'IN_STOCK').neq('stock_type', 'TRADE_IN'),
        supabase.from('invoices').select('amount_paid').gte('created_at', today.toISOString()),
        supabase.from('reseller_pickup_items').select('amount_paid, is_paid').eq('is_paid', false),
        supabase.from('alerts').select('id', { count: 'exact' }).eq('alert_type', 'RESELLER_OVERDUE').eq('is_read', false),
        supabase.from('invoices').select('id, invoice_type, amount_paid, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      const todayRevenue = (revenueRes.data ?? []).reduce((sum, i) => sum + Number(i.amount_paid), 0)
      const resellerDebt = debtRes.count ?? 0
      

      setStats({
        totalStock: stockRes.count ?? 0,
        todayRevenue,
        resellerDebt: debtRes.count ?? 0,
        overdueCount: overdueRes.count ?? 0,
      })
      setRecentTransactions(transactionsRes.data ?? [])
      setLoading(false)
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Total In Stock',
      value: stats.totalStock,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      format: 'number',
    },
    {
      label: "Today's Revenue",
      value: stats.todayRevenue,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      format: 'currency',
      ownerOnly: true,
    },
    {
      label: 'Unpaid Reseller Items',
      value: stats.resellerDebt,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      format: 'number',
    },
    {
      label: 'Overdue Alerts',
      value: stats.overdueCount,
      icon: Clock,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      format: 'number',
    },
  ]

  const visibleCards = statCards.filter(c => !c.ownerOnly || role === 'OWNER')

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#141414] border border-white/8 rounded-3xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {visibleCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#141414] border border-white/8 rounded-3xl p-4"
            >
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
                <Icon size={16} className={card.color} />
              </div>
              <p className="text-white text-2xl font-bold">
                {card.format === 'currency'
                  ? `₦${card.value.toLocaleString()}`
                  : card.value}
              </p>
              <p className="text-[#888888] text-xs mt-1">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#141414] border border-white/8 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Recent Transactions</h2>
          <ArrowRight size={16} className="text-[#555555]" />
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-[#555555] text-sm text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium capitalize">{tx.invoice_type.toLowerCase()}</p>
                  <p className="text-[#888888] text-xs">
                    {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {role === 'OWNER' && (
                  <p className="text-green-400 text-sm font-semibold">
                    ₦{Number(tx.amount_paid).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}