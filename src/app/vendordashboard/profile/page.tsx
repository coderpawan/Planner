'use client'

import { useState, useEffect } from 'react'
import { MdBusiness, MdPerson, MdPhone, MdEmail, MdWorkHistory, MdCategory, MdLocationCity, MdInfo } from 'react-icons/md'
import { getVendorProfile, VendorProfile } from '@/lib/firestore-vendor'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function Profile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const vendorId = localStorage.getItem('vendorId')
      if (!vendorId) {
        setError('Vendor ID not found')
        return
      }

      const profileData = await getVendorProfile(vendorId)
      if (!profileData) {
        setError('Profile not found')
        return
      }

      setProfile(profileData)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your profile..." />
  }

  if (error || !profile) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-red-500 text-lg">{error || 'Profile not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">View your business information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div className="flex items-start gap-3">
            <MdBusiness className="text-2xl text-purple-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Business Name</p>
              <p className="text-lg font-bold text-gray-900">{profile.businessName || '—'}</p>
            </div>
          </div>

          {/* Owner Name */}
          <div className="flex items-start gap-3">
            <MdPerson className="text-2xl text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Owner Name</p>
              <p className="text-lg font-bold text-gray-900">{profile.ownerName || '—'}</p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex items-start gap-3">
            <MdPhone className="text-2xl text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Phone Number</p>
              <p className="text-lg font-bold text-gray-900">{profile.phoneNumber || '—'}</p>
            </div>
          </div>

          {/* Alternative Phone */}
          <div className="flex items-start gap-3">
            <MdPhone className="text-2xl text-green-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Alternate Phone</p>
              <p className="text-lg font-bold text-gray-900">{profile.alternativePhoneNumber || '—'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <MdEmail className="text-2xl text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-lg font-bold text-gray-900">{profile.email || '—'}</p>
            </div>
          </div>

          {/* Years of Experience */}
          <div className="flex items-start gap-3">
            <MdWorkHistory className="text-2xl text-orange-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-lg font-bold text-gray-900">
                {profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : '—'}
              </p>
            </div>
          </div>

          {/* Service Categories */}
          <div className="flex items-start gap-3 md:col-span-2">
            <MdCategory className="text-2xl text-pink-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2">Services</p>
              {profile.serviceCategories && profile.serviceCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.serviceCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-900">—</p>
              )}
            </div>
          </div>

          {/* Cities */}
          <div className="flex items-start gap-3 md:col-span-2">
            <MdLocationCity className="text-2xl text-indigo-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2">Cities</p>
              {profile.cities && profile.cities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.cities.map((location, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                    >
                      {location.city}, {location.state}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-900">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
        <MdInfo className="text-3xl text-amber-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-amber-900 mb-2">Note:</h3>
          <p className="text-amber-800">
            If you want to update any profile information, please contact customer support.
            Profile editing is not available from the vendor dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
