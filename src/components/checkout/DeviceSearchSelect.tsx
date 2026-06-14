'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  onSelect: (device: any) => void
}

export default function DeviceSearchSelect({ onSelect }: Props) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('devices')
        .select(`*, products ( model_name, storage_capacity, brands ( name, categories ( name ) ) )`)
        .eq('status', 'IN_STOCK')
        .order('created_at', { ascending: false })
      setDevices(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(devices); return }
    const q = search.toLowerCase()
    setFiltered(devices.filter(d =>
      d.products?.model_name?.toLowerCase().includes(q) ||
      d.products?.brands?.name?.toLowerCase().includes(q) ||
      d.imei?.includes(q) ||
      d.serial_number?.toLowerCase().includes(q)
    ))
  }, [search, devices])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          type="text"
          placeholder="Search model, IMEI, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[#555555] text-sm text-center py-8">No in-stock devices found</p>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map((device, i) => (
            <motion.button
              key={device.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(device)}
              className="w-full bg-[#141414] border border-white/8 rounded-2xl p-3 text-left flex items-center justify-between"
            >
              <div>
                <p className="text-white text-sm font-semibold">
                  {device.products?.brands?.name} {device.products?.model_name}
                </p>
                <p className="text-[#888888] text-xs mt-0.5">
                  {device.products?.storage_capacity ?? '—'} · {device.color ?? '—'}
                  {device.condition_grade ? ` · Grade ${device.condition_grade}` : ''}
                </p>
              </div>
              {device.selling_price && (
                <p className="text-blue-400 text-sm font-bold">₦{Number(device.selling_price).toLocaleString()}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}