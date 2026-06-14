'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Tag } from 'lucide-react'

export default function CategoryManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('categories').insert({ name: newName.trim() })
    if (error) {
      setError(error.code === '23505' ? 'Category already exists.' : error.message)
    } else {
      setNewName('')
      load()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/8 rounded-3xl p-4 space-y-3">
        <p className="text-white font-semibold text-sm">Add Category</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Smartwatches"
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
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-[#141414] border border-white/8 rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Tag size={14} className="text-blue-400" />
            </div>
            <p className="text-white text-sm font-medium">{cat.name}</p>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <p className="text-[#555555] text-sm text-center py-6">No categories yet</p>
        )}
      </div>
    </div>
  )
}