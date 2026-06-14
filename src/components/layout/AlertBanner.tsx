'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'

export default function AlertBanner() {
  const supabase = createClient()
  const [count, setCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function load() {
      await fetch('/api/check-alerts')
      const { count } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('alert_type', 'RESELLER_OVERDUE')
        .eq('is_read', false)
      setCount(count ?? 0)
    }
    load()
  }, [])

  if (count === 0 || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-red-500/10">
          <AlertTriangle size={16} className="text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">
            {count} reseller alert{count !== 1 ? 's' : ''} need attention
          </p>
          <Link href="/alerts" className="text-red-400 text-xs font-semibold">View alerts</Link>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[#555555] hover:text-white p-1">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}