'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import NewResellerModal from './NewResellerModal'

export default function ResellerList() {
  const supabase = createClient()
  const [resellers, setResellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    const { data: resellersData } = await supabase.from('resellers').select('*').order('full_name')

    // For each reseller, get active pickup items count and outstanding debt
    const enriched = await Promise.all((resellersData ?? []).map(async (reseller) => {
      const { data: pickups } = await supabase
        .from('reseller_pickups')
        .select('id, picked_up_at, reseller_pickup_items(id, is_paid, device_id)')
        .eq('reseller_id', reseller.id)
        .is('returned_at', null)

      let activeDevices = 0
      let unpaidCount = 0
      let oldestPickup: string | null = null

      for (const pickup of pickups ?? []) {
        const items = pickup.reseller_pickup_items ?? []
        activeDevices += items.length
        unpaidCount += items.filter((i: any) => !i.is_paid).length
        if (!oldestPickup || pickup.picked_up_at < oldestPickup) oldestPickup = pickup.picked_up_at
      }

      const daysSince = oldestPickup ? Math.floor((Date.now() - new Date(oldestPickup).getTime()) / (1000 * 60 * 60 * 24)) : 0
      const overdue = daysSince > reseller.alert_threshold_days && activeDevices > 0

      return { ...reseller, activeDevices, unpaidCount, daysSince, overdue }
    }))

    setResellers(enriched)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="px-4 py-4 space-y-3">
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#1C1C1C] border border-white/8 text-blue-400 font-semibold rounded-xl py-3 text-sm">
        <Plus size={16} /> Add Reseller
      </motion.button>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : resellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">No resellers yet</p>
        </div>
      ) : (
        resellers.map((reseller, i) => (
          <Link key={reseller.id} href={`/resellers/${reseller.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#141414] border border-white/8 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-semibold">{reseller.full_name}</p>
                  {reseller.business_name && <p className="text-[#888888] text-xs">{reseller.business_name}</p>}
                </div>
                {reseller.overdue && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                    <AlertTriangle size={10} /> {reseller.daysSince}d
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[#888888] text-xs">
                  <span className="text-white font-semibold">{reseller.activeDevices}</span> with reseller
                </p>
                {reseller.unpaidCount > 0 && (
                  <p className="text-yellow-400 text-xs">
                    <span className="font-semibold">{reseller.unpaidCount}</span> unpaid
                  </p>
                )}
              </div>
            </motion.div>
          </Link>
        ))
      )}

      {showModal && <NewResellerModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  )
}