'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Phone, Building2, Clock, CheckCircle, RotateCcw } from 'lucide-react'
import NewPickupFlow from './NewPickupFlow'

interface Props {
  reseller: any
}

export default function ResellerDetail({ reseller }: Props) {
  const supabase = createClient()
  const [pickups, setPickups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('reseller_pickups')
      .select(`*, reseller_pickup_items ( id, amount_paid, is_paid, device_id, devices ( imei, products ( model_name, storage_capacity, brands ( name ) ) ) )`)
      .eq('reseller_id', reseller.id)
      .order('picked_up_at', { ascending: false })
    setPickups(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markItemPaid(itemId: string) {
    await supabase.from('reseller_pickup_items').update({ is_paid: true }).eq('id', itemId)
    load()
  }

  async function returnDevice(itemId: string, deviceId: string, pickupId: string) {
    await supabase.from('devices').update({ status: 'IN_STOCK' }).eq('id', deviceId)

    // Check if all items in pickup are resolved (paid or returned) to set returned_at
    const { data: items } = await supabase.from('reseller_pickup_items').select('id, devices(status)').eq('pickup_id', pickupId)
    const { data: device } = await supabase.from('devices').select('status').eq('id', deviceId).single()

    // Remove this item from active tracking by marking pickup returned if it was the only device
    const pickup = pickups.find(p => p.id === pickupId)
    const remainingActive = (pickup?.reseller_pickup_items ?? []).filter((i: any) => i.id !== itemId && i.devices)

    if (remainingActive.length === 0) {
      await supabase.from('reseller_pickups').update({ returned_at: new Date().toISOString() }).eq('id', pickupId)
    }

    load()
  }

  const activePickups = pickups.filter(p => !p.returned_at)
  const pastPickups = pickups.filter(p => p.returned_at)

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Reseller info */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={14} className="text-[#555555]" />
          <span className="text-white">{reseller.phone}</span>
        </div>
        {reseller.business_name && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-[#555555]" />
            <span className="text-white">{reseller.business_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-[#555555]" />
          <span className="text-[#888888]">Alert after {reseller.alert_threshold_days} days</span>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm">
        <Plus size={16} /> New Pickup
      </motion.button>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {activePickups.length > 0 && (
            <div className="space-y-3">
              <p className="text-white font-semibold text-sm">Active Pickups</p>
              {activePickups.map((pickup, i) => {
                const daysSince = Math.floor((Date.now() - new Date(pickup.picked_up_at).getTime()) / (1000 * 60 * 60 * 24))
                const overdue = daysSince > reseller.alert_threshold_days

                return (
                  <motion.div key={pickup.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-[#141414] border border-white/8 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#888888] text-xs">
                        {new Date(pickup.picked_up_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${overdue ? 'bg-red-500/20 text-red-400' : 'bg-[#1C1C1C] text-[#888888]'}`}>
                        {daysSince} day{daysSince !== 1 ? 's' : ''} ago
                      </span>
                    </div>

                    {(pickup.reseller_pickup_items ?? []).filter((item: any) => item.devices).map((item: any) => (
                      <div key={item.id} className="bg-[#1C1C1C] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {item.devices?.products?.brands?.name} {item.devices?.products?.model_name}
                          </p>
                          <p className="text-[#888888] text-xs">{item.devices?.products?.storage_capacity ?? '—'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_paid ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              <CheckCircle size={10} /> Paid
                            </span>
                          ) : (
                            <button onClick={() => markItemPaid(item.id)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                              Mark Paid
                            </button>
                          )}
                          <button onClick={() => returnDevice(item.id, item.device_id, pickup.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            <RotateCcw size={10} /> Return
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )
              })}
            </div>
          )}

          {pastPickups.length > 0 && (
            <div className="space-y-3">
              <p className="text-white font-semibold text-sm">History</p>
              {pastPickups.map(pickup => (
                <div key={pickup.id} className="bg-[#141414] border border-white/8 rounded-2xl p-3 opacity-60">
                  <p className="text-[#888888] text-xs">
                    {new Date(pickup.picked_up_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(pickup.returned_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activePickups.length === 0 && pastPickups.length === 0 && (
            <p className="text-[#555555] text-sm text-center py-8">No pickups yet</p>
          )}
        </>
      )}

      {showModal && <NewPickupFlow resellerId={reseller.id} onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  )
}