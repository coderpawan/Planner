'use client'

import { useState } from 'react'
import { ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/lib/firebase-config'
import { MdSearch, MdPerson } from 'react-icons/md'

type Role = 'User' | 'Vendor' | 'Admin'

interface UserData {
  uid: string
  name: string
  phoneNumber: string
  city: string
  role: Role
  vendorId?: string | null
}

export default function ChangeUserRolePage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ---------------- SEARCH USER ----------------

  const handleSearch = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      showToast('error', 'Please enter a valid 10-digit phone number')
      return
    }

    setSearching(true)
    setNotFound(false)
    setUser(null)

    const fullPhone = `+91${phoneNumber}`

    try {
      const usersRef = ref(db, 'users')
      const q = query(usersRef, orderByChild('phoneNumber'), equalTo(fullPhone))
      const snap = await get(q)

      if (!snap.exists()) {
        setNotFound(true)
        return
      }

      const data = snap.val()
      const uid = Object.keys(data)[0]
      const u = data[uid]

      const role: Role = (u.role || 'User') as Role

      setUser({
        uid,
        name: u.name,
        phoneNumber: u.phoneNumber,
        city: u.city,
        role,
        vendorId: u.vendorId ?? null
      })
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to search user')
    } finally {
      setSearching(false)
    }
  }

  // ---------------- UI ----------------

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">View User Information</h1>

      {/* SEARCH */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex gap-3">
          <span className="px-4 py-3 bg-gray-100 rounded-l-lg">+91</span>
          <input
            value={phoneNumber}
            onChange={(e) =>
              setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            placeholder="9876543210"
            className="flex-1 border px-4 py-3 rounded-r-lg"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg"
          >
            <MdSearch />
          </button>
        </div>
      </div>

      {notFound && (
        <div className="bg-red-100 p-4 rounded">User not found</div>
      )}

      {user && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <MdPerson className="text-3xl" />
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p>{user.phoneNumber}</p>
            </div>
          </div>

          <p><strong>City:</strong> {user.city}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {user.vendorId && <p><strong>Vendor ID:</strong> {user.vendorId}</p>}
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
