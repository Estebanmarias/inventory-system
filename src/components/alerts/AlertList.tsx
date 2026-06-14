'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { AlertTriangle, Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'

export default function AlertList() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<any[]>([])
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [loading, setLoading] = useState(true)

  async function load() {
    // Trigger the overdue check first
    await fetch('/api/check-alerts')

    const { data } = await supabase
      .from('alerts')
      .select('*, reseller_pickups(id, reseller_id, resellers(full_name))')
      .order('created_at', { ascending: false })

    setAlerts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    await supabase.from('alerts').update({ is_read: true }).eq('is_read', false)
    load()
  }

  async function markRead(id: string) {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id)
    load()
  }

  const filtered = filter === 'UNREAD' ? alerts.filter(a => !a.is_read) : alerts
  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'UNREAD'] as const).map(f => (
            <motion.button key={f} whileTap={{ scale: 0.97 }} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === f ? 'bg-blue-500 text-white' : 'bg-[#1C1C1C] text-[#888888] border border-white/8'
              }`}>
              {f === 'ALL' ? 'All' : `Unread (${unreadCount})`}
            </motion.button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">{filter === 'UNREAD' ? 'No unread alerts' : 'No alerts yet'}</p>
          <p className="text-[#333333] text-xs mt-1">Alerts appear here when reseller devices go overdue</p>
        </div>
      ) : (
        filtered.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`border rounded-2xl p-4 ${alert.is_read ? 'bg-[#141414] border-white/8 opacity-60' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${alert.is_read ? 'bg-[#1C1C1C]' : 'bg-red-500/10'}`}>
                <AlertTriangle size={16} className={alert.is_read ? 'text-[#555555]' : 'text-red-400'} />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">{alert.message}</p>
                <p className="text-[#555555] text-xs mt-1">
                  {new Date(alert.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {alert.related_reseller_id && (
                    <Link href={`/resellers/${alert.related_reseller_id}`} className="text-blue-400 text-xs font-semibold">
                      View Reseller
                    </Link>
                  )}
                  {!alert.is_read && (
                    <button onClick={() => markRead(alert.id)} className="text-[#888888] text-xs font-semibold">
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}