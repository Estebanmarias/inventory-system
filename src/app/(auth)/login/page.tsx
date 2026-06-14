'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">STOCKR</h1>
          <p className="text-[#888888] text-sm mt-2">Inventory Management System</p>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/8 rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-[#888888] font-medium uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#888888] font-medium uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </div>

        <p className="text-center text-[#555555] text-xs mt-6">
          Contact your store owner to get access.
        </p>
      </motion.div>
    </div>
  )
}