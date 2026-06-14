'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, ArrowLeftRight, MessageCircle } from 'lucide-react'

interface Props {
  device: any
  onBack: () => void
}

const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'POS', 'MIXED']

export default function TransactionPanel({ device, onBack }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isSwap, setIsSwap] = useState(false)
  const [salePrice, setSalePrice] = useState(device.selling_price?.toString() ?? '')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tradeIn, setTradeIn] = useState({ description: '', imei: '', condition_notes: '', value: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ invoiceId: string; finalAmount: number } | null>(null)

  const finalAmount = (parseFloat(salePrice) || 0) - (parseFloat(discount) || 0)
  const netAmount = isSwap ? finalAmount - (parseFloat(tradeIn.value) || 0) : finalAmount

  async function handleSubmit() {
    if (!salePrice) { setError('Sale price is required'); return }
    if (isSwap && (!tradeIn.description || !tradeIn.value)) {
      setError('Trade-in description and value are required for swaps')
      return
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    // Create or find customer
    let customerId: string | null = null
    if (customerPhone.trim()) {
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', customerPhone.trim()).maybeSingle()
      if (existing) {
        customerId = existing.id
      } else {
        const { data: newCustomer } = await supabase.from('customers').insert({ phone: customerPhone.trim() }).select('id').single()
        customerId = newCustomer?.id ?? null
      }
    }

    // Create invoice
    const { data: invoice, error: invError } = await supabase.from('invoices').insert({
      invoice_type: isSwap ? 'SWAP' : 'SALE',
      customer_id: customerId,
      staff_id: user?.id,
      total_amount: finalAmount,
      amount_paid: netAmount,
      payment_method: paymentMethod,
      notes: isSwap ? `Swap — trade-in value ₦${tradeIn.value}` : null,
    }).select('id').single()

    if (invError || !invoice) {
      setError(invError?.message ?? 'Failed to create invoice')
      setSaving(false)
      return
    }

    // Create invoice item
    const { error: itemError } = await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      device_id: device.id,
      sale_price: finalAmount,
      discount_applied: parseFloat(discount) || 0,
    })

    if (itemError) {
      setError(itemError.message)
      setSaving(false)
      return
    }

    // Update device status to SOLD
    const { error: deviceError } = await supabase.from('devices').update({ status: 'SOLD' }).eq('id', device.id)

    if (deviceError) {
      setError(deviceError.message)
      setSaving(false)
      return
    }

    // If swap, create trade_in record
    if (isSwap) {
      await supabase.from('trade_ins').insert({
        invoice_id: invoice.id,
        product_description: tradeIn.description,
        imei: tradeIn.imei || null,
        condition_notes: tradeIn.condition_notes || null,
        trade_in_value: parseFloat(tradeIn.value),
      })
    }

    setSuccess({ invoiceId: invoice.id, finalAmount })
    setSaving(false)
  }

  function sendWhatsAppReceipt() {
    const deviceName = `${device.products?.brands?.name} ${device.products?.model_name}`
    const message = encodeURIComponent(
      `Thank you for your purchase!\n\n` +
      `Item: ${deviceName}\n` +
      `Amount: ₦${finalAmount.toLocaleString()}\n` +
      `Payment: ${paymentMethod}\n\n` +
      `We appreciate your business.`
    )
    const phone = customerPhone.replace(/\D/g, '')
    const normalizedPhone = phone.startsWith('0') ? `234${phone.slice(1)}` : phone
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank')
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-10 space-y-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
          <CheckCircle size={64} className="text-green-400" />
        </motion.div>
        <p className="text-white text-xl font-bold">Sale Complete</p>
        <p className="text-[#888888] text-sm">
          {device.products?.brands?.name} {device.products?.model_name} — ₦{success.finalAmount.toLocaleString()}
        </p>

        {customerPhone && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={sendWhatsAppReceipt}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 font-semibold rounded-xl px-5 py-3 text-sm">
            <MessageCircle size={16} /> Send WhatsApp Receipt
          </motion.button>
        )}

        <div className="flex gap-3 w-full mt-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/inventory')}
            className="flex-1 border border-white/8 text-white font-semibold rounded-xl py-3 text-sm">
            View Inventory
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard')}
            className="flex-1 bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm">
            Dashboard
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Device summary */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-4">
        <p className="text-white font-semibold text-sm">{device.products?.brands?.name} {device.products?.model_name}</p>
        <p className="text-[#888888] text-xs mt-0.5">
          {device.products?.storage_capacity ?? '—'} · {device.color ?? '—'}
          {device.condition_grade ? ` · Grade ${device.condition_grade}` : ''}
        </p>
      </div>

      {/* Swap toggle */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsSwap(!isSwap)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors ${
          isSwap ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#141414] border-white/8'
        }`}
      >
        <div className="flex items-center gap-3">
          <ArrowLeftRight size={18} className={isSwap ? 'text-purple-400' : 'text-[#555555]'} />
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Swap Transaction</p>
            <p className="text-[#888888] text-xs">Customer is trading in a device</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isSwap ? 'bg-purple-500' : 'bg-[#333333]'}`}>
          <motion.div className="w-5 h-5 bg-white rounded-full" animate={{ x: isSwap ? 16 : 0 }} />
        </div>
      </motion.button>

      {/* Sale price + discount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Sale Price (₦) *</label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="0"
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Discount (₦)</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Payment Method</label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map(method => (
            <motion.button key={method} whileTap={{ scale: 0.95 }}
              onClick={() => setPaymentMethod(method)}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                paymentMethod === method ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
              }`}>
              {method}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Customer phone */}
      <div className="space-y-1.5">
        <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Customer Phone (optional)</label>
        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="08012345678"
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
        />
        <p className="text-[#555555] text-xs">For WhatsApp receipt</p>
      </div>

      {/* Trade-in panel */}
      <AnimatePresence>
        {isSwap && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-purple-300 text-sm font-semibold">Trade-In Details</p>

              <input
                value={tradeIn.description}
                onChange={(e) => setTradeIn(t => ({ ...t, description: e.target.value }))}
                placeholder="Device description (e.g. iPhone 12, 128GB, Black)"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-purple-500"
              />
              <input
                value={tradeIn.imei}
                onChange={(e) => setTradeIn(t => ({ ...t, imei: e.target.value }))}
                placeholder="IMEI (optional)"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-[#444444] outline-none focus:border-purple-500"
              />
              <textarea
                value={tradeIn.condition_notes}
                onChange={(e) => setTradeIn(t => ({ ...t, condition_notes: e.target.value }))}
                placeholder="Condition notes (e.g. minor scratches on back, screen good)"
                rows={2}
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-purple-500 resize-none"
              />
              <input
                type="number"
                value={tradeIn.value}
                onChange={(e) => setTradeIn(t => ({ ...t, value: e.target.value }))}
                placeholder="Trade-in value (₦) *"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-purple-500"
              />
              <p className="text-[#888888] text-xs">This device will go to Holding Stock for grading after submit.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-[#888888]">Sale Price</span>
          <span className="text-white">₦{(parseFloat(salePrice) || 0).toLocaleString()}</span>
        </div>
        {parseFloat(discount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#888888]">Discount</span>
            <span className="text-red-400">-₦{parseFloat(discount).toLocaleString()}</span>
          </div>
        )}
        {isSwap && parseFloat(tradeIn.value) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#888888]">Trade-In Value</span>
            <span className="text-purple-400">-₦{parseFloat(tradeIn.value).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/8">
          <span className="text-white">{isSwap ? 'Net Amount Due' : 'Total'}</span>
          <span className="text-green-400">₦{netAmount.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
          className="flex-1 border border-white/8 text-white font-semibold rounded-xl py-3 text-sm">
          Back
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
          className="flex-1 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
          {saving ? 'Processing...' : 'Complete Sale'}
        </motion.button>
      </div>
    </div>
  )
}