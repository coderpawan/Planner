'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MdLocationCity, MdAttachMoney, MdClose, MdDashboard, MdPersonAdd, MdPendingActions, MdStore, MdMiscellaneousServices, MdTrendingUp, MdSupervisorAccount } from 'react-icons/md'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: MdDashboard },
  { label: 'Operational Cities', href: '/admin/operational-cities', icon: MdLocationCity },
  { label: 'Unverified Vendors', href: '/admin/unverified-vendors', icon: MdPendingActions },
  { label: 'Manage Vendors', href: '/admin/manage-vendors', icon: MdStore },
  { label: 'Manage Services', href: '/admin/manage-services', icon: MdMiscellaneousServices },
  { label: 'Trending Ideas', href: '/admin/trending-ideas', icon: MdTrendingUp },
  { label: 'Manage Admins', href: '/admin/manage-admins', icon: MdSupervisorAccount },
]

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-pink-50 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}