'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import StockTypeSelector from '@/components/intake/StockTypeSelector'
import UKUsedIntake from '@/components/intake/UKUsedIntake'
import NewDeviceIntake from '@/components/intake/NewDeviceIntake'

export default function IntakePage() {
  const router = useRouter()
  const [stockType, setStockType] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/8 px-4 py-4 z-40">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => stockType ? setStockType(null) : router.back()}
            className="text-[#555555] hover:text-white p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white text-lg font-bold">
            {stockType ? `New ${stockType === 'NEW' ? 'Brand New' : stockType === 'UK_USED' ? 'UK Used' : 'Trade-In'} Device` : 'Add Stock'}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!stockType && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <StockTypeSelector onSelect={setStockType} />
            </motion.div>
          )}

          {stockType === 'UK_USED' && (
            <motion.div
              key="uk-used"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <UKUsedIntake />
            </motion.div>
          )}

          {stockType === 'NEW' && (
            <motion.div
              key="new-device"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <NewDeviceIntake />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}