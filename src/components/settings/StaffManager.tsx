'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, User, Shield, ShieldOff, X, AlertCircle } from 'lucide-react'

export default function StaffManager() {
  const supabase = createClient()
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STAFF')
      .order('full_name')
    setStaff(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('All fields are required')
      return
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setSaving(true)
    setError('')

    const res = await fetch('/api/create-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to create account')
      setSaving(false)
      return
    }

    setSuccess(`Staff account created for ${form.full_name}`)
    setForm({ full_name: '', email: '', password: '' })
    setShowForm(false)
    load()
    setSaving(false)
    setTimeout(() => setSuccess(''), 4000)
  }

  async function toggleDeletePermission(staffId: string, current: boolean) {
    await supabase.from('profiles').update({ can_delete: !current }).eq('id', staffId)
    load()
  }

  return (
    <div className="space-y-4">
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 text-green-400 text-sm">
          {success}
        </motion.div>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-[#1C1C1C] border border-white/8 text-blue-400 font-semibold rounded-xl py-3 text-sm">
        {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Create Staff Account</>}
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-[#141414] border border-white/8 rounded-3xl p-4 space-y-3">
              <p className="text-white font-semibold text-sm">New Staff Account</p>

              <input
                value={form.full_name}
                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Full name *"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email address *"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Password (min 6 characters) *"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={saving}
                className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
                {saving ? 'Creating...' : 'Create Account'}
              </motion.button>

              <p className="text-[#555555] text-xs text-center">
                Staff will log in with this email and password. Share credentials securely.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-[#141414] border border-white/8 rounded-2xl h-16 animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <p className="text-[#555555] text-sm text-center py-6">No staff accounts yet</p>
      ) : (
        staff.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-[#141414] border border-white/8 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#1C1C1C]">
                <User size={16} className="text-[#888888]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{member.full_name}</p>
                <p className="text-[#555555] text-xs">Staff</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleDeletePermission(member.id, member.can_delete)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                member.can_delete
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-[#1C1C1C] border-white/8 text-[#888888]'
              }`}>
              {member.can_delete ? <><Shield size={12} /> Can Delete</> : <><ShieldOff size={12} /> No Delete</>}
            </motion.button>
          </motion.div>
        ))
      )}
    </div>
  )
}