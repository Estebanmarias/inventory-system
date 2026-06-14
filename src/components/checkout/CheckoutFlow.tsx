'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSearchSelect from './DeviceSearchSelect'
import TransactionPanel from './TransactionPanel'

export default function CheckoutFlow() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const deviceId = searchParams.get('deviceId')
  const [device, setDevice] = useState<any | null>(null)
  const [loading, setLoading] = useState(!!deviceId)

  useEffect(() => {
    if (!deviceId) return
    async function load() {
      const { data } = await supabase
        .from('devices')
        .select(`*, products ( model_name, storage_capacity, brands ( name, categories ( name ) ) )`)
        .eq('id', deviceId)
        .single()
      setDevice(data)
      setLoading(false)
    }
    load()
  }, [deviceId])

  if (loading) {
    return <div className="px-4 py-6 text-[#555555] text-sm">Loading device...</div>
  }

  return (
    <div className="px-4 py-4">
      <AnimatePresence mode="wait">
        {!device ? (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[#888888] text-sm mb-4">Select a device to begin checkout.</p>
            <DeviceSearchSelect onSelect={setDevice} />
          </motion.div>
        ) : (
          <motion.div key="transaction" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TransactionPanel device={device} onBack={() => setDevice(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}