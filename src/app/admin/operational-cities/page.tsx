'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import OperationalCityTable from '@/components/admin/OperationalCity/OperationalCityTable'
import OperationalCityForm from '@/components/admin/OperationalCity/OperationalCityForm'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { MdAdd } from 'react-icons/md'

export interface OperationalCity {
  docId?: string
  city: string
  state: string
}

// Type for form data (without docId)
export type OperationalCityFormData = Omit<OperationalCity, 'docId'>

export default function OperationalCitiesPage() {
  const [cities, setCities] = useState<OperationalCity[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<OperationalCity | null>(null)
  const [deletingCity, setDeletingCity] = useState<OperationalCity | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCities = async () => {
    setLoading(true)
    try {
      const querySnapshot = await getDocs(collection(firestore, 'OperationalCity'))
      const citiesData: OperationalCity[] = []
      querySnapshot.forEach((doc) => {
        citiesData.push({ docId: doc.id, ...doc.data() } as OperationalCity)
      })
      setCities(citiesData.sort((a, b) => a.city.localeCompare(b.city)))
    } catch (error) {
      console.error('Error fetching cities:', error)
      showToast('error', 'Failed to fetch cities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCities()
  }, [])

  const handleAdd = () => {
    setEditingCity(null)
    setIsFormOpen(true)
  }

  const handleEdit = (city: OperationalCity) => {
    setEditingCity(city)
    setIsFormOpen(true)
  }

  const handleDelete = (city: OperationalCity) => {
    setDeletingCity(city)
  }

  const handleSave = async (data: OperationalCityFormData) => {
    try {
      if (editingCity?.docId) {
        // UPDATE
        await updateDoc(doc(firestore, 'OperationalCity', editingCity.docId), {
          ...data,
          updatedAt: new Date().toISOString(),
        })
        showToast('success', 'City updated successfully')
      } else {
        // CREATE
        await addDoc(collection(firestore, 'OperationalCity'), {
          ...data,
          createdAt: new Date().toISOString(),
        })
        showToast('success', 'City added successfully')
      }
      setIsFormOpen(false)
      fetchCities()
    } catch (error) {
      console.error('Error saving city:', error)
      showToast('error', 'Failed to save city')
    }
  }

  const confirmDelete = async () => {
    if (!deletingCity?.docId) return

    try {
      await deleteDoc(doc(firestore, 'OperationalCity', deletingCity.docId))
      showToast('success', 'City deleted successfully')
      setDeletingCity(null)
      fetchCities()
    } catch (error) {
      console.error('Error deleting city:', error)
      showToast('error', 'Failed to delete city')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Operational Cities</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
        >
          <MdAdd className="text-xl" />
          Add City
        </button>
      </div>

      <OperationalCityTable
        cities={cities}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <OperationalCityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingCity}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingCity}
        onClose={() => setDeletingCity(null)}
        onConfirm={confirmDelete}
        itemName={deletingCity?.city || ''}
      />

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}