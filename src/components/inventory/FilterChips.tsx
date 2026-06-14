'use client'

import { motion } from 'framer-motion'

interface Props {
  activeType: string
  activeGrade: string
  activeStatus: string
  onTypeChange: (v: string) => void
  onGradeChange: (v: string) => void
  onStatusChange: (v: string) => void
}

const chip = (label: string, value: string, active: string, onChange: (v: string) => void) => (
  <motion.button
    key={value}
    whileTap={{ scale: 0.95 }}
    onClick={() => onChange(value)}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
      active === value
        ? 'bg-blue-500 text-white'
        : 'bg-[#1C1C1C] text-[#888888] border border-white/8'
    }`}
  >
    {label}
  </motion.button>
)

export default function FilterChips({ activeType, activeGrade, activeStatus, onTypeChange, onGradeChange, onStatusChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[['All', 'ALL'], ['New', 'NEW'], ['UK Used', 'UK_USED'], ['Trade-In', 'TRADE_IN']].map(
          ([label, value]) => chip(label, value, activeType, onTypeChange)
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[['All Status', 'ALL'], ['In Stock', 'IN_STOCK'], ['With Reseller', 'WITH_RESELLER'], ['Sold', 'SOLD'], ['Holding', 'HOLDING']].map(
          ([label, value]) => chip(label, value, activeStatus, onStatusChange)
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[['All Grades', 'ALL'], ['Grade A', 'A'], ['Grade B', 'B'], ['Grade C', 'C']].map(
          ([label, value]) => chip(label, value, activeGrade, onGradeChange)
        )}
      </div>
    </div>
  )
}