'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import CategoryManager from './CategoryManager'
import BrandManager from './BrandManager'
import ProductManager from './ProductManager'
import StaffManager from './StaffManager'

const tabs = [
  { id: 'staff', label: 'Staff' },
  { id: 'categories', label: 'Categories' },
  { id: 'brands', label: 'Brands' },
  { id: 'products', label: 'Products' },
]

export default function SettingsTabs() {
  const [active, setActive] = useState('staff')

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              active === tab.id ? 'bg-blue-500 text-white' : 'bg-[#1C1C1C] text-[#888888] border border-white/8'
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {active === 'staff' && <StaffManager />}
      {active === 'categories' && <CategoryManager />}
      {active === 'brands' && <BrandManager />}
      {active === 'products' && <ProductManager />}
    </div>
  )
}