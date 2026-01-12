'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MdLocationOn,
  MdKeyboardArrowDown,
  MdClose,
  MdSearch,
} from 'react-icons/md'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'

/* ----------------------------------
   Types
----------------------------------- */
interface City {
  id: number
  city: string
  state: string
}

interface CitySelectorProps {
  selectedCity: string
  onCityChange: (city: string) => void
}

/* ----------------------------------
   Component
----------------------------------- */
export default function CitySelectorDropdown({
  selectedCity,
  onCityChange,
}: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* ----------------------------------
     Fetch cities from Firestore
  ----------------------------------- */
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const q = query(
          collection(firestore, 'OperationalCity'),
          orderBy('city')
        )
        const snapshot = await getDocs(q)

        const cityList: City[] = snapshot.docs.map((doc) => ({
          id: doc.data().id,
          city: doc.data().city,
          state: doc.data().state,
        }))

        setCities(cityList)
      } catch (error) {
        console.error('Failed to load cities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  /* ----------------------------------
     Filter
  ----------------------------------- */
  const filteredCities = cities.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /* ----------------------------------
     Outside click
  ----------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleCitySelect = (city: string) => {
    onCityChange(city)
    setIsOpen(false)
    setSearchQuery('')
  }

  /* ----------------------------------
     UI
  ----------------------------------- */
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-pink-300 transition-colors w-full"
      >
        <MdLocationOn className="text-xl text-pink-500" />
        <span className="flex-1 text-left font-medium text-gray-900">
          {selectedCity || 'Select city'}
        </span>
        <MdKeyboardArrowDown
          className={`text-xl text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-[220px] overflow-y-auto">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-300 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <MdClose className="text-xl" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading cities...
              </div>
            ) : filteredCities.length > 0 ? (
              filteredCities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCitySelect(c.city)}
                  className={`w-full text-left px-4 py-3 hover:bg-pink-50 border-b last:border-0 ${
                    selectedCity === c.city ? 'bg-pink-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{c.city}</div>
                  <div className="text-sm text-gray-500">{c.state}</div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No cities found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
