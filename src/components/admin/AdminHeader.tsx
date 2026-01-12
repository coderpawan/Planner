'use client'

import { MdMenu, MdPerson } from 'react-icons/md'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  const adminName = typeof window !== 'undefined' ? localStorage.getItem('name') : null

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <MdMenu className="text-2xl" />
        </button>

        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900">Wedding Planner Admin</h1>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
          <MdPerson className="text-lg text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {adminName || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}