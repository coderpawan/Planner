'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase-config'
import { useRouter } from 'next/navigation'
import {
  getAllTrendingIdeas,
  createTrendingIdea,
  updateTrendingIdea,
  deleteTrendingIdea,
  toggleTrendingIdeaStatus,
  TrendingIdea
} from '@/lib/firestore-trending-ideas'
import TrendingIdeaModal from '@/components/admin/TrendingIdeas/TrendingIdeaModal'
import DeleteIdeaModal from '@/components/admin/TrendingIdeas/DeleteIdeaModal'
import { MdAdd, MdEdit, MdDelete, MdToggleOn, MdToggleOff, MdPlayCircle } from 'react-icons/md'
import Image from 'next/image'

export default function TrendingIdeasPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<TrendingIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<TrendingIdea | null>(null)
  const [ideaToDelete, setIdeaToDelete] = useState<TrendingIdea | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [adminUserId, setAdminUserId] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/admin')
        return
      }
      setAdminUserId(user.uid)
      fetchIdeas()
    }
    checkAuth()
  }, [router])

  const fetchIdeas = async () => {
    try {
      setLoading(true)
      const fetchedIdeas = await getAllTrendingIdeas()
      setIdeas(fetchedIdeas)
    } catch (error) {
      console.error('Error fetching ideas:', error)
      alert('Failed to fetch trending ideas')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIdea = async (data: Omit<TrendingIdea, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedIdea?.id) {
        await updateTrendingIdea(selectedIdea.id, data)
      } else {
        await createTrendingIdea(data)
      }
      await fetchIdeas()
      setIsModalOpen(false)
      setSelectedIdea(null)
    } catch (error) {
      console.error('Error saving idea:', error)
      throw error
    }
  }

  const handleEdit = (idea: TrendingIdea) => {
    setSelectedIdea(idea)
    setIsModalOpen(true)
  }

  const handleDelete = (idea: TrendingIdea) => {
    setIdeaToDelete(idea)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!ideaToDelete?.id) return

    try {
      setIsDeleting(true)
      await deleteTrendingIdea(ideaToDelete.id)
      await fetchIdeas()
      setIsDeleteModalOpen(false)
      setIdeaToDelete(null)
    } catch (error) {
      console.error('Error deleting idea:', error)
      alert('Failed to delete trending idea')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (idea: TrendingIdea) => {
    if (!idea.id) return

    try {
      await toggleTrendingIdeaStatus(idea.id, idea.status)
      await fetchIdeas()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to toggle status')
    }
  }

  const handleAddNew = () => {
    setSelectedIdea(null)
    setIsModalOpen(true)
  }

  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Not specified'
    if (min === max) return `₹${min.toLocaleString()}`
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trending ideas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Trending Ideas</h1>
          <p className="text-gray-600 mt-1">Create and manage trending wedding ideas</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <MdAdd className="text-xl" />
          Add New Idea
        </button>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No trending ideas yet</p>
          <button
            onClick={handleAddNew}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Create First Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              {/* Thumbnail */}
              <div className="w-full h-40 bg-gray-200 relative">
                {idea.thumbnailUrl ? (
                  <Image
                    src={idea.thumbnailUrl}
                    alt={idea.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <MdPlayCircle className="text-5xl text-gray-400" />
                  </div>
                )}
                {/* Status badges */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {idea.isTrending && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500 text-white shadow">
                      Trending
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium shadow ${
                      idea.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {idea.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{idea.title}</h3>
                
                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Theme:</span>
                    <span className="font-medium text-gray-900">{idea.theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Priority:</span>
                    <span className="font-medium text-gray-900">{idea.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Video:</span>
                    <span className="font-medium text-gray-900 uppercase">{idea.videoType}</span>
                  </div>
                </div>

                {/* Budget */}
                <div className="text-sm mb-3">
                  <p className="text-gray-500">Budget</p>
                  <p className="font-medium text-gray-900">
                    {formatBudget(idea.estimatedBudgetRange?.min || 0, idea.estimatedBudgetRange?.max || 0)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                  <button
                    onClick={() => handleEdit(idea)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <MdEdit className="text-base" />
                    Edit
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(idea)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors text-sm ${
                        idea.status === 'active'
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {idea.status === 'active' ? (
                        <>
                          <MdToggleOff className="text-base" />
                          Off
                        </>
                      ) : (
                        <>
                          <MdToggleOn className="text-base" />
                          On
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(idea)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <MdDelete className="text-base" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TrendingIdeaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedIdea(null)
        }}
        onSave={handleSaveIdea}
        idea={selectedIdea}
        adminUserId={adminUserId}
      />

      <DeleteIdeaModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setIdeaToDelete(null)
        }}
        onConfirm={confirmDelete}
        ideaTitle={ideaToDelete?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
