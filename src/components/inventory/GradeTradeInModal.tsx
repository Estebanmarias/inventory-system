'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle } from 'lucide-react'
import ProductSelector from '@/components/intake/ProductSelector'

const COLORS = ['Black', 'White', 'Gold', 'Silver', 'Blue', 'Purple', 'Red', 'Green', 'Pink', 'Yellow', 'Starlight', 'Midnight', 'Space Grey', 'Natural Titanium', 'Rose Gold']

interface Props {
  tradeIn: any
  onClose: () => void
  onGraded: () => void
}

export default function GradeTradeInModal({ tradeIn, onClose, onGraded }: Props) {
  const supabase = createClient()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [color, setColor] = useState('')
  const [grade, setGrade] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!selectedProduct || !grade) { setError('Select a product and grade'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: device, error: deviceError } = await supabase.from('devices').insert({
      product_id: selectedProduct.id,
      imei: tradeIn.imei || null,
      color: color || null,
      condition_grade: grade,
      stock_type: 'TRADE_IN',
      status: 'IN_STOCK',
      cost_price: tradeIn.trade_in_value,
      selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
      received_by: user?.id,
    }).select('id').single()

    if (deviceError || !device) { setError(deviceError?.message ?? 'Failed to create device'); setSaving(false); return }

    const { error: updateError } = await supabase.from('trade_ins').update({ assigned_device_id: device.id }).eq('id', tradeIn.id)
    if (updateError) { setError(updateError.message); setSaving(false); return }

    onGraded()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <motion.div key="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 rounded-t-3xl z-50 p-6 pb-28 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-bold text-lg">Grade Trade-In</p>
          <button onClick={onClose} className="text-[#555555] hover:text-white p-2"><X size={20} /></button>
        </div>

        <div className="bg-[#1C1C1C] rounded-2xl p-3 mb-4">
          <p className="text-white text-sm font-medium">{tradeIn.product_description}</p>
          {tradeIn.condition_notes && <p className="text-[#888888] text-xs mt-1">{tradeIn.condition_notes}</p>}
          {tradeIn.imei && <p className="text-[#555555] text-xs mt-1 font-mono">{tradeIn.imei}</p>}
          <p className="text-purple-400 text-xs mt-1 font-semibold">Trade-in value: ₦{Number(tradeIn.trade_in_value).toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Match to Product</label>
            <ProductSelector onSelect={setSelectedProduct} />
            {selectedProduct && (
              <p className="text-blue-400 text-xs">Selected: {selectedProduct.brands?.name} {selectedProduct.model_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => setColor(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    color === c ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
                  }`}>
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Assign Grade *</label>
            <div className="flex gap-3">
              {['A', 'B', 'C'].map(g => (
                <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => setGrade(g)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                    grade === g ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
                  }`}>
                  Grade {g}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Selling Price (₦)</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
            />
          </div>

          {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
            className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
            {saving ? 'Saving...' : 'Add to Inventory'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}