'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/8 px-6 py-4 z-40">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-white text-xl font-bold tracking-tight"
        >
          {title}
        </motion.h1>
        <button
          onClick={handleSignOut}
          className="text-[#555555] hover:text-white transition-colors p-2"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}