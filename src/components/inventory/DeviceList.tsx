'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Smartphone } from 'lucide-react'
import FilterChips from './FilterChips'
import DeviceDetailSheet from './DeviceDetailSheet'
import Link from 'next/link'

interface Props {
  role: string
}

const statusColors: Record<string, string> = {
  IN_STOCK: 'bg-green-500/20 text-green-400',
  WITH_RESELLER: 'bg-yellow-500/20 text-yellow-400',
  SOLD: 'bg-[#333] text-[#888888]',
  RETURNED: 'bg-blue-500/20 text-blue-400',
  HOLDING: 'bg-purple-500/20 text-purple-400',
}

export default function DeviceList({ role }: Props) {
  const supabase = createClient()
  const [devices, setDevices] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('ALL')
  const [activeGrade, setActiveGrade] = useState('ALL')
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDevices() {
      const { data } = await supabase
        .from('devices')
        .select(`
          *,
          products (
            model_name,
            storage_capacity,
            brands (
              name,
              categories ( name )
            )
          )
        `)
        .order('created_at', { ascending: false })

      setDevices(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    }
    fetchDevices()
  }, [])

  useEffect(() => {
    let result = [...devices]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.products?.model_name?.toLowerCase().includes(q) ||
        d.products?.brands?.name?.toLowerCase().includes(q) ||
        d.imei?.includes(q) ||
        d.serial_number?.toLowerCase().includes(q)
      )
    }

    if (activeType !== 'ALL') result = result.filter(d => d.stock_type === activeType)
    if (activeGrade !== 'ALL') result = result.filter(d => d.condition_grade === activeGrade)
    if (activeStatus !== 'ALL') result = result.filter(d => d.status === activeStatus)

    setFiltered(result)
  }, [search, activeType, activeGrade, activeStatus, devices])

  return (
    <div className="px-4 py-4 space-y-4">

    {/* Holding stock link */}
      <Link href="/inventory/holding">
        <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/20 rounded-2xl px-4 py-3">
          <p className="text-purple-300 text-sm font-medium">Holding Stock (Trade-Ins)</p>
          <span className="text-purple-400 text-xs">View →</span>
        </div>
      </Link>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          type="text"
          placeholder="Search model, IMEI, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Filters */}
      <FilterChips
        activeType={activeType}
        activeGrade={activeGrade}
        activeStatus={activeStatus}
        onTypeChange={setActiveType}
        onGradeChange={setActiveGrade}
        onStatusChange={setActiveStatus}
      />

      {/* Count */}
      <p className="text-[#555555] text-xs">{filtered.length} device{filtered.length !== 1 ? 's' : ''}</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Smartphone size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">No devices found</p>
          <p className="text-[#333333] text-xs mt-1">Try adjusting your filters or add new stock</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(device)}
                className="bg-[#141414] border border-white/8 rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {device.products?.brands?.name} {device.products?.model_name}
                    </p>
                    <p className="text-[#888888] text-xs mt-0.5">
                      {device.products?.storage_capacity ?? '—'} · {device.color ?? '—'}
                      {device.condition_grade ? ` · Grade ${device.condition_grade}` : ''}
                    </p>
                    {device.imei && (
                      <p className="text-[#555555] text-xs mt-0.5 font-mono">{device.imei}</p>
                    )}
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColors[device.status]}`}>
                      {device.status.replace('_', ' ')}
                    </span>
                    {role === 'OWNER' && device.selling_price && (
                      <p className="text-white text-xs font-bold">₦{Number(device.selling_price).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* FAB */}
      <Link href="/intake">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-blue-500/25 z-40"
        >
          <Plus size={24} />
        </motion.button>
      </Link>

      <DeviceDetailSheet device={selected} role={role} onClose={() => setSelected(null)} />
    </div>
  )
}