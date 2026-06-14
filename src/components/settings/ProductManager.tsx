'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Package } from 'lucide-react'

export default function ProductManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [modelName, setModelName] = useState('')
  const [storage, setStorage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [catRes, brandRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('products').select('*, brands(name, categories(name))').order('model_name'),
    ])
    setCategories(catRes.data ?? [])
    setBrands(brandRes.data ?? [])
    setProducts(prodRes.data ?? [])
    if (catRes.data?.length && !selectedCategory) setSelectedCategory(catRes.data[0].id)
  }

  useEffect(() => { load() }, [])

  const filteredBrands = brands.filter(b => b.category_id === selectedCategory)

  useEffect(() => {
    if (filteredBrands.length && !filteredBrands.find(b => b.id === selectedBrand)) {
      setSelectedBrand(filteredBrands[0]?.id ?? '')
    }
  }, [selectedCategory, brands])

  async function handleAdd() {
    if (!modelName.trim() || !selectedBrand) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('products').insert({
      brand_id: selectedBrand,
      model_name: modelName.trim(),
      storage_capacity: storage.trim() || null,
    })
    if (error) {
      setError(error.code === '23505' ? 'This product already exists.' : error.message)
    } else {
      setModelName('')
      setStorage('')
      load()
    }
    setSaving(false)
  }

  const filteredProducts = products.filter(p => brands.find(b => b.id === p.brand_id)?.category_id === selectedCategory)

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/8 rounded-3xl p-4 space-y-3">
        <p className="text-white font-semibold text-sm">Add Product</p>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none"
        >
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          disabled={!filteredBrands.length}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none disabled:opacity-40"
        >
          {filteredBrands.length === 0 && <option>No brands in this category</option>}
          {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Model name (e.g. iPhone 15 Pro Max)"
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
        />

        <input
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          placeholder="Storage (e.g. 256GB) — optional"
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          disabled={saving || !filteredBrands.length}
          className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm"
        >
          {saving ? 'Saving...' : 'Add Product'}
        </motion.button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <div className="space-y-2">
        {filteredProducts.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-[#141414] border border-white/8 rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Package size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{p.brands?.name} {p.model_name}</p>
              <p className="text-[#555555] text-xs">{p.storage_capacity ?? 'No storage spec'}</p>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <p className="text-[#555555] text-sm text-center py-6">No products in this category yet</p>
        )}
      </div>
    </div>
  )
}