'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { 
  MdLocationCity, 
  MdAttachMoney, 
  MdStore, 
  MdPeople, 
  MdTrendingUp, 
  MdCheckCircle, 
  MdBlock,
  MdCategory,
  MdEventNote
} from 'react-icons/md'

interface VendorData {
  vendorId: string
  businessName: string
  cities: Array<{ city: string; state: string }>
  serviceCategories: string[]
  active: boolean
  verifiedAt?: { seconds: number }
}

interface CityStats {
  [city: string]: {
    totalVendors: number
    activeVendors: number
    categories: { [category: string]: number }
  }
}

interface CategoryStats {
  [category: string]: number
}

interface MonthlyGrowth {
  month: string
  count: number
}

const CATEGORY_LABELS: Record<string, string> = {
  venue: "Venues & Wedding Spaces",
  catering: "Catering & Food Services",
  decor: "Wedding Decor & Styling",
  photography: "Photography & Videography",
  makeup_styling: "Makeup, Mehendi & Styling",
  music_entertainment: "Music, DJ & Entertainment",
  choreography: "Choreography & Performances",
  ritual_services: "Pandit, Priest & Ritual Services",
  wedding_transport: "Wedding Transport & Baraat Services",
  invitations_gifting: "Invitations, Gifts & Packaging",
  wedding_planner: "Wedding Planning & Coordination"
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    cities: 0,
    budgets: 0,
    totalVendors: 0,
    activeVendors: 0,
    totalServices: 0,
    unverifiedVendors: 0
  })
  const [cityStats, setCityStats] = useState<CityStats>({})
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([])
  const [recentVendors, setRecentVendors] = useState<VendorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          citiesSnap, 
          budgetsSnap, 
          vendorsSnap, 
          unverifiedSnap
        ] = await Promise.all([
          getDocs(collection(firestore, 'OperationalCity')),
          getDocs(collection(firestore, 'WeddingBudget')),
          getDocs(collection(firestore, 'VerifiedVendors')),
          getDocs(collection(firestore, 'UnverifiedVendors'))
        ])

        // Fetch all services from the new structure
        const servicesSnapshot = await getDocs(collection(firestore, 'VendorServices'))
        
        console.log('Total services found:', servicesSnapshot.size)

        // Process vendor data
        const vendors: VendorData[] = []
        let activeCount = 0
        const cityData: CityStats = {}
        const categoryData: CategoryStats = {}
        const monthData: { [key: string]: number } = {}

        // Process services data
        let totalServicesCount = 0
        const serviceCategoryCount: CategoryStats = {}
        const cityServiceCount: { [city: string]: { [category: string]: number } } = {}

        servicesSnapshot.forEach(doc => {
          const serviceData = doc.data()
          totalServicesCount++

          // Count by category
          const category = serviceData.serviceCategory
          if (category) {
            serviceCategoryCount[category] = (serviceCategoryCount[category] || 0) + 1
          }

          // Count by city and category
          const city = serviceData.city
          if (city && category) {
            if (!cityServiceCount[city]) {
              cityServiceCount[city] = {}
            }
            cityServiceCount[city][category] = (cityServiceCount[city][category] || 0) + 1
          }
        })

        console.log('Service category counts:', serviceCategoryCount)
        console.log('City service counts:', cityServiceCount)

        vendorsSnap.forEach(doc => {
          const data = doc.data()
          const vendor: VendorData = {
            vendorId: doc.id,
            businessName: data.businessName || 'N/A',
            cities: data.cities || [],
            serviceCategories: data.serviceCategories || [],
            active: data.active !== false,
            verifiedAt: data.verifiedAt
          }
          vendors.push(vendor)

          if (vendor.active) activeCount++

          // Count vendors by city
          vendor.cities.forEach(cityObj => {
            const cityName = cityObj.city
            if (!cityData[cityName]) {
              cityData[cityName] = { 
                totalVendors: 0, 
                activeVendors: 0,
                categories: {}
              }
            }
            cityData[cityName].totalVendors++
            if (vendor.active) cityData[cityName].activeVendors++

            // Use actual service counts per city from VendorServices collection
            if (cityServiceCount[cityName]) {
              cityData[cityName].categories = cityServiceCount[cityName]
            }
          })

          // Monthly growth data
          if (vendor.verifiedAt?.seconds) {
            const date = new Date(vendor.verifiedAt.seconds * 1000)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthData[monthKey] = (monthData[monthKey] || 0) + 1
          }
        })

        // Sort and get last 6 months growth
        const sortedMonths = Object.entries(monthData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, count]) => {
            const [year, monthNum] = month.split('-')
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })
            return { month: monthName, count }
          })

        // Get recent vendors
        const sortedVendors = vendors
          .filter(v => v.verifiedAt?.seconds)
          .sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0))
          .slice(0, 5)

        setStats({
          cities: citiesSnap.size,
          budgets: budgetsSnap.size,
          totalVendors: vendors.length,
          activeVendors: activeCount,
          totalServices: totalServicesCount,
          unverifiedVendors: unverifiedSnap.size
        })
        setCityStats(cityData)
        setCategoryStats(serviceCategoryCount)
        setMonthlyGrowth(sortedMonths)
        setRecentVendors(sortedVendors)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b.totalVendors - a.totalVendors)
    .slice(0, 5)

  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Comprehensive overview of your platform</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdStore className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalVendors}</p>
          <p className="text-sm opacity-90">Verified Vendors</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdCheckCircle className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeVendors}</p>
          <p className="text-sm opacity-90">Active Vendors</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdBlock className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Inactive</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalVendors - stats.activeVendors}</p>
          <p className="text-sm opacity-90">Inactive Vendors</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdEventNote className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalServices}</p>
          <p className="text-sm opacity-90">Total Services</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdPeople className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <p className="text-2xl font-bold">{stats.unverifiedVendors}</p>
          <p className="text-sm opacity-90">Unverified</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <MdLocationCity className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold">{stats.cities}</p>
          <p className="text-sm opacity-90">Cities Covered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Growth Trend */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <MdTrendingUp className="text-xl text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vendor Growth Trend</h2>
              <p className="text-sm text-gray-600">Last 6 months registration</p>
            </div>
          </div>
          
          {monthlyGrowth.length > 0 ? (
            <div className="space-y-3">
              {monthlyGrowth.map((data, index) => {
                const maxCount = Math.max(...monthlyGrowth.map(m => m.count))
                const percentage = (data.count / maxCount) * 100
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{data.month}</span>
                      <span className="font-bold text-pink-600">{data.count} vendors</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No growth data available</p>
          )}
        </div>

        {/* Top Cities by Vendors */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MdLocationCity className="text-xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Cities</h2>
              <p className="text-sm text-gray-600">By vendor count</p>
            </div>
          </div>

          {topCities.length > 0 ? (
            <div className="space-y-4">
              {topCities.map(([city, data], index) => (
                <div key={city} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{city}</span>
                      <span className="text-sm text-gray-600">{data.totalVendors} vendors</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <MdCheckCircle className="text-green-500" />
                        {data.activeVendors} active
                      </span>
                      <span>•</span>
                      <span>{Object.keys(data.categories).length} categories</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No city data available</p>
          )}
        </div>
      </div>

      {/* Service Categories Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <MdCategory className="text-xl text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Service Categories</h2>
            <p className="text-sm text-gray-600">Actual service distribution across categories</p>
          </div>
        </div>

        {topCategories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map(([category, count]) => (
              <div key={category} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <p className="text-2xl font-bold text-purple-600 mb-1">{count}</p>
                <p className="text-sm text-gray-700 font-medium">
                  {CATEGORY_LABELS[category] || category.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No category data available</p>
        )}
      </div>

      {/* Recent Vendors */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MdStore className="text-xl text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recently Verified Vendors</h2>
            <p className="text-sm text-gray-600">Latest vendor registrations</p>
          </div>
        </div>

        {recentVendors.length > 0 ? (
          <div className="space-y-3">
            {recentVendors.map((vendor) => (
              <div key={vendor.vendorId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {vendor.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{vendor.businessName}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{vendor.cities.map(c => c.city).join(', ')}</span>
                      <span>•</span>
                      <span>{vendor.serviceCategories.length} categories</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {vendor.active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent vendors</p>
        )}
      </div>

      {/* City-wise Category Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <MdCategory className="text-xl text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">City-wise Service Distribution</h2>
            <p className="text-sm text-gray-600">Actual services per city and category</p>
          </div>
        </div>

        {topCities.length > 0 ? (
          <div className="space-y-6">
            {topCities.map(([city, data]) => (
              <div key={city}>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {city}
                  <span className="ml-2 text-sm text-gray-600">
                    ({Object.values(data.categories).reduce((sum, count) => sum + count, 0)} services)
                  </span>
                </h3>
                {Object.keys(data.categories).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Object.entries(data.categories)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([cat, count]) => (
                        <div key={cat} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <p className="text-lg font-bold text-orange-600">{count}</p>
                          <p className="text-xs text-gray-700">
                            {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No services in this city yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No breakdown data available</p>
        )}
      </div>
    </div>
  )
}