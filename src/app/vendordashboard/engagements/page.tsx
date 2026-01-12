'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserEngagement, getVendorEngagements } from '@/lib/firestore-engagements'
import EngagementCard from '@/components/vendordashboard/EngagementCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { MdPersonAdd, MdRefresh } from 'react-icons/md'

export default function EngagementsPage() {
  const router = useRouter()
  const [engagements, setEngagements] = useState<UserEngagement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Check authentication
    const uid = localStorage.getItem('uid')
    const role = localStorage.getItem('role')

    if (!uid || role !== 'Vendor') {
      router.push('/')
      return
    }

    loadEngagements()
  }, [router])

  const loadEngagements = async () => {
    try {
      const vendorId = localStorage.getItem('vendorId')
      
      if (!vendorId) {
        console.error('Vendor ID not found')
        router.push('/vendordashboard')
        return
      }

      console.log('📊 Fetching engagements for vendor:', vendorId)

      const fetchedEngagements = await getVendorEngagements(vendorId)
      console.log('📊 Fetched:', fetchedEngagements.length, 'engagements')
      
      setEngagements(fetchedEngagements)
    } catch (error) {
      console.error('Error loading engagements:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadEngagements()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Engagements</h1>
              <p className="text-gray-600">
                Track users who have unlocked your service contact details
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              <MdRefresh className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full">
              <MdPersonAdd className="text-white text-3xl" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{engagements.length}</p>
              <p className="text-gray-600">Total Leads</p>
            </div>
          </div>
        </div>

        {/* Engagements Grid */}
        {engagements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Engagements Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              When users unlock your service contact details, they'll appear here. 
              Make sure your services are active and visible to users!
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {engagements.map((engagement) => (
              <EngagementCard key={engagement.engagementId} engagement={engagement} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

