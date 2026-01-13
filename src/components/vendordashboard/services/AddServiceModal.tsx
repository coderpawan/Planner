'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { firestore, storage } from '@/lib/firebase-config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { MdClose, MdArrowForward, MdArrowBack, MdAdd, MdImage, MdDelete } from 'react-icons/md'
import { saveVendorService, getCategoryLabelsMap } from '@/lib/firestore-services'
import { normalizeCityId, normalizeServiceCategory, VendorServiceDoc } from '@/lib/firestore-utils'

interface ServiceFormData {
  serviceName: string
  serviceCategory: string
  city: string
  state: string
  startingPrice: string
  pricingUnit: string
  description: string
  experienceYears: string
  address: string
  googleMapLink: string
  // Category-specific fields will be added dynamically
  [key: string]: any
}

interface VendorCity {
  city: string
  state: string
}

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

// Categories will be loaded dynamically from Firestore
// This is just kept for type reference in PRICING_UNIT_BY_CATEGORY
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

const PRICING_UNIT_DESCRIPTIONS: Record<PricingUnit, string> = {
  per_day: 'Charges apply for each full day of service',
  per_event: 'One full wedding occasion (e.g., Reception)',
  per_slot: 'Fixed time slot (e.g., 4-6 hours)',
  per_plate: 'Cost per guest',
  per_function: 'One function like Haldi, Mehendi, Wedding',
  per_person: 'Cost per individual (e.g., bride, groom, family member)',
  per_song: 'Per choreographed song performance',
  per_ceremony: 'One ritual performed by priest',
  per_vehicle_per_day: 'Per vehicle for one day',
  per_piece: 'Per invitation card or gift item',
  flat_fee: 'Fixed amount for entire service',
  percentage: 'Percentage of total wedding budget',
  full_package: 'Complete package including all deliverables',
  per_hour: 'Charges apply per hour of service',
  full_wedding: 'Complete package for the entire wedding'
}

// Add new component for tag input
interface TagInputProps {
  label: string
  placeholder: string
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (index: number) => void
  error?: string
}

function TagInput({ label, placeholder, tags, onAddTag, onRemoveTag, error }: TagInputProps) {
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
          className={`flex-1 px-4 py-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}
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
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(index)}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
              >
                <MdClose className="text-base" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vendorId?: string
  mode?: 'admin' | 'vendor'
}

export default function AddServiceModal({ isOpen, onClose, onSuccess, vendorId: propVendorId, mode = 'vendor' }: AddServiceModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceName: '',
    serviceCategory: '',
    city: '',
    state: '',
    startingPrice: '',
    pricingUnit: '',
    description: '',
    experienceYears: '',
    address: '',
    googleMapLink: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [vendorCities, setVendorCities] = useState<VendorCity[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Remove allowedPricingUnits state - no longer needed

  // Remove old tag states and add new ones
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
  
  // Add image-related states
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageUploadProgress, setImageUploadProgress] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchVendorCities()
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const labelsMap = await getCategoryLabelsMap()
      setCategories(labelsMap)
    } catch (error) {
      console.error('Error fetching categories:', error)
      alert('Failed to load service categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchVendorCities = async () => {
    setLoadingCities(true)
    try {
      // Use propVendorId if provided (admin mode), otherwise get from localStorage
      const vendorId = propVendorId || localStorage.getItem('vendorId')
      if (!vendorId) {
        alert('Vendor ID not found')
        return
      }

      // Fetch vendor profile from VerifiedVendors collection
      const vendorDoc = await getDoc(doc(firestore, 'VerifiedVendors', vendorId))
      console.log('Vendor Doc:', vendorDoc);
      
      if (vendorDoc.exists()) {
        const vendorData = vendorDoc.data()
        // Extract cities array from vendor profile
        const cities = vendorData.cities || []
        setVendorCities(cities)
        
        // If only one city, auto-select it
        if (cities.length === 1) {
          setFormData(prev => ({
            ...prev,
            city: cities[0].city,
            state: cities[0].state
          }))
        }
      } else {
        console.error('Vendor profile not found')
        alert('Vendor profile not found. Please contact support.')
      }
    } catch (error) {
      console.error('Error fetching vendor cities:', error)
      alert('Failed to load vendor cities')
    } finally {
      setLoadingCities(false)
    }
  }

  if (!isOpen) return null

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.serviceName.trim()) newErrors.serviceName = 'Service name required'
    if (!formData.serviceCategory) newErrors.serviceCategory = 'Category required'
    if (!formData.city.trim()) newErrors.city = 'City required'
    if (!formData.state) newErrors.state = 'State required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Valid starting price required'
    }
    if (!formData.description.trim()) newErrors.description = 'Description required'
    if (!formData.address.trim()) newErrors.address = 'Address required'
    
    // Validate images
    if (selectedImages.length === 0) {
      newErrors.images = 'At least 1 image is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate category-specific required fields
    if (formData.serviceCategory === 'venue') {
      if (venueTypesTags.length === 0) newErrors.venueTypes = 'At least one venue type is required'
      if (!formData.maxCapacity || parseInt(formData.maxCapacity) <= 0) {
        newErrors.maxCapacity = 'Valid max capacity required'
      }
    } else if (formData.serviceCategory === 'wedding_planner') {
      if (planningTypesTags.length === 0) newErrors.planningTypes = 'At least one planning type is required'
    } else if (formData.serviceCategory === 'catering') {
      if (cuisinesTags.length === 0) newErrors.cuisines = 'At least one cuisine type is required'
      if (!formData.minPlatePrice || parseFloat(formData.minPlatePrice) <= 0) {
        newErrors.minPlatePrice = 'Valid min plate price required'
      }
    } else if (formData.serviceCategory === 'decor') {
      if (decorStylesTags.length === 0) newErrors.decorStyles = 'At least one decor style is required'
    } else if (formData.serviceCategory === 'photography') {
      if (servicesOfferedTags.length === 0) newErrors.servicesOffered = 'At least one service type is required'
      if (deliverablesTags.length === 0) newErrors.deliverables = 'At least one deliverable is required'
    } else if (formData.serviceCategory === 'makeup_styling') {
      if (makeupServicesTags.length === 0) newErrors.services = 'At least one service type is required'
      if (makeupTypeTags.length === 0) newErrors.makeupType = 'At least one makeup type is required'
    } else if (formData.serviceCategory === 'music_entertainment') {
      if (musicServicesTags.length === 0) newErrors.services = 'At least one service type is required'
    } else if (formData.serviceCategory === 'choreography') {
      if (performanceTypesTags.length === 0) newErrors.performanceTypes = 'At least one performance type is required'
      if (danceStylesTags.length === 0) newErrors.danceStyles = 'At least one dance style is required'
    } else if (formData.serviceCategory === 'ritual_services') {
      if (religionsSupportedTags.length === 0) newErrors.religionsSupported = 'At least one religion is required'
      if (ceremoniesCoveredTags.length === 0) newErrors.ceremoniesCovered = 'At least one ceremony type is required'
    } else if (formData.serviceCategory === 'wedding_transport') {
      if (vehicleTypesTags.length === 0) newErrors.vehicleTypes = 'At least one vehicle type is required'
    } else if (formData.serviceCategory === 'invitations_gifting') {
      if (invitationServicesTags.length === 0) newErrors.servicesOffered = 'At least one service type is required'
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

  const uploadImagesToStorage = async (vendorId: string): Promise<string[]> => {
    setUploadingImages(true)
    setImageUploadProgress(0)
    const imageUrls: string[] = []
    
    try {
      const totalImages = selectedImages.length
      
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i]
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filename = `services/${vendorId}/${timestamp}_${randomStr}_${sanitizedFileName}`
        const storageRef = ref(storage, filename)
        
        // Upload file
        await uploadBytes(storageRef, file)
        
        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef)
        imageUrls.push(downloadUrl)
        
        // Update progress
        setImageUploadProgress(Math.round(((i + 1) / totalImages) * 100))
      }
      
      return imageUrls
    } catch (error) {
      console.error('Error uploading images:', error)
      throw new Error('Failed to upload images. Please try again.')
    } finally {
      setUploadingImages(false)
      setImageUploadProgress(0)
    }
  }

  const handleSubmit = async () => {
    // Validate Step 3 before submitting
    if (!validateStep3()) {
      return
    }

    // Final validation before submit
    if (selectedImages.length === 0) {
      alert('Please add at least 1 image before submitting.')
      setCurrentStep(2)
      return
    }
    
    if (selectedImages.length > 3) {
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
      // Use propVendorId if provided (admin mode), otherwise get from localStorage
      const vendorId = propVendorId || localStorage.getItem('vendorId')
      if (!vendorId) throw new Error('Vendor ID not found')

      // Fetch vendor details
      const vendorDoc = await getDoc(doc(firestore, 'VerifiedVendors', vendorId))
      if (!vendorDoc.exists()) {
        throw new Error('Vendor profile not found')
      }
      
      const vendorData = vendorDoc.data()
      
      // Upload images to storage (only happens on final submit)
      const imageUrls = await uploadImagesToStorage(vendorId)

      // Generate service ID
      const serviceId = `${vendorId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Prepare service data - only include fields that have values
      const serviceData: Partial<VendorServiceDoc> = {
        serviceId,
        vendorId,
        serviceName: formData.serviceName.trim(),
        serviceCategory: formData.serviceCategory,
        city: formData.city.trim(),
        cityId: normalizeCityId(formData.city.trim()),
        state: formData.state,
        startingPrice: parseFloat(formData.startingPrice),
        pricingUnit: formData.pricingUnit,
        description: formData.description.trim(),
        experienceYears: parseInt(formData.experienceYears) || 0,
        address: formData.address.trim(),
        images: imageUrls,
        ownerName: vendorData.ownerName || '',
        phoneNumber: vendorData.phoneNumber || '',
        active: true,
        verified: false
      }

      // Only add optional fields if they have values
      if (formData.googleMapLink?.trim()) {
        serviceData.googleMapLink = formData.googleMapLink.trim()
      }
      
      if (vendorData.alternativePhoneNumber) {
        serviceData.alternativePhoneNumber = vendorData.alternativePhoneNumber
      }
      
      if (highlightsTags.length > 0) {
        serviceData.highlights = highlightsTags
      }

      // Add category-specific fields
      if (formData.serviceCategory === 'venue') {
        Object.assign(serviceData, {
          venueTypes: venueTypesTags,
          maxCapacity: parseInt(formData.maxCapacity) || 0,
          roomsAvailable: parseInt(formData.roomsAvailable) || 0,
          stayAvailable: formData.stayAvailable === 'true',
          parkingAvailable: formData.parkingAvailable === 'true',
          inHouseCatering: formData.inHouseCatering === 'true',
          alcoholAllowed: formData.alcoholAllowed === 'true',
          decorationAllowed: formData.decorationAllowed === 'true',
          djAllowed: formData.djAllowed === 'true'
        })
      } else if (formData.serviceCategory === 'wedding_planner') {
        Object.assign(serviceData, {
          planningTypes: planningTypesTags,
          destinationWedding: formData.destinationWedding === 'true',
          budgetHandledRange: [
            parseInt(formData.budgetHandledMin) || 0,
            parseInt(formData.budgetHandledMax) || 0
          ],
          vendorNetworkAvailable: formData.vendorNetworkAvailable === 'true'
        })
      } else if (formData.serviceCategory === 'catering') {
        Object.assign(serviceData, {
          cuisines: cuisinesTags,
          vegOnly: formData.vegOnly === 'true',
          jainFoodAvailable: formData.jainFoodAvailable === 'true',
          liveCountersAvailable: formData.liveCountersAvailable === 'true',
          minPlatePrice: parseFloat(formData.minPlatePrice) || 0,
          maxPlatePrice: parseFloat(formData.maxPlatePrice) || 0
        })
      } else if (formData.serviceCategory === 'decor') {
        Object.assign(serviceData, {
          decorStyles: decorStylesTags,
          floralDecorAvailable: formData.floralDecorAvailable === 'true',
          lightingIncluded: formData.lightingIncluded === 'true',
          mandapIncluded: formData.mandapIncluded === 'true',
          entryDecorIncluded: formData.entryDecorIncluded === 'true',
          coldFireworksAvailable: formData.coldFireworksAvailable === 'true'
        })
      } else if (formData.serviceCategory === 'photography') {
        const photoData: any = {
          servicesOffered: servicesOfferedTags,
          deliverables: deliverablesTags,
          editingIncluded: formData.editingIncluded === 'true'
        }
        if (formData.deliveryTimeDays) {
          photoData.deliveryTimeDays = parseInt(formData.deliveryTimeDays)
        }
        Object.assign(serviceData, photoData)
      } else if (formData.serviceCategory === 'makeup_styling') {
        const makeupData: any = {
          services: makeupServicesTags,
          makeupType: makeupTypeTags,
          trialAvailable: formData.trialAvailable === 'true'
        }
        if (productsUsedTags.length > 0) {
          makeupData.productsUsed = productsUsedTags
        }
        Object.assign(serviceData, makeupData)
      } else if (formData.serviceCategory === 'music_entertainment') {
        Object.assign(serviceData, {
          services: musicServicesTags,
          soundSystemIncluded: formData.soundSystemIncluded === 'true',
          lightingIncluded: formData.lightingIncluded === 'true',
          indoorOutdoorSupported: formData.indoorOutdoorSupported === 'true'
        })
      } else if (formData.serviceCategory === 'choreography') {
        const choreoData: any = {
          performanceTypes: performanceTypesTags,
          danceStyles: danceStylesTags
        }
        if (formData.rehearsalSessions) {
          choreoData.rehearsalSessions = parseInt(formData.rehearsalSessions)
        }
        Object.assign(serviceData, choreoData)
      } else if (formData.serviceCategory === 'ritual_services') {
        const ritualData: any = {
          religionsSupported: religionsSupportedTags,
          ceremoniesCovered: ceremoniesCoveredTags,
          poojaSamagriIncluded: formData.poojaSamagriIncluded === 'true'
        }
        if (languagePreferenceTags.length > 0) {
          ritualData.languagePreference = languagePreferenceTags
        }
        Object.assign(serviceData, ritualData)
      } else if (formData.serviceCategory === 'wedding_transport') {
        Object.assign(serviceData, {
          vehicleTypes: vehicleTypesTags,
          baraatGhodiAvailable: formData.baraatGhodiAvailable === 'true',
          decorationIncluded: formData.decorationIncluded === 'true',
          driverIncluded: formData.driverIncluded === 'true'
        })
      } else if (formData.serviceCategory === 'invitations_gifting') {
        const invitationData: any = {
          servicesOffered: invitationServicesTags,
          customizationAvailable: formData.customizationAvailable === 'true',
          deliveryAvailable: formData.deliveryAvailable === 'true'
        }
        if (formData.minimumOrderQty) {
          invitationData.minimumOrderQty = parseInt(formData.minimumOrderQty)
        }
        Object.assign(serviceData, invitationData)
      }

      // Save to new Firestore structure
      await saveVendorService(serviceId, serviceData)
      
      // Clean up preview URLs
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
      
      alert('Service added successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error adding service:', error)
      alert(error instanceof Error ? error.message : 'Failed to add service. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleCityChange = (cityState: string) => {
    if (!cityState) {
      setFormData(prev => ({ ...prev, city: '', state: '' }))
      return
    }

    // Parse "city|state" format
    const [city, state] = cityState.split('|')
    setFormData(prev => ({ ...prev, city, state }))
    setErrors(prev => ({ ...prev, city: '', state: '' }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate total count
    const totalImages = selectedImages.length + files.length
    if (totalImages > 3) {
      alert(`You can only upload ${3 - selectedImages.length} more image(s). Maximum is 3 images.`)
      return
    }
    
    // Validate each file
    const errors: string[] = []
    const validFiles: File[] = []
    
    files.forEach((file, index) => {
      // Check file size (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        errors.push(`"${file.name}" is ${(file.size / 1048576).toFixed(2)}MB (max: 1MB)`)
        return
      }
      
      // Check file type
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
    
    // Add valid files
    const newImages = [...selectedImages, ...validFiles]
    setSelectedImages(newImages)
    
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls])
    
    // Clear errors
    setErrors(prev => ({ ...prev, images: '' }))
    
    // Reset file input
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index))
  }

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      // Cleanup preview URLs when modal closes
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
      setImagePreviewUrls([])
      setSelectedImages([])
    }
  }, [isOpen])

  // Update pricing unit automatically when category changes
  useEffect(() => {
    if (formData.serviceCategory) {
      const category = formData.serviceCategory as ServiceCategory
      const fixedUnit = PRICING_UNIT_BY_CATEGORY[category]
      setFormData(prev => ({ ...prev, pricingUnit: fixedUnit }))
    } else {
      setFormData(prev => ({ ...prev, pricingUnit: '' }))
    }
  }, [formData.serviceCategory])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-bold text-white">Add New Service - Step {currentStep}/3</h3>
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
                  value={formData.serviceName}
                  onChange={(e) => updateField('serviceName', e.target.value)}
                  placeholder="e.g., Royal Palace Lawn"
                  className={`w-full px-4 py-3 border rounded-lg ${errors.serviceName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.serviceName && <p className="text-sm text-red-600 mt-1">{errors.serviceName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Category *</label>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading categories...</span>
                  </div>
                ) : (
                  <select
                    value={formData.serviceCategory}
                    onChange={(e) => updateField('serviceCategory', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg ${errors.serviceCategory ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select category</option>
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                )}
                {errors.serviceCategory && <p className="text-sm text-red-600 mt-1">{errors.serviceCategory}</p>}
              </div>

              {/* City/State Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City & State *
                </label>
                
                {loadingCities ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading your cities...</span>
                  </div>
                ) : vendorCities.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No cities found in your vendor profile. Please contact support to add cities.
                    </p>
                  </div>
                ) : vendorCities.length === 1 ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      {vendorCities[0].city}, {vendorCities[0].state}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      This is the only city in your vendor profile
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.city && formData.state ? `${formData.city}|${formData.state}` : ''}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      errors.city || errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select city</option>
                    {vendorCities.map((cityObj, index) => (
                      <option key={index} value={`${cityObj.city}|${cityObj.state}`}>
                        {cityObj.city}, {cityObj.state}
                      </option>
                    ))}
                  </select>
                )}
                
                {(errors.city || errors.state) && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.city || errors.state}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 Only cities from your vendor profile are available
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starting Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => updateField('startingPrice', e.target.value)}
                    placeholder="50000"
                    className={`w-full px-4 py-3 border rounded-lg ${errors.startingPrice ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.startingPrice && <p className="text-sm text-red-600 mt-1">{errors.startingPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit</label>
                  {formData.serviceCategory && formData.pricingUnit ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {PRICING_UNIT_LABELS[formData.pricingUnit as PricingUnit]}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Select a service category first
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your service..."
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => updateField('experienceYears', e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Full address"
                  className={`w-full px-4 py-3 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Map Link</label>
                <input
                  type="url"
                  value={formData.googleMapLink}
                  onChange={(e) => updateField('googleMapLink', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Images * (Min: 1, Max: 3 | Max size: 1MB each)
                </label>
                
                {/* Image Preview Grid */}
                {selectedImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-200 group">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove image"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Image {index + 1}</span>
                            <span>{(selectedImages[index].size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Images Button */}
                    {selectedImages.length < 3 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:bg-purple-50 group">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <MdAdd className="text-3xl text-gray-400 group-hover:text-purple-600 mb-1" />
                        <span className="text-xs text-gray-600 font-medium">Add More</span>
                        <span className="text-xs text-gray-400 mt-1">
                          {selectedImages.length}/3
                        </span>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-purple-50 hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <MdImage className="text-5xl text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600 font-semibold">
                        Click to upload images
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or WEBP (MAX. 1MB per image)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload 1-3 images
                      </p>
                    </div>
                  </label>
                )}
                
                {errors.images && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <span className="text-sm font-medium">⚠️ {errors.images}</span>
                  </div>
                )}
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">📌 Image Guidelines:</p>
                  <ul className="text-xs text-blue-700 space-y-0.5 ml-4 list-disc">
                    <li>Upload 1-3 high-quality images of your service</li>
                    <li>Each image must be less than 1 MB</li>
                    <li>Supported formats: JPG, PNG, WEBP</li>
                    <li>Images will be uploaded when you click "Create Service"</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Category-Specific Fields */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                {categories[formData.serviceCategory] || formData.serviceCategory} - Specific Details
              </h4>

              {/* VENUE */}
              {formData.serviceCategory === 'venue' && (
                <>
                  <TagInput
                    label="Venue Types *"
                    placeholder="e.g., Lawn, Banquet, Resort"
                    tags={venueTypesTags}
                    onAddTag={(tag) => {
                      setVenueTypesTags([...venueTypesTags, tag])
                      setErrors(prev => ({ ...prev, venueTypes: '' }))
                    }}
                    onRemoveTag={(index) => setVenueTypesTags(venueTypesTags.filter((_, i) => i !== index))}
                    error={errors.venueTypes}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity *</label>
                    <input 
                      type="number" 
                      value={formData.maxCapacity || ''} 
                      onChange={(e) => updateField('maxCapacity', e.target.value)} 
                      className={`w-full px-4 py-3 border rounded-lg ${errors.maxCapacity ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="500" 
                    />
                    {errors.maxCapacity && <p className="text-sm text-red-600 mt-1">{errors.maxCapacity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rooms Available</label>
                    <input type="number" value={formData.roomsAvailable || ''} onChange={(e) => updateField('roomsAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stay Available?</label>
                      <select value={formData.stayAvailable || ''} onChange={(e) => updateField('stayAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parking Available?</label>
                      <select value={formData.parkingAvailable || ''} onChange={(e) => updateField('parkingAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">In-House Catering?</label>
                      <select value={formData.inHouseCatering || ''} onChange={(e) => updateField('inHouseCatering', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alcohol Allowed?</label>
                      <select value={formData.alcoholAllowed || ''} onChange={(e) => updateField('alcoholAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decoration Allowed?</label>
                      <select value={formData.decorationAllowed || ''} onChange={(e) => updateField('decorationAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DJ Allowed?</label>
                      <select value={formData.djAllowed || ''} onChange={(e) => updateField('djAllowed', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Planning Types *"
                    placeholder="e.g., Full Planning, Partial Planning, Day Coordination"
                    tags={planningTypesTags}
                    onAddTag={(tag) => {
                      setPlanningTypesTags([...planningTypesTags, tag])
                      setErrors(prev => ({ ...prev, planningTypes: '' }))
                    }}
                    onRemoveTag={(index) => setPlanningTypesTags(planningTypesTags.filter((_, i) => i !== index))}
                    error={errors.planningTypes}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Wedding?</label>
                    <select value={formData.destinationWedding || ''} onChange={(e) => updateField('destinationWedding', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    <select value={formData.vendorNetworkAvailable || ''} onChange={(e) => updateField('vendorNetworkAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Cuisines *"
                    placeholder="e.g., North Indian, South Indian, Chinese"
                    tags={cuisinesTags}
                    onAddTag={(tag) => {
                      setCuisinesTags([...cuisinesTags, tag])
                      setErrors(prev => ({ ...prev, cuisines: '' }))
                    }}
                    onRemoveTag={(index) => setCuisinesTags(cuisinesTags.filter((_, i) => i !== index))}
                    error={errors.cuisines}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Veg Only?</label>
                      <select value={formData.vegOnly || ''} onChange={(e) => updateField('vegOnly', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jain Food Available?</label>
                      <select value={formData.jainFoodAvailable || ''} onChange={(e) => updateField('jainFoodAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Live Counters?</label>
                      <select value={formData.liveCountersAvailable || ''} onChange={(e) => updateField('liveCountersAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Plate Price (₹) *</label>
                      <input 
                        type="number" 
                        value={formData.minPlatePrice || ''} 
                        onChange={(e) => updateField('minPlatePrice', e.target.value)} 
                        className={`w-full px-4 py-3 border rounded-lg ${errors.minPlatePrice ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="500" 
                      />
                      {errors.minPlatePrice && <p className="text-sm text-red-600 mt-1">{errors.minPlatePrice}</p>}
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
                    label="Decor Styles *"
                    placeholder="e.g., Royal, Vintage, Floral, Contemporary"
                    tags={decorStylesTags}
                    onAddTag={(tag) => {
                      setDecorStylesTags([...decorStylesTags, tag])
                      setErrors(prev => ({ ...prev, decorStyles: '' }))
                    }}
                    onRemoveTag={(index) => setDecorStylesTags(decorStylesTags.filter((_, i) => i !== index))}
                    error={errors.decorStyles}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floral Decor Available?</label>
                      <select value={formData.floralDecorAvailable || ''} onChange={(e) => updateField('floralDecorAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lighting Included?</label>
                      <select value={formData.lightingIncluded || ''} onChange={(e) => updateField('lightingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mandap Included?</label>
                      <select value={formData.mandapIncluded || ''} onChange={(e) => updateField('mandapIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Decor?</label>
                      <select value={formData.entryDecorIncluded || ''} onChange={(e) => updateField('entryDecorIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cold Fireworks?</label>
                      <select value={formData.coldFireworksAvailable || ''} onChange={(e) => updateField('coldFireworksAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Services Offered *"
                    placeholder="e.g., Photography, Videography, Drone, Pre-Wedding"
                    tags={servicesOfferedTags}
                    onAddTag={(tag) => {
                      setServicesOfferedTags([...servicesOfferedTags, tag])
                      setErrors(prev => ({ ...prev, servicesOffered: '' }))
                    }}
                    onRemoveTag={(index) => setServicesOfferedTags(servicesOfferedTags.filter((_, i) => i !== index))}
                    error={errors.servicesOffered}
                  />
                  <TagInput
                    label="Deliverables *"
                    placeholder="e.g., HD Photos, 4K Video, Album, USB Drive"
                    tags={deliverablesTags}
                    onAddTag={(tag) => {
                      setDeliverablesTags([...deliverablesTags, tag])
                      setErrors(prev => ({ ...prev, deliverables: '' }))
                    }}
                    onRemoveTag={(index) => setDeliverablesTags(deliverablesTags.filter((_, i) => i !== index))}
                    error={errors.deliverables}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editing Included?</label>
                      <select value={formData.editingIncluded || ''} onChange={(e) => updateField('editingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Services *"
                    placeholder="e.g., Bridal Makeup, Hair Styling, Draping, Mehendi"
                    tags={makeupServicesTags}
                    onAddTag={(tag) => {
                      setMakeupServicesTags([...makeupServicesTags, tag])
                      setErrors(prev => ({ ...prev, services: '' }))
                    }}
                    onRemoveTag={(index) => setMakeupServicesTags(makeupServicesTags.filter((_, i) => i !== index))}
                    error={errors.services}
                  />
                  <TagInput
                    label="Makeup Type *"
                    placeholder="e.g., HD, Airbrush, Traditional"
                    tags={makeupTypeTags}
                    onAddTag={(tag) => {
                      setMakeupTypeTags([...makeupTypeTags, tag])
                      setErrors(prev => ({ ...prev, makeupType: '' }))
                    }}
                    onRemoveTag={(index) => setMakeupTypeTags(makeupTypeTags.filter((_, i) => i !== index))}
                    error={errors.makeupType}
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
                    <select value={formData.trialAvailable || ''} onChange={(e) => updateField('trialAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Services *"
                    placeholder="e.g., DJ, Live Band, Dhol, Singer"
                    tags={musicServicesTags}
                    onAddTag={(tag) => {
                      setMusicServicesTags([...musicServicesTags, tag])
                      setErrors(prev => ({ ...prev, services: '' }))
                    }}
                    onRemoveTag={(index) => setMusicServicesTags(musicServicesTags.filter((_, i) => i !== index))}
                    error={errors.services}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sound System?</label>
                      <select value={formData.soundSystemIncluded || ''} onChange={(e) => updateField('soundSystemIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lighting?</label>
                      <select value={formData.lightingIncluded || ''} onChange={(e) => updateField('lightingIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indoor/Outdoor?</label>
                      <select value={formData.indoorOutdoorSupported || ''} onChange={(e) => updateField('indoorOutdoorSupported', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Performance Types *"
                    placeholder="e.g., Couple Dance, Group Dance, Flash Mob"
                    tags={performanceTypesTags}
                    onAddTag={(tag) => {
                      setPerformanceTypesTags([...performanceTypesTags, tag])
                      setErrors(prev => ({ ...prev, performanceTypes: '' }))
                    }}
                    onRemoveTag={(index) => setPerformanceTypesTags(performanceTypesTags.filter((_, i) => i !== index))}
                    error={errors.performanceTypes}
                  />
                  <TagInput
                    label="Dance Styles *"
                    placeholder="e.g., Bollywood, Contemporary, Classical"
                    tags={danceStylesTags}
                    onAddTag={(tag) => {
                      setDanceStylesTags([...danceStylesTags, tag])
                      setErrors(prev => ({ ...prev, danceStyles: '' }))
                    }}
                    onRemoveTag={(index) => setDanceStylesTags(danceStylesTags.filter((_, i) => i !== index))}
                    error={errors.danceStyles}
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
                    label="Religions Supported *"
                    placeholder="e.g., Hindu, Sikh, Jain"
                    tags={religionsSupportedTags}
                    onAddTag={(tag) => {
                      setReligionsSupportedTags([...religionsSupportedTags, tag])
                      setErrors(prev => ({ ...prev, religionsSupported: '' }))
                    }}
                    onRemoveTag={(index) => setReligionsSupportedTags(religionsSupportedTags.filter((_, i) => i !== index))}
                    error={errors.religionsSupported}
                  />
                  <TagInput
                    label="Ceremonies Covered *"
                    placeholder="e.g., Wedding, Engagement, Haldi, Mehendi"
                    tags={ceremoniesCoveredTags}
                    onAddTag={(tag) => {
                      setCeremoniesCoveredTags([...ceremoniesCoveredTags, tag])
                      setErrors(prev => ({ ...prev, ceremoniesCovered: '' }))
                    }}
                    onRemoveTag={(index) => setCeremoniesCoveredTags(ceremoniesCoveredTags.filter((_, i) => i !== index))}
                    error={errors.ceremoniesCovered}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pooja Samagri Included?</label>
                    <select value={formData.poojaSamagriIncluded || ''} onChange={(e) => updateField('poojaSamagriIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Vehicle Types *"
                    placeholder="e.g., Luxury Car, Vintage Car, Decorated Car, Bus"
                    tags={vehicleTypesTags}
                    onAddTag={(tag) => {
                      setVehicleTypesTags([...vehicleTypesTags, tag])
                      setErrors(prev => ({ ...prev, vehicleTypes: '' }))
                    }}
                    onRemoveTag={(index) => setVehicleTypesTags(vehicleTypesTags.filter((_, i) => i !== index))}
                    error={errors.vehicleTypes}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Baraat/Ghodi?</label>
                      <select value={formData.baraatGhodiAvailable || ''} onChange={(e) => updateField('baraatGhodiAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decoration?</label>
                      <select value={formData.decorationIncluded || ''} onChange={(e) => updateField('decorationIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Driver Included?</label>
                      <select value={formData.driverIncluded || ''} onChange={(e) => updateField('driverIncluded', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    label="Services Offered *"
                    placeholder="e.g., Wedding Cards, Gift Hampers, Packaging"
                    tags={invitationServicesTags}
                    onAddTag={(tag) => {
                      setInvitationServicesTags([...invitationServicesTags, tag])
                      setErrors(prev => ({ ...prev, servicesOffered: '' }))
                    }}
                    onRemoveTag={(index) => setInvitationServicesTags(invitationServicesTags.filter((_, i) => i !== index))}
                    error={errors.servicesOffered}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customization Available?</label>
                      <select value={formData.customizationAvailable || ''} onChange={(e) => updateField('customizationAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                    <select value={formData.deliveryAvailable || ''} onChange={(e) => updateField('deliveryAvailable', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
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
                  💡 Add key highlights to attract customers (e.g., '500+ weddings', 'Luxury destination specialist', 'Celebrity events experience')
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between flex-shrink-0">
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)} 
              disabled={submitting || uploadingImages}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdArrowBack />
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button 
              onClick={handleNext} 
 
              disabled={submitting || uploadingImages}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <MdArrowForward />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting || uploadingImages} 
              className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading {imageUploadProgress}%
                </>
              ) : submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                'Create Service'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}