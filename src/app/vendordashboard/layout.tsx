'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  MdDashboard, MdEventNote, MdBookOnline, MdPerson, 
  MdMenu, MdClose, MdLogout, MdPersonAdd
} from 'react-icons/md'
import Link from 'next/link'

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vendorName, setVendorName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication and role
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')
    
    if (role !== 'Vendor') {
      router.push('/login')
      return
    }
    
    setVendorName(name || 'Vendor')
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const menuItems = [
    { href: '/vendordashboard', icon: MdDashboard, label: 'Dashboard' },
    { href: '/vendordashboard/services', icon: MdEventNote, label: 'My Services' },
    { href: '/vendordashboard/bookings', icon: MdBookOnline, label: 'Bookings' },
    { href: '/vendordashboard/engagements', icon: MdPersonAdd, label: 'Leads' },
    { href: '/vendordashboard/profile', icon: MdPerson, label: 'Profile' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-pink-600">Vendor Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white shadow-xl">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-gradient-to-r from-pink-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">Vendor Portal</h1>
          </div>

          {/* Vendor Info */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-lg font-semibold text-gray-900">{vendorName}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-pink-50 text-pink-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="text-xl" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <MdLogout className="text-xl" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {/* ...existing mobile sidebar content similar to desktop... */}
            <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-pink-600 to-purple-600">
              <h1 className="text-xl font-bold text-white">Vendor Portal</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <MdClose className="text-2xl text-white" />
              </button>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-lg font-semibold text-gray-900">{vendorName}</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-pink-50 text-pink-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="text-xl" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <MdLogout className="text-xl" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
