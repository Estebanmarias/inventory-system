'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Hash, Palette, HardDrive, Tag, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Device {
  id: string
  imei: string | null
  serial_number: string | null
  color: string | null
  condition_grade: string | null
  stock_type: string
  status: string
  selling_price: number | null
  cost_price: number
  created_at: string
  products: {
    model_name: string
    storage_capacity: string | null
    brands: {
      name: string
      categories: { name: string }
    }
  } | null
}

interface Props {
  device: Device | null
  role: string
  onClose: () => void
}

const statusColors: Record<string, string> = {
  IN_STOCK: 'bg-green-500/20 text-green-400',
  WITH_RESELLER: 'bg-yellow-500/20 text-yellow-400',
  SOLD: 'bg-[#333] text-[#888]',
  RETURNED: 'bg-blue-500/20 text-blue-400',
  HOLDING: 'bg-purple-500/20 text-purple-400',
}

const stockTypeLabel: Record<string, string> = {
  NEW: 'Brand New',
  UK_USED: 'UK Used',
  TRADE_IN: 'Trade-In',
}

export default function DeviceDetailSheet({ device, role, onClose }: Props) {
  const router = useRouter()
  return (
    <AnimatePresence>
      {device && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 rounded-t-3xl z-50 p-6 pb-24 max-w-lg mx-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-lg">
                  {device.products?.brands?.name} {device.products?.model_name}
                </h2>
                <p className="text-[#888888] text-sm">
                  {device.products?.brands?.categories?.name} · {stockTypeLabel[device.stock_type]}
                </p>
              </div>
              <button onClick={onClose} className="text-[#555555] hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: HardDrive, label: 'Storage', value: device.products?.storage_capacity ?? '—' },
                { icon: Palette, label: 'Color', value: device.color ?? '—' },
                { icon: Tag, label: 'Grade', value: device.condition_grade ? `Grade ${device.condition_grade}` : 'N/A' },
                { icon: Smartphone, label: 'Stock Type', value: stockTypeLabel[device.stock_type] },
                { icon: Hash, label: 'IMEI', value: device.imei ?? '—' },
                { icon: Calendar, label: 'Added', value: new Date(device.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#1C1C1C] rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={12} className="text-[#555555]" />
                    <p className="text-[#888888] text-xs">{label}</p>
                  </div>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            {role === 'OWNER' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1C1C1C] rounded-2xl p-3">
                  <p className="text-[#888888] text-xs mb-1">Cost Price</p>
                  <p className="text-white text-sm font-bold">₦{Number(device.cost_price).toLocaleString()}</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-2xl p-3">
                  <p className="text-[#888888] text-xs mb-1">Selling Price</p>
                  <p className="text-white text-sm font-bold">
                    {device.selling_price ? `₦${Number(device.selling_price).toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[device.status]}`}>
                {device.status.replace('_', ' ')}
              </span>
              {device.status === 'IN_STOCK' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(`/checkout?deviceId=${device.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
                >
                  Sell Device
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}