import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="max-w-lg mx-auto pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}