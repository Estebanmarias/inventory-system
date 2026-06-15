'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, MessageCircle } from 'lucide-react'

interface Props {
  role: string
}

export default function InvoiceList({ role }: Props) {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('invoices')
        .select(`
          id, invoice_type, amount_paid, total_amount, payment_method, notes, created_at,
          customers ( full_name, phone ),
          resellers ( full_name, phone ),
          profiles ( full_name ),
          invoice_items (
            sale_price, discount_applied,
            devices ( imei, serial_number, color, condition_grade, stock_type,
              products ( model_name, storage_capacity, brands ( name ) )
            )
          )
        `)
        .order('created_at', { ascending: false })
      setInvoices(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'ALL' ? invoices : invoices.filter(i => i.invoice_type === filter)

  function sendWhatsAppReceipt(invoice: any) {
    const phone = invoice.customers?.phone ?? ''
    const items = invoice.invoice_items ?? []
    const itemLines = items.map((item: any) =>
      `• ${item.devices?.products?.brands?.name} ${item.devices?.products?.model_name} ${item.devices?.products?.storage_capacity ?? ''} — ₦${Number(item.sale_price).toLocaleString()}`
    ).join('\n')

    const message = encodeURIComponent(
      `Receipt — Stockr\n\n${itemLines}\n\nTotal: ₦${Number(invoice.amount_paid).toLocaleString()}\nPayment: ${invoice.payment_method}\n\nThank you for your purchase!`
    )
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '234')
    window.open(`https://wa.me/${normalized}?text=${message}`, '_blank')
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'SALE', 'SWAP', 'RESELLER'].map(f => (
          <motion.button key={f} whileTap={{ scale: 0.97 }} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === f ? 'bg-blue-500 text-white' : 'bg-[#1C1C1C] text-[#888888] border border-white/8'
            }`}>
            {f}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">No invoices yet</p>
        </div>
      ) : (
        filtered.map((invoice, i) => (
          <motion.div key={invoice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => setSelected(invoice)}
            className="bg-[#141414] border border-white/8 rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    invoice.invoice_type === 'SWAP' ? 'bg-purple-500/20 text-purple-400' :
                    invoice.invoice_type === 'RESELLER' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {invoice.invoice_type}
                  </span>
                  <p className="text-[#888888] text-xs">{invoice.payment_method}</p>
                </div>
                <p className="text-white text-sm font-semibold mt-1">
                  {invoice.customers?.full_name ?? invoice.customers?.phone ?? invoice.resellers?.full_name ?? 'Walk-in'}
                </p>
                <p className="text-[#555555] text-xs mt-0.5">
                  {new Date(invoice.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {role === 'OWNER' && (
                <p className="text-green-400 text-lg font-bold">₦{Number(invoice.amount_paid).toLocaleString()}</p>
              )}
            </div>
          </motion.div>
        ))
      )}

      {/* Invoice detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 rounded-t-3xl z-50 p-6 pb-28 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">Invoice</p>
                  <p className="text-[#555555] text-xs font-mono">{selected.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#555555] text-sm">Close</button>
              </div>

              <div className="space-y-3">
                {/* Items */}
                {(selected.invoice_items ?? []).map((item: any, i: number) => (
                  <div key={i} className="bg-[#1C1C1C] rounded-2xl p-3">
                    <p className="text-white text-sm font-semibold">
                      {item.devices?.products?.brands?.name} {item.devices?.products?.model_name} {item.devices?.products?.storage_capacity}
                    </p>
                    <p className="text-[#888888] text-xs mt-0.5">
                      {item.devices?.color ?? '—'} · {item.devices?.condition_grade ? `Grade ${item.devices.condition_grade}` : 'New'}
                    </p>
                    {item.devices?.imei && <p className="text-[#555555] text-xs font-mono mt-0.5">{item.devices.imei}</p>}
                    <div className="flex justify-between mt-2">
                      <p className="text-[#888888] text-xs">Sale price</p>
                      <p className="text-white text-sm font-semibold">₦{Number(item.sale_price).toLocaleString()}</p>
                    </div>
                    {Number(item.discount_applied) > 0 && (
                      <div className="flex justify-between">
                        <p className="text-[#888888] text-xs">Discount</p>
                        <p className="text-red-400 text-xs">-₦{Number(item.discount_applied).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="bg-[#1C1C1C] rounded-2xl p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888]">Payment</span>
                    <span className="text-white">{selected.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888]">Type</span>
                    <span className="text-white">{selected.invoice_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888]">Staff</span>
                    <span className="text-white">{selected.profiles?.full_name ?? '—'}</span>
                  </div>
                  {role === 'OWNER' && (
                    <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/8">
                      <span className="text-white">Amount Paid</span>
                      <span className="text-green-400">₦{Number(selected.amount_paid).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {selected.notes && (
                  <p className="text-[#888888] text-xs px-1">{selected.notes}</p>
                )}

                {selected.customers?.phone && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => sendWhatsAppReceipt(selected)}
                    className="w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 font-semibold rounded-xl py-3 text-sm">
                    <MessageCircle size={16} /> Send WhatsApp Receipt
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}