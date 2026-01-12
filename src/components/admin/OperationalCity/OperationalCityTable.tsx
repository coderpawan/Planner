'use client'

import { MdEdit, MdDelete } from 'react-icons/md'
import { OperationalCity } from '@/app/admin/operational-cities/page'

interface OperationalCityTableProps {
  cities: OperationalCity[]
  loading: boolean
  onEdit: (city: OperationalCity) => void
  onDelete: (city: OperationalCity) => void
}

export default function OperationalCityTable({
  cities,
  loading,
  onEdit,
  onDelete,
}: OperationalCityTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-8 text-center text-gray-500">Loading cities...</div>
      </div>
    )
  }

  if (cities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-8 text-center text-gray-500">No cities found. Add your first city!</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">State</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city.docId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{city.city}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{city.state}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(city)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <MdEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => onDelete(city)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <MdDelete className="text-xl" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
