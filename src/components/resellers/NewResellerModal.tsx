'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewResellerModal({ onClose, onCreated }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState({ full_name: '', phone: '', business_name: '', alert_threshold_days: '7' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.full_name.trim() || !form.phone.trim()) { setError('Name and phone are required'); return }
    setSaving(true)
    setError('')

    const { error } = await supabase.from('resellers').insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      business_name: form.business_name.trim() || null,
      alert_threshold_days: parseInt(form.alert_threshold_days) || 7,
    })

    if (error) { setError(error.message); setSaving(false); return }
    onCreated()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 rounded-t-3xl z-50 p-6 pb-28 max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <p className="text-white font-bold text-lg">New Reseller</p>
          <button onClick={onClose} className="text-[#555555] hover:text-white p-2"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <input
            value={form.full_name}
            onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Full name *"
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Phone number *"
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
          <input
            value={form.business_name}
            onChange={(e) => setForm(f => ({ ...f, business_name: e.target.value }))}
            placeholder="Business name (optional)"
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
          <div className="space-y-1.5">
            <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Alert Threshold (days)</label>
            <input
              type="number"
              value={form.alert_threshold_days}
              onChange={(e) => setForm(f => ({ ...f, alert_threshold_days: e.target.value }))}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
            {saving ? 'Saving...' : 'Add Reseller'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}