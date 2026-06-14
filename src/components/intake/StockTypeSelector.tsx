'use client'

import { motion } from 'framer-motion'
import { Smartphone, PackageCheck, RefreshCw } from 'lucide-react'

interface Props {
  onSelect: (type: string) => void
}

const types = [
  {
    value: 'UK_USED',
    label: 'UK Used',
    description: 'Aftermarket device — use camera to scan About Phone screen',
    icon: Smartphone,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    value: 'NEW',
    label: 'Brand New',
    description: 'Sealed box device — scan barcode or enter details manually',
    icon: PackageCheck,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    value: 'TRADE_IN',
    label: 'Trade-In',
    description: 'Device received as part of a swap transaction',
    icon: RefreshCw,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

export default function StockTypeSelector({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-white font-semibold text-lg">What are you adding?</p>
        <p className="text-[#888888] text-sm mt-1">Select the type of stock to begin intake</p>
      </div>

      <div className="space-y-3 mt-6">
        {types.map((type, i) => {
          const Icon = type.icon
          return (
            <motion.button
              key={type.value}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(type.value)}
              className={`w-full bg-[#141414] border ${type.border} rounded-3xl p-5 text-left flex items-center gap-4 hover:border-white/20 transition-colors`}
            >
              <div className={`p-3 rounded-2xl ${type.bg}`}>
                <Icon size={24} className={type.color} />
              </div>
              <div>
                <p className="text-white font-semibold">{type.label}</p>
                <p className="text-[#888888] text-xs mt-0.5 leading-relaxed">{type.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}