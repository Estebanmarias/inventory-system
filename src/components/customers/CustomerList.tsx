'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronRight, Phone, ShoppingBag } from 'lucide-react'

export default function CustomerList() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('customers')
        .select('*, invoices(id, invoice_type, amount_paid, created_at)')
        .order('created_at', { ascending: false })
      setCustomers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function loadInvoices(customerId: string) {
    const { data } = await supabase
      .from('invoices')
      .select(`
        id, invoice_type, amount_paid, payment_method, created_at,
        invoice_items (
          sale_price, discount_applied,
          devices ( imei, products ( model_name, storage_capacity, brands ( name ) ) )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setInvoices(data ?? [])
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={40} className="text-[#333333] mb-3" />
          <p className="text-[#555555] text-sm">No customers yet</p>
          <p className="text-[#333333] text-xs mt-1">Customers are added automatically when a phone number is entered during checkout</p>
        </div>
      ) : (
        <>
          <p className="text-[#555555] text-xs">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
          {customers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { setSelected(customer); loadInvoices(customer.id) }}
              className="bg-[#141414] border border-white/8 rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#1C1C1C]">
                    <Phone size={16} className="text-[#888888]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {customer.full_name ?? customer.phone}
                    </p>
                    {customer.full_name && (
                      <p className="text-[#555555] text-xs">{customer.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#555555] text-xs">
                    {customer.invoices?.length ?? 0} purchase{(customer.invoices?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight size={16} className="text-[#555555]" />
                </div>
              </div>
            </motion.div>
          ))}
        </>
      )}

      {/* Customer detail sheet */}
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
                  <p className="text-white font-bold text-lg">{selected.full_name ?? selected.phone}</p>
                  {selected.full_name && <p className="text-[#888888] text-sm">{selected.phone}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="text-[#555555] text-sm">Close</button>
              </div>

              <div className="space-y-3">
                {invoices.length === 0 ? (
                  <p className="text-[#555555] text-sm text-center py-6">No purchase history</p>
                ) : (
                  invoices.map(invoice => (
                    <div key={invoice.id} className="bg-[#1C1C1C] rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          invoice.invoice_type === 'SWAP' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {invoice.invoice_type}
                        </span>
                        <p className="text-white text-sm font-bold">₦{Number(invoice.amount_paid).toLocaleString()}</p>
                      </div>
                      {(invoice.invoice_items ?? []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <ShoppingBag size={12} className="text-[#555555]" />
                          <p className="text-[#888888] text-xs">
                            {item.devices?.products?.brands?.name} {item.devices?.products?.model_name} {item.devices?.products?.storage_capacity}
                          </p>
                        </div>
                      ))}
                      <p className="text-[#555555] text-xs">
                        {new Date(invoice.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{invoice.payment_method}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}