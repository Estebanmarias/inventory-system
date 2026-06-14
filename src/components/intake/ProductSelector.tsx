'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  model_name: string
  storage_capacity: string | null
  brands: {
    id: string
    name: string
    categories: { id: string; name: string }
  }
}

interface Props {
  onSelect: (product: Product) => void
}

export default function ProductSelector({ onSelect }: Props) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState({
    category_id: '', brand_id: '', model_name: '', storage_capacity: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select(`
          id, model_name, storage_capacity,
          brands ( id, name, categories ( id, name ) )
        `).order('model_name'),
        supabase.from('categories').select('*').order('name'),
      ])
      setProducts((prodRes.data as unknown as Product[]) ?? [])
      setFiltered((prodRes.data as unknown as Product[]) ?? [])
      setCategories(catRes.data ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(products); return }
    const q = search.toLowerCase()
    setFiltered(products.filter(p =>
      p.model_name.toLowerCase().includes(q) ||
      p.brands?.name.toLowerCase().includes(q) ||
      p.brands?.categories?.name.toLowerCase().includes(q)
    ))
  }, [search, products])

  async function loadBrands(categoryId: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('category_id', categoryId)
    .order('name')
  console.log('brands:', data, 'error:', error)
  setBrands(data ?? [])
}

  async function handleCreate() {
    if (!newProduct.brand_id || !newProduct.model_name) return
    setSaving(true)
    const { data, error } = await supabase.from('products').insert({
      brand_id: newProduct.brand_id,
      model_name: newProduct.model_name,
      storage_capacity: newProduct.storage_capacity || null,
    }).select(`id, model_name, storage_capacity, brands ( id, name, categories ( id, name ) )`).single()

    if (!error && data) {
      onSelect(data as unknown as Product)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          type="text"
          placeholder="Search model or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {filtered.map(product => (
          <motion.button
            key={product.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(product)}
            className="w-full bg-[#1C1C1C] border border-white/8 rounded-2xl p-3 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-white text-sm font-medium">{product.brands?.name} {product.model_name}</p>
              <p className="text-[#888888] text-xs">
                {product.brands?.categories?.name}
                {product.storage_capacity ? ` · ${product.storage_capacity}` : ''}
              </p>
            </div>
            <ChevronRight size={16} className="text-[#555555]" />
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => setShowCreate(!showCreate)}
        className="flex items-center gap-2 text-blue-400 text-sm font-medium"
      >
        <Plus size={16} />
        {showCreate ? 'Cancel' : 'Add new product'}
      </button>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <select
              onChange={(e) => { setNewProduct(p => ({ ...p, category_id: e.target.value, brand_id: '' })); loadBrands(e.target.value) }}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none"
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              onChange={(e) => setNewProduct(p => ({ ...p, brand_id: e.target.value }))}
              disabled={!newProduct.category_id}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none disabled:opacity-40"
            >
              <option value="">Select brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <input
              placeholder="Model name (e.g. iPhone 15 Pro Max)"
              value={newProduct.model_name}
              onChange={(e) => setNewProduct(p => ({ ...p, model_name: e.target.value }))}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
            />

            <input
              placeholder="Storage (e.g. 256GB) — optional"
              value={newProduct.storage_capacity}
              onChange={(e) => setNewProduct(p => ({ ...p, storage_capacity: e.target.value }))}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={saving || !newProduct.brand_id || !newProduct.model_name}
              className="w-full bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm"
            >
              {saving ? 'Saving...' : 'Create & Select'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}