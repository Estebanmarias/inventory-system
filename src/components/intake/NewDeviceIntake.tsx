'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ProductSelector from './ProductSelector'
import { useRouter } from 'next/navigation'

const COLORS = ['Black', 'White', 'Gold', 'Silver', 'Blue', 'Purple', 'Red', 'Green', 'Pink', 'Yellow', 'Starlight', 'Midnight', 'Space Grey', 'Natural Titanium', 'Rose Gold']

export default function NewDeviceIntake() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<'product' | 'details' | 'success'>('product')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [form, setForm] = useState({
    color: '', cost_price: '', selling_price: '', imei: '', serial_number: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!selectedProduct) { setError('Select a product'); return }
    if (!form.cost_price) { setError('Cost price is required'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from('devices').insert({
      product_id: selectedProduct.id,
      imei: form.imei || null,
      serial_number: form.serial_number || null,
      color: form.color || null,
      condition_grade: null,
      stock_type: 'NEW',
      status: 'IN_STOCK',
      cost_price: parseFloat(form.cost_price),
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      received_by: user?.id,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }
    setStep('success')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {step === 'product' && (
          <motion.div key="product" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-[#888888] text-sm">Search for an existing product or create a new one.</p>
            <ProductSelector onSelect={(p) => { setSelectedProduct(p); setStep('details') }} />
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-white font-semibold">{selectedProduct?.brands?.name} {selectedProduct?.model_name}</p>

            <div className="space-y-2">
              <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <motion.button key={color} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.color === color ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
                    }`}>
                    {color}
                  </motion.button>
                ))}
              </div>
            </div>

            {['imei', 'serial_number', 'cost_price', 'selling_price'].map(field => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">
                  {field === 'cost_price' ? 'Cost Price (₦) *' : field === 'selling_price' ? 'Selling Price (₦)' : field === 'imei' ? 'IMEI (optional)' : 'Serial Number (optional)'}
                </label>
                <input
                  type={field.includes('price') ? 'number' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field.includes('price') ? '0' : ''}
                  className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
                />
              </div>
            ))}

            {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
              className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
              {saving ? 'Saving...' : 'Add to Inventory'}
            </motion.button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-10 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <CheckCircle size={64} className="text-green-400" />
            </motion.div>
            <p className="text-white text-xl font-bold">Device Added</p>
            <p className="text-[#888888] text-sm">{selectedProduct?.brands?.name} {selectedProduct?.model_name} is now in stock.</p>
            <div className="flex gap-3 w-full mt-4">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { setStep('product'); setForm({ color: '', cost_price: '', selling_price: '', imei: '', serial_number: '' }); setSelectedProduct(null) }}
                className="flex-1 border border-white/8 text-white font-semibold rounded-xl py-3 text-sm">
                Add Another
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/inventory')}
                className="flex-1 bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm">
                View Inventory
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}