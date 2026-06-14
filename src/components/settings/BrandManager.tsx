'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Award } from 'lucide-react'

export default function BrandManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [catRes, brandRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*, categories(name)').order('name'),
    ])
    setCategories(catRes.data ?? [])
    setBrands(brandRes.data ?? [])
    if (catRes.data?.length && !selectedCategory) setSelectedCategory(catRes.data[0].id)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newName.trim() || !selectedCategory) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('brands').insert({ name: newName.trim(), category_id: selectedCategory })
    if (error) {
      setError(error.message)
    } else {
      setNewName('')
      load()
    }
    setSaving(false)
  }

  const filteredBrands = brands.filter(b => b.category_id === selectedCategory)

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/8 rounded-3xl p-4 space-y-3">
        <p className="text-white font-semibold text-sm">Add Brand</p>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none"
        >
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Xiaomi"
            className="flex-1 bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={saving}
            className="bg-blue-500 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center"
          >
            <Plus size={18} />
          </motion.button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <div className="space-y-2">
        {filteredBrands.map((brand, i) => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-[#141414] border border-white/8 rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-green-500/10">
              <Award size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{brand.name}</p>
              <p className="text-[#555555] text-xs">{brand.categories?.name}</p>
            </div>
          </motion.div>
        ))}
        {filteredBrands.length === 0 && (
          <p className="text-[#555555] text-sm text-center py-6">No brands in this category yet</p>
        )}
      </div>
    </div>
  )
}