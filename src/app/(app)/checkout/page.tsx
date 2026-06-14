'use client'

import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'

export default function CheckoutPage() {
  return (
    <div>
      <Header title="New Sale" />
      <Suspense fallback={<div className="px-4 py-6 text-[#555555] text-sm">Loading...</div>}>
        <CheckoutFlow />
      </Suspense>
    </div>
  )
}