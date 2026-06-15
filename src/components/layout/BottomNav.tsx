'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, Package, ShoppingCart, Users, Bell, Settings, UserCheck, Receipt } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/checkout', icon: ShoppingCart, label: 'Sell' },
  { href: '/resellers', icon: Users, label: 'Resellers' },
  { href: '/customers', icon: UserCheck, label: 'Customers' },
  { href: '/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const supabase = createClient()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { count } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('alert_type', 'RESELLER_OVERDUE')
        .eq('is_read', false)
      setAlertCount(count ?? 0)
    }
    load()
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 px-2 pb-safe z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 py-3 px-3 min-w-[56px]"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={active ? 'text-blue-500' : 'text-[#555555]'}
                />
                {label === 'Alerts' && alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-500' : 'text-[#555555]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}