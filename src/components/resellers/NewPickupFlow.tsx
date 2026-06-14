'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Plus, Minus } from 'lucide-react'

interface Props {
  resellerId: string
  onClose: () => void
  onCreated: () => void
}

export default function NewPickupFlow({ resellerId, onClose, onCreated }: Props) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<string, { paid: boolean; amount: string }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('devices')
        .select(`*, products ( model_name, storage_capacity, brands ( name ) )`)
        .eq('status', 'IN_STOCK')
        .order('created_at', { ascending: false })
      setDevices(data ?? [])
      setFiltered(data ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(devices); return }
    const q = search.toLowerCase()
    setFiltered(devices.filter(d =>
      d.products?.model_name?.toLowerCase().includes(q) ||
      d.products?.brands?.name?.toLowerCase().includes(q) ||
      d.imei?.includes(q)
    ))
  }, [search, devices])

  function toggleDevice(device: any) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[device.id]) {
        delete next[device.id]
      } else {
        next[device.id] = { paid: false, amount: device.selling_price?.toString() ?? '' }
      }
      return next
    })
  }

  function togglePaid(deviceId: string) {
    setSelected(prev => ({ ...prev, [deviceId]: { ...prev[deviceId], paid: !prev[deviceId].paid } }))
  }

  function setAmount(deviceId: string, amount: string) {
    setSelected(prev => ({ ...prev, [deviceId]: { ...prev[deviceId], amount } }))
  }

  async function handleSubmit() {
    const deviceIds = Object.keys(selected)
    if (deviceIds.length === 0) { setError('Select at least one device'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: pickup, error: pickupError } = await supabase.from('reseller_pickups').insert({
      reseller_id: resellerId,
      staff_id: user?.id,
    }).select('id').single()

    if (pickupError || !pickup) { setError(pickupError?.message ?? 'Failed to create pickup'); setSaving(false); return }

    const items = deviceIds.map(deviceId => ({
      pickup_id: pickup.id,
      device_id: deviceId,
      amount_paid: selected[deviceId].paid ? (parseFloat(selected[deviceId].amount) || 0) : 0,
      is_paid: selected[deviceId].paid,
    }))

    const { error: itemsError } = await supabase.from('reseller_pickup_items').insert(items)
    if (itemsError) { setError(itemsError.message); setSaving(false); return }

    // Update device statuses
    await supabase.from('devices').update({ status: 'WITH_RESELLER' }).in('id', deviceIds)

    onCreated()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 rounded-t-3xl z-50 p-6 pb-28 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-bold text-lg">New Pickup</p>
          <button onClick={onClose} className="text-[#555555] hover:text-white p-2"><X size={20} /></button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2 mb-4">
          {filtered.map(device => {
            const isSelected = !!selected[device.id]
            return (
              <div key={device.id} className={`border rounded-2xl p-3 transition-colors ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1C1C1C] border-white/8'}`}>
                <button onClick={() => toggleDevice(device)} className="w-full flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{device.products?.brands?.name} {device.products?.model_name}</p>
                    <p className="text-[#888888] text-xs">{device.products?.storage_capacity ?? '—'} · {device.color ?? '—'}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </button>

                {isSelected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-white/8 flex items-center gap-2 overflow-hidden">
                    <button onClick={() => togglePaid(device.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold ${selected[device.id].paid ? 'bg-green-500/20 text-green-400' : 'bg-[#141414] text-[#888888]'}`}>
                      {selected[device.id].paid ? 'Paid' : 'Mark as Paid'}
                    </button>
                    {selected[device.id].paid && (
                      <input
                        type="number"
                        value={selected[device.id].amount}
                        onChange={(e) => setAmount(device.id, e.target.value)}
                        placeholder="Amount"
                        className="flex-1 bg-[#141414] border border-white/8 rounded-lg px-3 py-2 text-white text-xs outline-none"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
          className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
          {saving ? 'Saving...' : `Create Pickup (${Object.keys(selected).length} device${Object.keys(selected).length !== 1 ? 's' : ''})`}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}