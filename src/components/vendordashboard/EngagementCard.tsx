'use client'

import { UserEngagement } from '@/lib/firestore-engagements'
import { MdPhone, MdLocationOn, MdPerson, MdWork, MdAccessTime } from 'react-icons/md'
import { FaWhatsapp } from 'react-icons/fa'

interface EngagementCardProps {
  engagement: UserEngagement
}

/**
 * Format phone number for display
 * Assumes E.164 format (+91xxxxxxxxxx)
 */
function formatPhoneNumber(phone: string): string {
  if (!phone) return 'N/A'
  
  // Remove +91 prefix if present
  const cleaned = phone.replace(/^\+91/, '')
  
  // Format as XXX-XXX-XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: any): string {
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    }
  } catch (error) {
    return 'Recently'
  }
}

/**
 * Format service category for display
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function EngagementCard({ engagement }: EngagementCardProps) {
  // Ensure phone has country code for WhatsApp
  const phoneForWhatsApp = engagement.unlockedByPhoneNumber.startsWith('+91')
    ? engagement.unlockedByPhoneNumber.replace('+91', '91')
    : engagement.unlockedByPhoneNumber.startsWith('91')
    ? engagement.unlockedByPhoneNumber
    : `91${engagement.unlockedByPhoneNumber.replace(/^\+/, '')}`

  const phoneForCall = engagement.unlockedByPhoneNumber.startsWith('+')
    ? engagement.unlockedByPhoneNumber
    : `+91${engagement.unlockedByPhoneNumber.replace(/^\+91/, '')}`

  const userName = engagement.unlockedByName || 'Interested User'

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      {/* Header - User Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full">
              <MdPerson className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{userName}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MdPhone className="text-base" />
                <span>{formatPhoneNumber(engagement.unlockedByPhoneNumber)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MdAccessTime className="text-sm" />
          <span>{formatTimestamp(engagement.unlockedAt)}</span>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
        <div className="flex items-start gap-2">
          <MdWork className="text-gray-600 text-lg mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{engagement.serviceName}</p>
            <p className="text-xs text-gray-600">{formatCategory(engagement.serviceCategory)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MdLocationOn className="text-gray-600 text-lg flex-shrink-0" />
          <p className="text-sm text-gray-700">{engagement.serviceCity}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            engagement.unlockedByRole === 'Vendor' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            Unlocked by: {engagement.unlockedByRole === 'Vendor' ? 'Vendor' : 'User'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <a
          href={`tel:${phoneForCall}`}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <MdPhone className="text-xl" />
          <span>Call</span>
        </a>
        <a
          href={`https://wa.me/${phoneForWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <FaWhatsapp className="text-xl" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
