'use client'

import { useState, useEffect } from 'react'
import { firestore, storage } from '@/lib/firebase-config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { MdClose, MdArrowForward, MdArrowBack, MdImage, MdDelete, MdAdd } from 'react-icons/md'
import { saveVendorService } from '@/lib/firestore-services'
import { VendorServiceDoc } from '@/lib/firestore-utils'

type ServiceCategory =
  | 'venue'
  | 'wedding_planner'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'makeup_styling'
  | 'music_entertainment'
  | 'choreography'
  | 'ritual_services'
  | 'wedding_transport'
  | 'invitations_gifting'

type PricingUnit =
  | 'per_day'
  | 'per_event'
  | 'per_slot'
  | 'per_plate'
  | 'per_function'
  | 'per_person'
  | 'per_song'
  | 'per_ceremony'
  | 'per_vehicle_per_day'
  | 'per_piece'
  | 'flat_fee'
  | 'percentage'
  | 'full_package'
  | 'per_hour'
  | 'full_wedding'

const CATEGORIES = {
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

// Replace PRICING_UNIT_BY_CATEGORY with fixed mapping
const PRICING_UNIT_BY_CATEGORY: Record<ServiceCategory, PricingUnit> = {
  venue: 'per_day',
  wedding_planner: 'full_wedding',
  catering: 'per_plate',
  decor: 'per_event',
  photography: 'full_wedding',
  makeup_styling: 'per_person',
  music_entertainment: 'per_hour',
  choreography: 'per_event',
  ritual_services: 'per_event',
  wedding_transport: 'per_vehicle_per_day',
  invitations_gifting: 'per_piece'
}

const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  per_day: 'Per Day',
  per_event: 'Per Event',
  per_slot: 'Per Slot',
  per_plate: 'Per Plate',
  per_function: 'Per Function',
  per_person: 'Per Person',
  per_song: 'Per Song',
  per_ceremony: 'Per Ceremony',
  per_vehicle_per_day: 'Per Vehicle Per Day',
  per_piece: 'Per Piece',
  flat_fee: 'Flat Fee',
  percentage: 'Percentage',
  full_package: 'Full Package',
  per_hour: 'Per Hour',
  full_wedding: 'Full Wedding Package'
}

// Remove PRICING_UNIT_DESCRIPTIONS - no longer needed

interface EditServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service: any
  mode?: 'admin' | 'vendor'
}

interface TagInputProps {
  label: string
  placeholder: string
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (index: number) => void
}

function TagInput({ label, placeholder, tags, onAddTag, onRemoveTag }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <MdAdd className="text-xl" />
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <span>{tag}</span>
              <button type="button" onClick={() => onRemoveTag(index)} className="hover:bg-purple-200 rounded-full p-0.5 transition-colors">
                <MdClose className="text-base" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EditServiceModal({ isOpen, onClose, onSuccess, service, mode = 'vendor' }: EditServiceModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Image states
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // New tag states matching new schema
  const [venueTypesTags, setVenueTypesTags] = useState<string[]>([])
  const [planningTypesTags, setPlanningTypesTags] = useState<string[]>([])
  const [cuisinesTags, setCuisinesTags] = useState<string[]>([])
  const [decorStylesTags, setDecorStylesTags] = useState<string[]>([])
  const [servicesOfferedTags, setServicesOfferedTags] = useState<string[]>([])
  const [deliverablesTags, setDeliverablesTags] = useState<string[]>([])
  const [makeupServicesTags, setMakeupServicesTags] = useState<string[]>([])
  const [makeupTypeTags, setMakeupTypeTags] = useState<string[]>([])
  const [productsUsedTags, setProductsUsedTags] = useState<string[]>([])
  const [musicServicesTags, setMusicServicesTags] = useState<string[]>([])
  const [performanceTypesTags, setPerformanceTypesTags] = useState<string[]>([])
  const [danceStylesTags, setDanceStylesTags] = useState<string[]>([])
  const [religionsSupportedTags, setReligionsSupportedTags] = useState<string[]>([])
  const [ceremoniesCoveredTags, setCeremoniesCoveredTags] = useState<string[]>([])
  const [languagePreferenceTags, setLanguagePreferenceTags] = useState<string[]>([])
  const [vehicleTypesTags, setVehicleTypesTags] = useState<string[]>([])
  const [invitationServicesTags, setInvitationServicesTags] = useState<string[]>([])
  const [highlightsTags, setHighlightsTags] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && service) {
      setFormData(service)
      setExistingImageUrls(service.images || [])
      setImagesToDelete([])
      setNewImages([])
      setNewImagePreviews([])
      setCurrentStep(1)
      
      // Remove pricing unit initialization - will be auto-set
      
      // Initialize tag arrays based on new schema
      setVenueTypesTags(service.venueTypes || [])
      setPlanningTypesTags(service.planningTypes || [])
      setCuisinesTags(service.cuisines || [])
      setDecorStylesTags(service.decorStyles || [])
      setServicesOfferedTags(service.servicesOffered || [])
      setDeliverablesTags(service.deliverables || [])
      setMakeupServicesTags(service.services || [])
      setMakeupTypeTags(service.makeupType || [])
      setProductsUsedTags(service.productsUsed || [])
      setMusicServicesTags(service.services || [])
      setPerformanceTypesTags(service.performanceTypes || [])
      setDanceStylesTags(service.danceStyles || [])
      setReligionsSupportedTags(service.religionsSupported || [])
      setCeremoniesCoveredTags(service.ceremoniesCovered || [])
      setLanguagePreferenceTags(service.languagePreference || [])
      setVehicleTypesTags(service.vehicleTypes || [])
      setInvitationServicesTags(service.servicesOffered || [])
      setHighlightsTags(service.highlights || [])
    }
  }, [isOpen, service])

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  if (!isOpen) return null

  const totalImagesCount = existingImageUrls.length - imagesToDelete.length + newImages.length

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.serviceName?.trim()) newErrors.serviceName = 'Service name required'
    if (!formData.description?.trim()) newErrors.description = 'Description required'
    if (!formData.address?.trim()) newErrors.address = 'Address required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Valid starting price required'
    }
    if (totalImagesCount === 0) {
      newErrors.images = 'At least 1 image is required'
    }
    if (totalImagesCount > 3) {
      newErrors.images = 'Maximum 3 images allowed'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  // Image handling functions
  const handleExistingImageRemove = (imageUrl: string) => {
    setImagesToDelete([...imagesToDelete, imageUrl])
  }

  const handleUndoRemove = (imageUrl: string) => {
    setImagesToDelete(imagesToDelete.filter(url => url !== imageUrl))
  }

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (totalImagesCount + files.length > 3) {
      alert(`You can only add ${3 - totalImagesCount} more image(s). Maximum is 3 images.`)
      return
    }
    
    const errors: string[] = []
    const validFiles: File[] = []
    
    files.forEach(file => {
      if (file.size > 1048576) {
        errors.push(`"${file.name}" is ${(file.size / 1048576).toFixed(2)}MB (max: 1MB)`)
        return
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        errors.push(`"${file.name}" is not a valid image format`)
        return
      }
      
      validFiles.push(file)
    })
    
    if (errors.length > 0) {
      alert('Some files were not added:\n\n' + errors.join('\n'))
    }
    
    if (validFiles.length === 0) return
    
    setNewImages([...newImages, ...validFiles])
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setNewImagePreviews([...newImagePreviews, ...newPreviews])
    setErrors(prev => ({ ...prev, images: '' }))
    e.target.value = ''
  }

  const handleNewImageRemove = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImages(newImages.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const extractStoragePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const match = pathname.match(/\/o\/(.+)/)
      if (match) {
        return decodeURIComponent(match[1])
      }
      return null
    } catch (error) {
      console.error('Error parsing URL:', error)
      return null
    }
  }

  const deleteImagesFromStorage = async (imageUrls: string[]) => {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const path = extractStoragePathFromUrl(url)
        if (path) {
          const storageRef = ref(storage, path)
          await deleteObject(storageRef)
        }
      } catch (error) {
        console.error('Error deleting image:', url, error)
      }
    })
    
    await Promise.all(deletePromises)
  }

  const uploadNewImagesToStorage = async (vendorId: string): Promise<string[]> => {
    setUploadingImages(true)
    setUploadProgress(0)
    const uploadedUrls: string[] = []
    
    try {
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i]
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filename = `services/${vendorId}/${timestamp}_${randomStr}_${sanitizedFileName}`
        const storageRef = ref(storage, filename)
        
        await uploadBytes(storageRef, file)
        const downloadUrl = await getDownloadURL(storageRef)
        uploadedUrls.push(downloadUrl)
        
        setUploadProgress(Math.round(((i + 1) / newImages.length) * 100))
      }
      
      return uploadedUrls
    } catch (error) {
      console.error('Error uploading new images:', error)
      throw new Error('Failed to upload new images')
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async () => {
    if (totalImagesCount === 0) {
      alert('Please keep at least 1 image.')
      setCurrentStep(2)
      return
    }
    
    if (totalImagesCount > 3) {
      alert('Maximum 3 images allowed.')
      setCurrentStep(2)
      return
    }

    // Validate pricing unit belongs to category (security check)
    const category = formData.serviceCategory as ServiceCategory
    const expectedUnit = PRICING_UNIT_BY_CATEGORY[category]
    if (formData.pricingUnit !== expectedUnit) {
      alert('Invalid pricing unit for selected service category. Please try again.')
      return
    }

    setSubmitting(true)
    try {
      // Upload new images FIRST (before deleting old ones)
      let newUploadedUrls: string[] = []
      if (newImages.length > 0) {
        console.log('Uploading new images...')
        newUploadedUrls = await uploadNewImagesToStorage(service.vendorId)
        console.log('New images uploaded:', newUploadedUrls)
      }
      
      // Calculate final image URLs
      const finalImageUrls = [
        ...existingImageUrls.filter(url => !imagesToDelete.includes(url)),
        ...newUploadedUrls
      ]
      
      console.log('Final image URLs:', finalImageUrls)
      
      // Prepare update data with all required fields - avoid undefined values
      const updateData: Partial<VendorServiceDoc> = {
        serviceId: service.serviceId,
        vendorId: service.vendorId,
        serviceName: formData.serviceName.trim(),
        serviceCategory: formData.serviceCategory,
        city: formData.city || service.city,
        cityId: formData.cityId || service.cityId,
        state: formData.state || service.state,
        startingPrice: parseFloat(formData.startingPrice),
        pricingUnit: formData.pricingUnit,
        description: formData.description.trim(),
        experienceYears: parseInt(formData.experienceYears) || 0,
        address: formData.address.trim(),
        images: finalImageUrls,
        ownerName: service.ownerName,
        phoneNumber: service.phoneNumber,
        active: service.active !== undefined ? service.active : true,
        verified: service.verified !== undefined ? service.verified : false
      }

      // Only add optional fields if they have values
      if (formData.googleMapLink?.trim()) {
        updateData.googleMapLink = formData.googleMapLink.trim()
      }
      
      if (service.alternativePhoneNumber) {
        updateData.alternativePhoneNumber = service.alternativePhoneNumber
      }
      
      if (highlightsTags.length > 0) {
        updateData.highlights = highlightsTags
      }

      // Add category-specific fields based on new schema
      if (formData.serviceCategory === 'venue') {
        Object.assign(updateData, {
          venueTypes: venueTypesTags,
          maxCapacity: parseInt(formData.maxCapacity) || 0,
          roomsAvailable: parseInt(formData.roomsAvailable) || 0,
          stayAvailable: formData.stayAvailable === true || formData.stayAvailable === 'true',
          parkingAvailable: formData.parkingAvailable === true || formData.parkingAvailable === 'true',
          inHouseCatering: formData.inHouseCatering === true || formData.inHouseCatering === 'true',
          alcoholAllowed: formData.alcoholAllowed === true || formData.alcoholAllowed === 'true',
          decorationAllowed: formData.decorationAllowed === true || formData.decorationAllowed === 'true',
          djAllowed: formData.djAllowed === true || formData.djAllowed === 'true'
        })
      } else if (formData.serviceCategory === 'wedding_planner') {
        Object.assign(updateData, {
          planningTypes: planningTypesTags,
          destinationWedding: formData.destinationWedding === true || formData.destinationWedding === 'true',
          budgetHandledRange: [
            parseInt(formData.budgetHandledMin) || 0,
            parseInt(formData.budgetHandledMax) || 0
          ],
          vendorNetworkAvailable: formData.vendorNetworkAvailable === true || formData.vendorNetworkAvailable === 'true'
        })
      } else if (formData.serviceCategory === 'catering') {
        Object.assign(updateData, {
          cuisines: cuisinesTags,
          vegOnly: formData.vegOnly === true || formData.vegOnly === 'true',
          jainFoodAvailable: formData.jainFoodAvailable === true || formData.jainFoodAvailable === 'true',
          liveCountersAvailable: formData.liveCountersAvailable === true || formData.liveCountersAvailable === 'true',
          minPlatePrice: parseFloat(formData.minPlatePrice) || 0,
          maxPlatePrice: parseFloat(formData.maxPlatePrice) || 0
        })
      } else if (formData.serviceCategory === 'decor') {
        Object.assign(updateData, {
          decorStyles: decorStylesTags,
          floralDecorAvailable: formData.floralDecorAvailable === true || formData.floralDecorAvailable === 'true',
          lightingIncluded: formData.lightingIncluded === true || formData.lightingIncluded === 'true',
          mandapIncluded: formData.mandapIncluded === true || formData.mandapIncluded === 'true',
          entryDecorIncluded: formData.entryDecorIncluded === true || formData.entryDecorIncluded === 'true',
          coldFireworksAvailable: formData.coldFireworksAvailable === true || formData.coldFireworksAvailable === 'true'
        })
      } else if (formData.serviceCategory === 'photography') {
        const photoData: any = {
          servicesOffered: servicesOfferedTags,
          deliverables: deliverablesTags,
          editingIncluded: formData.editingIncluded === true || formData.editingIncluded === 'true'
        }
        if (formData.deliveryTimeDays) {
          photoData.deliveryTimeDays = parseInt(formData.deliveryTimeDays)
        }
        Object.assign(updateData, photoData)
      } else if (formData.serviceCategory === 'makeup_styling') {
        const makeupData: any = {
          services: makeupServicesTags,
          makeupType: makeupTypeTags,
          trialAvailable: formData.trialAvailable === true || formData.trialAvailable === 'true'
        }
        if (productsUsedTags.length > 0) {
          makeupData.productsUsed = productsUsedTags
        }
        Object.assign(updateData, makeupData)
      } else if (formData.serviceCategory === 'music_entertainment') {
        Object.assign(updateData, {
          services: musicServicesTags,
          soundSystemIncluded: formData.soundSystemIncluded === true || formData.soundSystemIncluded === 'true',
          lightingIncluded: formData.lightingIncluded === true || formData.lightingIncluded === 'true',
          indoorOutdoorSupported: formData.indoorOutdoorSupported === true || formData.indoorOutdoorSupported === 'true'
        })
      } else if (formData.serviceCategory === 'choreography') {
        const choreoData: any = {
          performanceTypes: performanceTypesTags,
          danceStyles: danceStylesTags
        }
        if (formData.rehearsalSessions) {
          choreoData.rehearsalSessions = parseInt(formData.rehearsalSessions)
        }
        Object.assign(updateData, choreoData)
      } else if (formData.serviceCategory === 'ritual_services') {
        const ritualData: any = {
          religionsSupported: religionsSupportedTags,
          ceremoniesCovered: ceremoniesCoveredTags,
          poojaSamagriIncluded: formData.poojaSamagriIncluded === true || formData.poojaSamagriIncluded === 'true'
        }
        if (languagePreferenceTags.length > 0) {
          ritualData.languagePreference = languagePreferenceTags
        }
        Object.assign(updateData, ritualData)
      } else if (formData.serviceCategory === 'wedding_transport') {
        Object.assign(updateData, {
          vehicleTypes: vehicleTypesTags,
          baraatGhodiAvailable: formData.baraatGhodiAvailable === true || formData.baraatGhodiAvailable === 'true',
          decorationIncluded: formData.decorationIncluded === true || formData.decorationIncluded === 'true',
          driverIncluded: formData.driverIncluded === true || formData.driverIncluded === 'true'
        })
      } else if (formData.serviceCategory === 'invitations_gifting') {
        const invitationData: any = {
          servicesOffered: invitationServicesTags,
          customizationAvailable: formData.customizationAvailable === true || formData.customizationAvailable === 'true',
          deliveryAvailable: formData.deliveryAvailable === true || formData.deliveryAvailable === 'true'
        }
        if (formData.minimumOrderQty) {
          invitationData.minimumOrderQty = parseInt(formData.minimumOrderQty)
        }
        Object.assign(updateData, invitationData)
      }
      
      console.log('Updating service with data:', updateData)
      
      // Update service using new Firestore structure
      await saveVendorService(service.serviceId, updateData)
      
      console.log('Service updated successfully')
      
      // Delete old images from storage AFTER successful database update
      if (imagesToDelete.length > 0) {
        console.log('Deleting old images:', imagesToDelete)
        await deleteImagesFromStorage(imagesToDelete)
        console.log('Old images deleted')
      }
      
      // Cleanup preview URLs
      newImagePreviews.forEach(url => URL.revokeObjectURL(url))
      
      alert('Service updated successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error updating service:', error)
      alert(`Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-bold text-white">Edit Service - Step {currentStep}/3</h3>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <MdClose className="text-xl text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-shrink-0 bg-gray-100 h-2">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 h-full transition-all" style={{ width: `${(currentStep / 3) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={formData.serviceName || ''}
                  onChange={(e) => updateField('serviceName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg ${errors.serviceName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.serviceName && <p className="text-sm text-red-600 mt-1">{errors.serviceName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={CATEGORIES[formData.serviceCategory as keyof typeof CATEGORIES] || formData.serviceCategory || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Category cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={formData.experienceYears || ''}
                  onChange={(e) => updateField('experienceYears', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Map Link</label>
                <input
                  type="url"
                  value={formData.googleMapLink || ''}
                  onChange={(e) => updateField('googleMapLink', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Images */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starting Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.startingPrice || ''}
                    onChange={(e) => updateField('startingPrice', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg ${errors.startingPrice ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.startingPrice && <p className="text-sm text-red-600 mt-1">{errors.startingPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit</label>
                  {formData.serviceCategory && formData.pricingUnit ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {PRICING_UNIT_LABELS[formData.pricingUnit as PricingUnit] || formData.pricingUnit}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Pricing unit not set
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Pricing unit is fixed based on category</p>
                </div>
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Images * ({totalImagesCount}/3)
                </label>

                {/* Existing Images */}
                {existingImageUrls.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-xs font-semibold text-gray-600 mb-2">Current Images</h6>
                    <div className="grid grid-cols-3 gap-3">
                      {existingImageUrls.map((url, index) => {
                        const isMarkedForDeletion = imagesToDelete.includes(url)
                        return (
                          <div key={url} className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${isMarkedForDeletion ? 'border-red-500 opacity-50' : 'border-green-500'}`}>
                            <img src={url} alt={`Current ${index + 1}`} className="w-full h-full object-cover" />
                            {isMarkedForDeletion ? (
                              <>
                                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">Will be deleted</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUndoRemove(url)}
                                  className="absolute top-1 right-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  Undo
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExistingImageRemove(url)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100"
                              >
                                <MdDelete className="text-sm" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-xs font-semibold text-gray-600 mb-2">New Images</h6>
                    <div className="grid grid-cols-3 gap-3">
                      {newImagePreviews.map((url, index) => (
                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-500 group">
                          <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleNewImageRemove(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100"
                          >
                            <MdDelete className="text-sm" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                            {(newImages[index].size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Images Button */}
                {totalImagesCount < 3 && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-purple-50 hover:border-purple-500">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleNewImageSelect}
                      className="hidden"
                    />
                    <MdAdd className="text-3xl text-gray-400 mb-1" />
                    <span className="text-xs font-medium text-gray-600">Add {newImages.length > 0 || existingImageUrls.length > 0 ? 'More' : ''} Images</span>
                  </label>
                )}

                {errors.images && <p className="text-sm text-red-600 mt-2">⚠️ {errors.images}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Category-Specific Fields */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                {CATEGORIES[formData.serviceCategory as keyof typeof CATEGORIES] || formData.serviceCategory} - Specific Details
              </h4>

              {/* VENUE */}
              {formData.serviceCategory === 'venue' && (
                <>
                  <TagInput
                    label="Venue Types"
                    placeholder="e.g., Lawn, Banquet, Resort"
                    tags={venueTypesTags}
                    onAddTag={(tag) => setVenueTypesTags([...venueTypesTags, tag])}
                    onRemoveTag={(index) => setVenueTypesTags(venueTypesTags.filter((_, i) => i !== index))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                    <input type="number" value={formData.maxCapacity || ''} onChange={(e) => updateField('maxCapacity', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rooms Available</label>
                    <input type="number" value={formData.roomsAvailable || ''} onChange={(e) => updateField('roomsAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stay Available?</label>
                      <select value={formData.stayAvailable?.toString() || ''} onChange={(e) => updateField('stayAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parking Available?</label>
                      <select value={formData.parkingAvailable?.toString() || ''} onChange={(e) => updateField('parkingAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">In-House Catering?</label>
                      <select value={formData.inHouseCatering?.toString() || ''} onChange={(e) => updateField('inHouseCatering', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alcohol Allowed?</label>
                      <select value={formData.alcoholAllowed?.toString() || ''} onChange={(e) => updateField('alcoholAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decoration Allowed?</label>
                      <select value={formData.decorationAllowed?.toString() || ''} onChange={(e) => updateField('decorationAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DJ Allowed?</label>
                      <select value={formData.djAllowed?.toString() || ''} onChange={(e) => updateField('djAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* WEDDING PLANNER */}
              {formData.serviceCategory === 'wedding_planner' && (
                <>
                  <TagInput
                    label="Planning Types"
                    placeholder="e.g., Full Planning, Partial Planning, Day Coordination"
                    tags={planningTypesTags}
                    onAddTag={(tag) => setPlanningTypesTags([...planningTypesTags, tag])}
                    onRemoveTag={(index) => setPlanningTypesTags(planningTypesTags.filter((_, i) => i !== index))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Wedding?</label>
                    <select value={formData.destinationWedding?.toString() || ''} onChange={(e) => updateField('destinationWedding', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budget Handled Min (₹)</label>
                      <input type="number" value={formData.budgetHandledMin || ''} onChange={(e) => updateField('budgetHandledMin', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="500000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budget Handled Max (₹)</label>
                      <input type="number" value={formData.budgetHandledMax || ''} onChange={(e) => updateField('budgetHandledMax', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="5000000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Network Available?</label>
                    <select value={formData.vendorNetworkAvailable?.toString() || ''} onChange={(e) => updateField('vendorNetworkAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}

              {/* CATERING */}
              {formData.serviceCategory === 'catering' && (
                <>
                  <TagInput
                    label="Cuisines"
                    placeholder="e.g., North Indian, South Indian, Chinese"
                    tags={cuisinesTags}
                    onAddTag={(tag) => setCuisinesTags([...cuisinesTags, tag])}
                    onRemoveTag={(index) => setCuisinesTags(cuisinesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Veg Only?</label>
                      <select value={formData.vegOnly?.toString() || ''} onChange={(e) => updateField('vegOnly', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jain Food Available?</label>
                      <select value={formData.jainFoodAvailable?.toString() || ''} onChange={(e) => updateField('jainFoodAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Live Counters?</label>
                      <select value={formData.liveCountersAvailable?.toString() || ''} onChange={(e) => updateField('liveCountersAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Plate Price (₹)</label>
                      <input type="number" value={formData.minPlatePrice || ''} onChange={(e) => updateField('minPlatePrice', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Plate Price (₹)</label>
                      <input type="number" value={formData.maxPlatePrice || ''} onChange={(e) => updateField('maxPlatePrice', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="2000" />
                    </div>
                  </div>
                </>
              )}

              {/* DECOR */}
              {formData.serviceCategory === 'decor' && (
                <>
                  <TagInput
                    label="Decor Styles"
                    placeholder="e.g., Royal, Vintage, Floral, Contemporary"
                    tags={decorStylesTags}
                    onAddTag={(tag) => setDecorStylesTags([...decorStylesTags, tag])}
                    onRemoveTag={(index) => setDecorStylesTags(decorStylesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floral Decor Available?</label>
                      <select value={formData.floralDecorAvailable?.toString() || ''} onChange={(e) => updateField('floralDecorAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lighting Included?</label>
                      <select value={formData.lightingIncluded?.toString() || ''} onChange={(e) => updateField('lightingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mandap Included?</label>
                      <select value={formData.mandapIncluded?.toString() || ''} onChange={(e) => updateField('mandapIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Decor?</label>
                      <select value={formData.entryDecorIncluded?.toString() || ''} onChange={(e) => updateField('entryDecorIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cold Fireworks?</label>
                      <select value={formData.coldFireworksAvailable?.toString() || ''} onChange={(e) => updateField('coldFireworksAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* PHOTOGRAPHY */}
              {formData.serviceCategory === 'photography' && (
                <>
                  <TagInput
                    label="Services Offered"
                    placeholder="e.g., Photography, Videography, Drone, Pre-Wedding"
                    tags={servicesOfferedTags}
                    onAddTag={(tag) => setServicesOfferedTags([...servicesOfferedTags, tag])}
                    onRemoveTag={(index) => setServicesOfferedTags(servicesOfferedTags.filter((_, i) => i !== index))}
                  />
                  <TagInput
                    label="Deliverables"
                    placeholder="e.g., HD Photos, 4K Video, Album, USB Drive"
                    tags={deliverablesTags}
                    onAddTag={(tag) => setDeliverablesTags([...deliverablesTags, tag])}
                    onRemoveTag={(index) => setDeliverablesTags(deliverablesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editing Included?</label>
                      <select value={formData.editingIncluded?.toString() || ''} onChange={(e) => updateField('editingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time (Days)</label>
                      <input type="number" value={formData.deliveryTimeDays || ''} onChange={(e) => updateField('deliveryTimeDays', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="30" />
                    </div>
                  </div>
                </>
              )}

              {/* MAKEUP & STYLING */}
              {formData.serviceCategory === 'makeup_styling' && (
                <>
                  <TagInput
                    label="Services"
                    placeholder="e.g., Bridal Makeup, Hair Styling, Draping, Mehendi"
                    tags={makeupServicesTags}
                    onAddTag={(tag) => setMakeupServicesTags([...makeupServicesTags, tag])}
                    onRemoveTag={(index) => setMakeupServicesTags(makeupServicesTags.filter((_, i) => i !== index))}
                  />
                  <TagInput
                    label="Makeup Type"
                    placeholder="e.g., HD, Airbrush, Traditional"
                    tags={makeupTypeTags}
                    onAddTag={(tag) => setMakeupTypeTags([...makeupTypeTags, tag])}
                    onRemoveTag={(index) => setMakeupTypeTags(makeupTypeTags.filter((_, i) => i !== index))}
                  />
                  <TagInput
                    label="Products Used"
                    placeholder="e.g., MAC, Huda Beauty, Lakme"
                    tags={productsUsedTags}
                    onAddTag={(tag) => setProductsUsedTags([...productsUsedTags, tag])}
                    onRemoveTag={(index) => setProductsUsedTags(productsUsedTags.filter((_, i) => i !== index))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trial Available?</label>
                    <select value={formData.trialAvailable?.toString() || ''} onChange={(e) => updateField('trialAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}

              {/* MUSIC & ENTERTAINMENT */}
              {formData.serviceCategory === 'music_entertainment' && (
                <>
                  <TagInput
                    label="Services"
                    placeholder="e.g., DJ, Live Band, Dhol, Singer"
                    tags={musicServicesTags}
                    onAddTag={(tag) => setMusicServicesTags([...musicServicesTags, tag])}
                    onRemoveTag={(index) => setMusicServicesTags(musicServicesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sound System?</label>
                      <select value={formData.soundSystemIncluded?.toString() || ''} onChange={(e) => updateField('soundSystemIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lighting?</label>
                      <select value={formData.lightingIncluded?.toString() || ''} onChange={(e) => updateField('lightingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indoor/Outdoor?</label>
                      <select value={formData.indoorOutdoorSupported?.toString() || ''} onChange={(e) => updateField('indoorOutdoorSupported', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* CHOREOGRAPHY */}
              {formData.serviceCategory === 'choreography' && (
                <>
                  <TagInput
                    label="Performance Types"
                    placeholder="e.g., Couple Dance, Group Dance, Flash Mob"
                    tags={performanceTypesTags}
                    onAddTag={(tag) => setPerformanceTypesTags([...performanceTypesTags, tag])}
                    onRemoveTag={(index) => setPerformanceTypesTags(performanceTypesTags.filter((_, i) => i !== index))}
                  />
                  <TagInput
                    label="Dance Styles"
                    placeholder="e.g., Bollywood, Contemporary, Classical"
                    tags={danceStylesTags}
                    onAddTag={(tag) => setDanceStylesTags([...danceStylesTags, tag])}
                    onRemoveTag={(index) => setDanceStylesTags(danceStylesTags.filter((_, i) => i !== index))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rehearsal Sessions Included</label>
                    <input type="number" value={formData.rehearsalSessions || ''} onChange={(e) => updateField('rehearsalSessions', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="5" />
                  </div>
                </>
              )}

              {/* RITUAL SERVICES */}
              {formData.serviceCategory === 'ritual_services' && (
                <>
                  <TagInput
                    label="Religions Supported"
                    placeholder="e.g., Hindu, Sikh, Jain"
                    tags={religionsSupportedTags}
                    onAddTag={(tag) => setReligionsSupportedTags([...religionsSupportedTags, tag])}
                    onRemoveTag={(index) => setReligionsSupportedTags(religionsSupportedTags.filter((_, i) => i !== index))}
                  />
                  <TagInput
                    label="Ceremonies Covered"
                    placeholder="e.g., Wedding, Engagement, Haldi, Mehendi"
                    tags={ceremoniesCoveredTags}
                    onAddTag={(tag) => setCeremoniesCoveredTags([...ceremoniesCoveredTags, tag])}
                    onRemoveTag={(index) => setCeremoniesCoveredTags(ceremoniesCoveredTags.filter((_, i) => i !== index))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pooja Samagri Included?</label>
                    <select value={formData.poojaSamagriIncluded?.toString() || ''} onChange={(e) => updateField('poojaSamagriIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <TagInput
                    label="Language Preference"
                    placeholder="e.g., Hindi, Sanskrit, Punjabi"
                    tags={languagePreferenceTags}
                    onAddTag={(tag) => setLanguagePreferenceTags([...languagePreferenceTags, tag])}
                    onRemoveTag={(index) => setLanguagePreferenceTags(languagePreferenceTags.filter((_, i) => i !== index))}
                  />
                </>
              )}

              {/* WEDDING TRANSPORT */}
              {formData.serviceCategory === 'wedding_transport' && (
                <>
                  <TagInput
                    label="Vehicle Types"
                    placeholder="e.g., Luxury Car, Vintage Car, Decorated Car, Bus"
                    tags={vehicleTypesTags}
                    onAddTag={(tag) => setVehicleTypesTags([...vehicleTypesTags, tag])}
                    onRemoveTag={(index) => setVehicleTypesTags(vehicleTypesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Baraat/Ghodi?</label>
                      <select value={formData.baraatGhodiAvailable?.toString() || ''} onChange={(e) => updateField('baraatGhodiAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decoration?</label>
                      <select value={formData.decorationIncluded?.toString() || ''} onChange={(e) => updateField('decorationIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Driver Included?</label>
                      <select value={formData.driverIncluded?.toString() || ''} onChange={(e) => updateField('driverIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* INVITATIONS & GIFTING */}
              {formData.serviceCategory === 'invitations_gifting' && (
                <>
                  <TagInput
                    label="Services Offered"
                    placeholder="e.g., Wedding Cards, Gift Hampers, Packaging"
                    tags={invitationServicesTags}
                    onAddTag={(tag) => setInvitationServicesTags([...invitationServicesTags, tag])}
                    onRemoveTag={(index) => setInvitationServicesTags(invitationServicesTags.filter((_, i) => i !== index))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customization Available?</label>
                      <select value={formData.customizationAvailable?.toString() || ''} onChange={(e) => updateField('customizationAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
                      <input type="number" value={formData.minimumOrderQty || ''} onChange={(e) => updateField('minimumOrderQty', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Available?</label>
                    <select value={formData.deliveryAvailable?.toString() || ''} onChange={(e) => updateField('deliveryAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}

              {/* HIGHLIGHTS (Optional - For All Categories) */}
              <div className="pt-6 border-t border-gray-200">
                <TagInput
                  label="Key Highlights (Optional)"
                  placeholder="e.g., 500+ weddings, Luxury destination specialist"
                  tags={highlightsTags}
                  onAddTag={(tag) => {
                    if (tag.length <= 100) {
                      setHighlightsTags([...highlightsTags, tag])
                    } else {
                      alert('Each highlight must be 100 characters or less')
                    }
                  }}
                  onRemoveTag={(index) => setHighlightsTags(highlightsTags.filter((_, i) => i !== index))}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Add key highlights to attract customers
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between flex-shrink-0">
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)} 
              disabled={submitting || uploadingImages}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 flex items-center gap-2 disabled:opacity-50"
            >
              <MdArrowBack />
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button onClick={handleNext} className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg flex items-center gap-2">
              Next
              <MdArrowForward />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting || uploadingImages} 
              className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading {uploadProgress}%
                </>
              ) : submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Update Service'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
