'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  // Check if user is admin
  useEffect(() => {
    const role = localStorage.getItem('role')
    console.log('Admin layout: checking role from localStorage:', role)
    
    if (role !== 'Admin') {
      console.log('Admin layout: role is not Admin, redirecting to home')
      router.push('/')
    } else {
      console.log('Admin layout: role is Admin, allowing access')
      setIsChecking(false)
    }
  }, [router])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}