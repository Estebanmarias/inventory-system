'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Inbox, RefreshCw } from 'lucide-react'
import GradeTradeInModal from './GradeTradeInModal'

export default function HoldingStockList() {
  const supabase = createClient()
  const [tradeIns, setTradeIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  async function load() {
    const { data } = await supabase
      .from('trade_ins')
      .select('*')
      .is('assigned_device_id', null)
      .order('created_at', { ascending: false })
    setTradeIns(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-[#888888] text-sm">Trade-in devices awaiting inspection and grading.</p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : tradeIns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">No items awaiting grading</p>
        </div>
      ) : (
        tradeIns.map((tradeIn, i) => (
          <motion.div key={tradeIn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#141414] border border-purple-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <RefreshCw size={16} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{tradeIn.product_description}</p>
                {tradeIn.condition_notes && <p className="text-[#888888] text-xs mt-1">{tradeIn.condition_notes}</p>}
                {tradeIn.imei && <p className="text-[#555555] text-xs mt-1 font-mono">{tradeIn.imei}</p>}
                <p className="text-purple-400 text-xs mt-1 font-semibold">
                  Trade-in value: ₦{Number(tradeIn.trade_in_value).toLocaleString()}
                </p>
                <p className="text-[#555555] text-xs mt-1">
                  {new Date(tradeIn.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSelected(tradeIn)}
              className="w-full bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm">
              Assign Grade & Add to Inventory
            </motion.button>
          </motion.div>
        ))
      )}

      {selected && <GradeTradeInModal tradeIn={selected} onClose={() => setSelected(null)} onGraded={load} />}
    </div>
  )
}