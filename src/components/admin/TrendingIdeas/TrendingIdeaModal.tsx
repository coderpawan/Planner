'use client'

import React, { useState, useEffect } from 'react'
import { TrendingIdea } from '@/lib/firestore-trending-ideas'
import { MdClose, MdCloudUpload, MdImage, MdVideoLibrary } from 'react-icons/md'
import { storage } from '@/lib/firebase-config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Image from 'next/image'

interface TrendingIdeaModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<TrendingIdea, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  idea?: TrendingIdea | null
  adminUserId: string
}

export default function TrendingIdeaModal({ isOpen, onClose, onSave, idea, adminUserId }: TrendingIdeaModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    videoType: 'youtube' as 'youtube' | 'mp4',
    videoUrl: '',
    thumbnailUrl: '',
    theme: '',
    cultureTags: [] as string[],
    relatedServices: [] as string[],
    budgetMin: '',
    budgetMax: '',
    cityPreference: [] as string[],
    isTrending: false,
    priority: '0',
    status: 'active' as 'active' | 'inactive'
  })

  const [cultureTagInput, setCultureTagInput] = useState('')
  const [relatedServiceInput, setRelatedServiceInput] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoFileName, setVideoFileName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title || '',
        shortDescription: idea.shortDescription || '',
        longDescription: idea.longDescription || '',
        videoType: idea.videoType || 'youtube',
        videoUrl: idea.videoUrl || '',
        thumbnailUrl: idea.thumbnailUrl || '',
        theme: idea.theme || '',
        cultureTags: idea.cultureTags || [],
        relatedServices: idea.relatedServices || [],
        budgetMin: idea.estimatedBudgetRange?.min?.toString() || '',
        budgetMax: idea.estimatedBudgetRange?.max?.toString() || '',
        cityPreference: idea.cityPreference || [],
        isTrending: idea.isTrending || false,
        priority: idea.priority?.toString() || '0',
        status: idea.status || 'active'
      })
      setThumbnailPreview(idea.thumbnailUrl || '')
      setVideoFileName('')
    } else {
      setFormData({
        title: '',
        shortDescription: '',
        longDescription: '',
        videoType: 'youtube',
        videoUrl: '',
        thumbnailUrl: '',
        theme: '',
        cultureTags: [],
        relatedServices: [],
        budgetMin: '',
        budgetMax: '',
        cityPreference: [],
        isTrending: false,
        priority: '0',
        status: 'active'
      })
      setThumbnailPreview('')
      setVideoFileName('')
    }
    setThumbnailFile(null)
    setVideoFile(null)
    setCultureTagInput('')
    setRelatedServiceInput('')
    setCityInput('')
    setErrors({})
  }, [idea, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.theme.trim()) {
      newErrors.theme = 'Theme is required'
    }

    if (formData.videoType === 'youtube' && !formData.videoUrl.trim()) {
      newErrors.videoUrl = 'YouTube URL is required'
    }

    if (formData.videoType === 'mp4' && !formData.videoUrl && !videoFile) {
      newErrors.videoUrl = 'Please upload a video file'
    }

    const budgetMin = parseFloat(formData.budgetMin)
    const budgetMax = parseFloat(formData.budgetMax)

    if (formData.budgetMin && formData.budgetMax) {
      if (isNaN(budgetMin) || isNaN(budgetMax)) {
        newErrors.budget = 'Budget values must be numbers'
      } else if (budgetMin > budgetMax) {
        newErrors.budget = 'Minimum budget must be less than or equal to maximum budget'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddCultureTag = () => {
    const tag = cultureTagInput.trim()
    if (tag && !formData.cultureTags.includes(tag)) {
      setFormData({ ...formData, cultureTags: [...formData.cultureTags, tag] })
      setCultureTagInput('')
    }
  }

  const handleRemoveCultureTag = (index: number) => {
    setFormData({
      ...formData,
      cultureTags: formData.cultureTags.filter((_, i) => i !== index)
    })
  }

  const handleAddRelatedService = () => {
    const service = relatedServiceInput.trim()
    if (service && !formData.relatedServices.includes(service)) {
      setFormData({ ...formData, relatedServices: [...formData.relatedServices, service] })
      setRelatedServiceInput('')
    }
  }

  const handleRemoveRelatedService = (index: number) => {
    setFormData({
      ...formData,
      relatedServices: formData.relatedServices.filter((_, i) => i !== index)
    })
  }

  const handleAddCity = () => {
    const city = cityInput.trim()
    if (city && !formData.cityPreference.includes(city)) {
      setFormData({ ...formData, cityPreference: [...formData.cityPreference, city] })
      setCityInput('')
    }
  }

  const handleRemoveCity = (index: number) => {
    setFormData({
      ...formData,
      cityPreference: formData.cityPreference.filter((_, i) => i !== index)
    })
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select an image file')
      }
    }
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file)
        setVideoFileName(file.name)
      } else {
        alert('Please select a video file')
      }
    }
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `${folder}/${fileName}`)
    
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSaving(true)
    setIsUploading(true)

    try {
      let thumbnailUrl = formData.thumbnailUrl
      let videoUrl = formData.videoUrl

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'trending_ideas/thumbnails')
      }

      // Upload video if MP4 type and file selected
      if (formData.videoType === 'mp4' && videoFile) {
        videoUrl = await uploadFile(videoFile, 'trending_ideas/videos')
      }
      const data: Omit<TrendingIdea, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.longDescription.trim(),
        videoType: formData.videoType,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        theme: formData.theme.trim(),
        cultureTags: formData.cultureTags,
        relatedServices: formData.relatedServices,
        estimatedBudgetRange: {
          min: parseFloat(formData.budgetMin) || 0,
          max: parseFloat(formData.budgetMax) || 0
        },
        cityPreference: formData.cityPreference,
        isTrending: formData.isTrending,
        priority: parseInt(formData.priority) || 0,
        status: formData.status,
        createdBy: idea?.createdBy || adminUserId
      }

      await onSave(data)
      onClose()
    } catch (error) {
      console.error('Error saving trending idea:', error)
      alert('Failed to save trending idea. Please try again.')
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {idea ? 'Edit Trending Idea' : 'Add Trending Idea'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSaving}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isSaving}
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Long Description
            </label>
            <textarea
              value={formData.longDescription}
              onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isSaving}
            />
          </div>

          {/* Video Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="youtube"
                  checked={formData.videoType === 'youtube'}
                  onChange={(e) => {
                    setFormData({ ...formData, videoType: e.target.value as 'youtube' | 'mp4', videoUrl: '' })
                    setVideoFile(null)
                    setVideoFileName('')
                  }}
                  className="mr-2"
                  disabled={isSaving}
                />
                YouTube URL
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mp4"
                  checked={formData.videoType === 'mp4'}
                  onChange={(e) => {
                    setFormData({ ...formData, videoType: e.target.value as 'youtube' | 'mp4', videoUrl: '' })
                  }}
                  className="mr-2"
                  disabled={isSaving}
                />
                Upload Video
              </label>
            </div>
          </div>

          {/* Video URL or File Upload */}
          {formData.videoType === 'youtube' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.videoUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isSaving}
              />
              {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                  id="video-upload"
                  disabled={isSaving}
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <MdVideoLibrary className="text-5xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">
                    {videoFileName || (formData.videoUrl && !videoFile ? 'Video already uploaded' : 'Click to upload video')}
                  </p>
                  <p className="text-sm text-gray-500">MP4, MOV, AVI, etc.</p>
                </label>
              </div>
              {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl}</p>}
            </div>
          )}

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
                disabled={isSaving}
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                {thumbnailPreview ? (
                  <div className="relative w-full h-48 mb-2">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <>
                    <MdImage className="text-5xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1">Click to upload thumbnail</p>
                    <p className="text-sm text-gray-500">PNG, JPG, JPEG, etc.</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                errors.theme ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSaving}
            >
              <option value="">Select a theme</option>
              <option value="Royal Rajasthani">Royal Rajasthani</option>
              <option value="South Indian Temple">South Indian Temple</option>
              <option value="Punjabi Big Fat Wedding">Punjabi Big Fat Wedding</option>
              <option value="Minimal Pastel">Minimal Pastel</option>
              <option value="Modern Luxe">Modern Luxe</option>
              <option value="Beach Wedding">Beach Wedding</option>
              <option value="Floral Fantasy">Floral Fantasy</option>
              <option value="Vintage Heritage">Vintage Heritage</option>
              <option value="Bengali Traditional">Bengali Traditional</option>
              <option value="Small Intimate Wedding">Small Intimate Wedding</option>
            </select>
            {errors.theme && <p className="text-red-500 text-sm mt-1">{errors.theme}</p>}
          </div>

          {/* Culture Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culture Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cultureTagInput}
                onChange={(e) => setCultureTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCultureTag())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter culture tag"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleAddCultureTag}
                disabled={isSaving || !cultureTagInput.trim()}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {formData.cultureTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.cultureTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveCultureTag(index)}
                      disabled={isSaving}
                      className="hover:text-blue-900 disabled:opacity-50"
                    >
                      <MdClose className="text-lg" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Related Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Services
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={relatedServiceInput}
                onChange={(e) => setRelatedServiceInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRelatedService())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter service name"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleAddRelatedService}
                disabled={isSaving || !relatedServiceInput.trim()}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {formData.relatedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.relatedServices.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => handleRemoveRelatedService(index)}
                      disabled={isSaving}
                      className="hover:text-green-900 disabled:opacity-50"
                    >
                      <MdClose className="text-lg" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Budget (₹)
              </label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Budget (₹)
              </label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isSaving}
              />
            </div>
          </div>
          {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}

          {/* City Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City Preferences
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCity())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter city name"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleAddCity}
                disabled={isSaving || !cityInput.trim()}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {formData.cityPreference.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.cityPreference.map((city, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(index)}
                      disabled={isSaving}
                      className="hover:text-purple-900 disabled:opacity-50"
                    >
                      <MdClose className="text-lg" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (higher = more prominent)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              min="0"
              disabled={isSaving}
            />
          </div>

          {/* Is Trending */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isTrending"
              checked={formData.isTrending}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              disabled={isSaving}
            />
            <label htmlFor="isTrending" className="ml-2 text-sm font-medium text-gray-700">
              Mark as Trending
            </label>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isSaving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (isUploading ? 'Uploading...' : 'Saving...') : idea ? 'Update Idea' : 'Create Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
