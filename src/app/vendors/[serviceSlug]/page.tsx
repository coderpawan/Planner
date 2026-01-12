'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'
import { normalizeCityId } from '@/lib/firestore-utils'
import SignupDetailsModal from '@/components/common/SignupDetailsModal'
import CitySelectorDropdown from '@/components/common/CitySelectorDropdown'
import BuyCreditsModal from '@/components/common/BuyCreditsModal'
import PhoneAuthModal from '@/components/auth/PhoneAuthModal'
import { mapServiceSlugToCategory, type ServiceCategory } from '@/lib/serviceUtils'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useCredits } from '@/contexts/CreditContext'
import { deductCredit } from '@/lib/creditUtils'
import { addToCart, useIsInCart } from '@/lib/cartUtils'

interface VendorService {
	serviceId: string
	serviceName: string
	serviceCategory: string
	city: string
	cityId: string
	state: string
	startingPrice: number
	pricingUnit: string
	description: string
	experienceYears: number
	address: string
	googleMapLink?: string
	images: string[]
	active: boolean
	phoneNumber: string
	alternativePhoneNumber?: string
	ownerName: string
	vendorId: string
	highlights?: string[]
	// Venue specific
	venueTypes?: string[]
	maxCapacity?: number
	roomsAvailable?: number
	stayAvailable?: boolean
	parkingAvailable?: boolean
	inHouseCatering?: boolean
	alcoholAllowed?: boolean
	decorationAllowed?: boolean
	djAllowed?: boolean
	// Wedding Planner specific
	planningTypes?: string[]
	destinationWedding?: boolean
	budgetHandledRange?: string
	vendorNetworkAvailable?: boolean
	// Catering specific
	cuisines?: string[]
	vegOnly?: boolean
	jainFoodAvailable?: boolean
	liveCountersAvailable?: boolean
	minPlatePrice?: number
	maxPlatePrice?: number
	// Decor specific
	decorStyles?: string[]
	floralDecorAvailable?: boolean
	lightingIncluded?: boolean
	mandapIncluded?: boolean
	entryDecorIncluded?: boolean
	coldFireworksAvailable?: boolean
	// Photography specific
	servicesOffered?: string[]
	deliverables?: string[]
	editingIncluded?: boolean
	deliveryTimeDays?: number
	// Makeup specific
	services?: string[]
	makeupType?: string[]
	productsUsed?: string[]
	trialAvailable?: boolean
	// Music Entertainment specific
	soundSystemIncluded?: boolean
	indoorOutdoorSupported?: boolean
	// Choreography specific
	performanceTypes?: string[]
	danceStyles?: string[]
	rehearsalSessions?: number
	// Ritual Services specific
	religionsSupported?: string[]
	ceremoniesCovered?: string[]
	poojaSamagriIncluded?: boolean
	languagePreference?: string[]
	// Wedding Transport specific
	vehicleTypes?: string[]
	baraatGhodiAvailable?: boolean
	decorationIncluded?: boolean
	driverIncluded?: boolean
	// Invitations Gifting specific
	customizationAvailable?: boolean
	minimumOrderQty?: number
	deliveryAvailable?: boolean
}

export default function VendorServicePage() {
	const params = useParams()
	const router = useRouter()
	const city = typeof window !== 'undefined' ? localStorage.getItem('city') : null
	const [selectedCity, setSelectedCity] = useState('')
	const [serviceCategory, setServiceCategory] = useState<ServiceCategory | null>(null)
	const [services, setServices] = useState<VendorService[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedService, setSelectedService] = useState<VendorService | null>(null)
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
	const [showServiceError, setShowServiceError] = useState(false)
	
	// Auth modal states
	const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
	const [isSignupDetailsModalOpen, setIsSignupDetailsModalOpen] = useState(false)
	const [authMobile, setAuthMobile] = useState('')
	const [signupDetails, setSignupDetails] = useState({ fullName: '', city: '' })

	// Initialize service category from slug
	useEffect(() => {
		if (params?.serviceSlug) {
			const category = mapServiceSlugToCategory(params.serviceSlug as string)
			setServiceCategory(category)
		}
	}, [params?.serviceSlug])

	// Check authentication and set city
	useEffect(() => {
		if (!city) {
			setIsPhoneModalOpen(true)
		} else {
			setSelectedCity(city)
		}
	}, [city])

	// Fetch services from Firestore
	useEffect(() => {
		const fetchServices = async () => {
			if (!selectedCity || !serviceCategory) return

			try {
				setLoading(true)
				const cityId = normalizeCityId(selectedCity)
				const servicesRef = collection(firestore, 'vendor_services', cityId, serviceCategory.slug)
				const q = query(servicesRef, where('active', '==', true))
				const querySnapshot = await getDocs(q)

				const fetchedServices: VendorService[] = []
				querySnapshot.forEach((doc) => {
					fetchedServices.push({ serviceId: doc.id, ...doc.data() } as VendorService)
				})

				if (fetchedServices.length === 0) {
					setShowServiceError(true)
				} else {
					setShowServiceError(false)
				}

				setServices(fetchedServices)
			} catch (error) {
				console.error('Error fetching services:', error)
				setShowServiceError(true)
			} finally {
				setLoading(false)
			}
		}

		fetchServices()
	}, [selectedCity, serviceCategory])

	const handleCityChange = (city: string) => {
		setSelectedCity(city)
	}

	const handleShowDetails = (service: VendorService) => {
		setSelectedService(service)
		setIsDetailsModalOpen(true)
	}

	// Auth flow handlers
	const handlePhoneVerify = (mobile: string, newUser: boolean) => {
		setAuthMobile(mobile)
		setIsPhoneModalOpen(false)

		if (newUser) {
			setIsSignupDetailsModalOpen(true)
		}
	}

	const handleSignupDetailsContinue = (fullName: string, city: string) => {
		setSignupDetails({ fullName, city })
		setSelectedCity(city)
		setIsSignupDetailsModalOpen(false)
		if (typeof window !== 'undefined') {
			localStorage.setItem('city', city)
		}
	}

	// Get category-specific highlights for card
	const getCategoryHighlights = (service: VendorService): string[] => {
		const highlights: string[] = []

		switch (service.serviceCategory) {
			case 'venue':
				if (service.maxCapacity) highlights.push(`Capacity: ${service.maxCapacity}`)
				if (service.stayAvailable) highlights.push('Stay Available')
				break
			case 'photography':
				if (service.servicesOffered?.includes('Drone')) highlights.push('Drone Available')
				if (service.deliveryTimeDays) highlights.push(`Delivery: ${service.deliveryTimeDays} days`)
				break
			case 'makeup_styling':
				if (service.makeupType?.includes('HD')) highlights.push('HD Makeup')
				if (service.trialAvailable) highlights.push('Trial Available')
				break
			case 'catering':
				if (service.vegOnly) highlights.push('Pure Veg')
				if (service.liveCountersAvailable) highlights.push('Live Counters')
				break
			case 'wedding_planner':
				if (service.destinationWedding) highlights.push('Destination Weddings')
				if (service.vendorNetworkAvailable) highlights.push('Vendor Network')
				break
			case 'decor':
				if (service.floralDecorAvailable) highlights.push('Floral Decor')
				if (service.lightingIncluded) highlights.push('Lighting Included')
				break
			case 'music_entertainment':
				if (service.soundSystemIncluded) highlights.push('Sound System')
				if (service.lightingIncluded) highlights.push('Lighting')
				break
			case 'wedding_transport':
				if (service.baraatGhodiAvailable) highlights.push('Baraat/Ghodi')
				if (service.decorationIncluded) highlights.push('Decoration Included')
				break
		}

		return highlights.slice(0, 2)
	}

	if (!serviceCategory) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Service</h1>
					<p className="text-gray-600">Please select a valid vendor service</p>
				</div>
			</div>
		)
	}

	if (loading) {
		return <LoadingSpinner size="lg" message="Loading vendor services..." fullScreen />
	}

	return (
		<>
			<div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
				{/* Header */}
				<div className="bg-white border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<button
							onClick={() => router.back()}
							className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1.5 text-sm transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							Back
						</button>
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
							<div>
								<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
									{serviceCategory.name}
								</h1>
								<p className="text-gray-600">
									{serviceCategory.description}
								</p>
								{selectedCity && (
									<p className="text-pink-600 font-medium mt-2">
										Showing vendors in {selectedCity}
									</p>
								)}
							</div>

							{/* City Selector */}
							{selectedCity && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Select Your City
									</label>
									<CitySelectorDropdown
										selectedCity={selectedCity}
										onCityChange={handleCityChange}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					{/* Loading State */}
					{loading && (
						<div className="text-center py-20">
							<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
							<p className="mt-4 text-gray-600">Loading services...</p>
						</div>
					)}

					{/* Service Error Message */}
					{!loading && showServiceError && (
						<div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
							<h3 className="text-lg font-bold text-red-900 mb-2">
								⚠️ Service Not Available
							</h3>
							<p className="text-red-700">
								We are not currently serving <span className="font-semibold">{selectedCity}</span> for {serviceCategory.name.toLowerCase()}. 
								Please select another city to view available vendors.
							</p>
						</div>
					)}

					{/* Services Grid */}
					{!loading && !showServiceError && services.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{services.map((service) => {
								const highlights = getCategoryHighlights(service)
								return (
									<div
										key={service.serviceId}
										className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
									>
										{/* Image */}
										<div className="relative h-48 bg-gray-200 overflow-hidden">
											{service.images && service.images.length > 0 ? (
												<img
													src={service.images[0]}
													alt={service.serviceName}
													className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-400">
													No Image
												</div>
											)}
										</div>

										{/* Content */}
										<div className="p-5">
											<h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
												{service.serviceName}
											</h3>

											<p className="text-gray-600 text-sm mb-3 line-clamp-2">
												{service.description}
											</p>

											<p className="text-gray-500 text-xs mb-3 line-clamp-1">
												📍 {service.address}
											</p>

											{/* Highlights */}
											{highlights.length > 0 && (
												<div className="flex flex-wrap gap-2 mb-3">
													{highlights.map((highlight, idx) => (
														<span
															key={idx}
															className="px-2 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full"
														>
															{highlight}
														</span>
													))}
												</div>
											)}

											{/* Price */}
											<div className="mb-4">
												<span className="text-2xl font-bold text-pink-600">
													₹{service.startingPrice.toLocaleString('en-IN')}
												</span>
												<span className="text-gray-500 text-sm ml-1">
													/ {service.pricingUnit}
												</span>
											</div>

											{/* Action Buttons */}
											<div className="flex gap-2">
												<ServiceCardCartButton service={service} />
												<button
													onClick={() => handleShowDetails(service)}
													className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
												>
													Show Details
												</button>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}

					{/* No Services */}
					{!loading && !showServiceError && services.length === 0 && (
						<div className="text-center py-20">
							<div className="text-6xl mb-4">🔍</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-2">
								No Vendors Found
							</h3>
							<p className="text-gray-600">
								No {serviceCategory.name.toLowerCase()} available in {selectedCity}
							</p>
							<p className="text-sm text-gray-500 mt-4">
								Try selecting a different city or check back later
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Service Details Modal */}
			{selectedService && (
				<ServiceDetailsModal
					service={selectedService}
					isOpen={isDetailsModalOpen}
					onClose={() => {
						setIsDetailsModalOpen(false)
						setSelectedService(null)
					}}
				/>
			)}

			<SignupDetailsModal
				isOpen={isSignupDetailsModalOpen}
				onClose={() => setIsSignupDetailsModalOpen(false)}
				mobile={authMobile}
				onContinue={handleSignupDetailsContinue}
			/>
		</>
	)
}

// Service Card Cart Button Component
function ServiceCardCartButton({ service }: { service: VendorService }) {
	const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
	const { inCart } = useIsInCart(uid, service.serviceId)
	const [isAdding, setIsAdding] = useState(false)
	const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false)

	const handleAddToCart = async () => {
		if (!uid) {
			setShowPhoneAuthModal(true)
			return
		}

		setIsAdding(true)
		try {
			await addToCart(uid, service.serviceId, service.serviceCategory, service.city)
		} catch (error) {
			console.error('Error adding to cart:', error)
		} finally {
			setIsAdding(false)
		}
	}

	const handleAuthSuccess = () => {
		setShowPhoneAuthModal(false)
		window.location.reload()
	}

	return (
		<>
			<button
				onClick={handleAddToCart}
				disabled={isAdding || inCart}
				className={`px-4 py-2.5 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
					inCart
						? 'bg-green-100 text-green-700 border-2 border-green-300'
						: 'bg-white text-pink-600 border-2 border-pink-600 hover:bg-pink-50'
				}`}
			>
				{inCart ? (
					<span className="flex items-center gap-1">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						In Cart
					</span>
				) : isAdding ? (
					'Adding...'
				) : (
					<span className="flex items-center gap-1">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						Cart
					</span>
				)}
			</button>
			<PhoneAuthModal
				isOpen={showPhoneAuthModal}
				onClose={() => setShowPhoneAuthModal(false)}
				onSuccess={handleAuthSuccess}
			/>
		</>
	)
}

// Service Details Modal Component
function ServiceDetailsModal({
	service,
	isOpen,
	onClose,
}: {
	service: VendorService
	isOpen: boolean
	onClose: () => void
}) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
	const [isContactUnlocked, setIsContactUnlocked] = useState(false)
	const [isUnlocking, setIsUnlocking] = useState(false)
	const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)
	const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false)
	const [message, setMessage] = useState('')
	const [isAddingToCart, setIsAddingToCart] = useState(false)
	const [cartMessage, setCartMessage] = useState('')
	
	const { credits, unlockedServices, refreshCredits } = useCredits()
	const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
	const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
	const { inCart, refreshStatus } = useIsInCart(uid, service.serviceId)

	// Check unlock status
	useEffect(() => {
		if (!isOpen) return

		const checkUnlockStatus = () => {
			if (!uid) {
				setIsContactUnlocked(false)
				return
			}

			// Only Admin has unlimited access
			if (role === 'Admin') {
				setIsContactUnlocked(true)
				return
			}

			// Check if already unlocked
			const unlocked = unlockedServices.includes(service.serviceId)
			setIsContactUnlocked(unlocked)
		}

		checkUnlockStatus()
	}, [isOpen, uid, role, service.serviceId, unlockedServices])

	const handleUnlockContact = async () => {
		// Not logged in - show auth modal
		if (!uid) {
			setShowPhoneAuthModal(true)
			return
		}

		// Admin - instant access
		if (role === 'Admin') {
			setIsContactUnlocked(true)
			return
		}

		// No credits - show buy credits modal
		if (credits <= 0) {
			setShowBuyCreditsModal(true)
			return
		}

		// Has credits - deduct and unlock
		setIsUnlocking(true)
		setMessage('')

		try {
			// Get user details from localStorage
			const userName = typeof window !== 'undefined' ? localStorage.getItem('name') : null
			const userPhone = typeof window !== 'undefined' ? localStorage.getItem('phoneNumber') : null
			
			const result = await deductCredit(
				uid, 
				service.serviceId,
				service as any,  // Pass service object for engagement logging (type compatible)
				userName || undefined,
				userPhone || undefined,
				role || undefined
			)
			
			if (result.success) {
				setIsContactUnlocked(true)
				setMessage('✓ 1 credit used')
				await refreshCredits()
				
				// Clear message after 3 seconds
				setTimeout(() => setMessage(''), 3000)
			} else {
				setMessage(result.message)
				if (result.message === 'Not enough credits') {
					setShowBuyCreditsModal(true)
				}
			}
		} catch (error) {
			setMessage('Failed to unlock contact. Please try again.')
		} finally {
			setIsUnlocking(false)
		}
	}

	const handleAuthSuccess = () => {
		setShowPhoneAuthModal(false)
		// Refresh the page to load user data
		window.location.reload()
	}

	const handleAddToCart = async () => {
		// Not logged in - show auth modal
		if (!uid) {
			setShowPhoneAuthModal(true)
			return
		}

		setIsAddingToCart(true)
		setCartMessage('')

		try {
			const result = await addToCart(uid, service.serviceId, service.serviceCategory, service.city)
			
			if (result.success) {
				setCartMessage('✓ Added to cart')
				await refreshStatus()
				
				// Clear message after 3 seconds
				setTimeout(() => setCartMessage(''), 3000)
			} else {
				setCartMessage(result.message)
			}
		} catch (error) {
			setCartMessage('Failed to add to cart')
		} finally {
			setIsAddingToCart(false)
		}
	}

	if (!isOpen) return null

	const renderCategorySpecificFields = () => {
		switch (service.serviceCategory) {
			case 'venue':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Venue Details</h3>
						{service.venueTypes && service.venueTypes.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Venue Types:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.venueTypes.map((type, idx) => (
										<span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
											{type}
										</span>
									))}
								</div>
							</div>
						)}
						{service.maxCapacity && (
							<p className="text-sm"><span className="font-semibold">Max Capacity:</span> {service.maxCapacity} guests</p>
						)}
						{service.roomsAvailable !== undefined && service.roomsAvailable > 0 && (
							<p className="text-sm"><span className="font-semibold">Rooms Available:</span> {service.roomsAvailable}</p>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.stayAvailable && <div className="text-sm text-green-700">✓ Stay Available</div>}
							{service.parkingAvailable && <div className="text-sm text-green-700">✓ Parking Available</div>}
							{service.inHouseCatering && <div className="text-sm text-green-700">✓ In-House Catering</div>}
							{service.alcoholAllowed && <div className="text-sm text-green-700">✓ Alcohol Allowed</div>}
							{service.decorationAllowed && <div className="text-sm text-green-700">✓ Decoration Allowed</div>}
							{service.djAllowed && <div className="text-sm text-green-700">✓ DJ Allowed</div>}
						</div>
					</div>
				)

			case 'wedding_planner':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Planning Services</h3>
						{service.planningTypes && service.planningTypes.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Planning Types:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.planningTypes.map((type, idx) => (
										<span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
											{type}
										</span>
									))}
								</div>
							</div>
						)}
						{service.budgetHandledRange && (
							<p className="text-sm"><span className="font-semibold">Budget Range Handled:</span> {service.budgetHandledRange}</p>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.destinationWedding && <div className="text-sm text-green-700">✓ Destination Weddings</div>}
							{service.vendorNetworkAvailable && <div className="text-sm text-green-700">✓ Vendor Network Available</div>}
						</div>
					</div>
				)

			case 'catering':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Catering Details</h3>
						{service.cuisines && service.cuisines.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Cuisines:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.cuisines.map((cuisine, idx) => (
										<span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
											{cuisine}
										</span>
									))}
								</div>
							</div>
						)}
						{(service.minPlatePrice !== undefined || service.maxPlatePrice !== undefined) && (
							<p className="text-sm">
								<span className="font-semibold">Price per Plate:</span> ₹{service.minPlatePrice?.toLocaleString('en-IN')} - ₹{service.maxPlatePrice?.toLocaleString('en-IN')}
							</p>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.vegOnly && <div className="text-sm text-green-700">✓ Pure Veg Only</div>}
							{service.jainFoodAvailable && <div className="text-sm text-green-700">✓ Jain Food Available</div>}
							{service.liveCountersAvailable && <div className="text-sm text-green-700">✓ Live Counters</div>}
						</div>
					</div>
				)

			case 'decor':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Decoration Details</h3>
						{service.decorStyles && service.decorStyles.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Decor Styles:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.decorStyles.map((style, idx) => (
										<span key={idx} className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
											{style}
										</span>
									))}
								</div>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.floralDecorAvailable && <div className="text-sm text-green-700">✓ Floral Decor</div>}
							{service.lightingIncluded && <div className="text-sm text-green-700">✓ Lighting Included</div>}
							{service.mandapIncluded && <div className="text-sm text-green-700">✓ Mandap Included</div>}
							{service.entryDecorIncluded && <div className="text-sm text-green-700">✓ Entry Decor</div>}
							{service.coldFireworksAvailable && <div className="text-sm text-green-700">✓ Cold Fireworks</div>}
						</div>
					</div>
				)

			case 'photography':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Photography Services</h3>
						{service.servicesOffered && service.servicesOffered.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Services:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.servicesOffered.map((svc, idx) => (
										<span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
											{svc}
										</span>
									))}
								</div>
							</div>
						)}
						{service.deliverables && service.deliverables.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Deliverables:</p>
								<ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
									{service.deliverables.map((item, idx) => (
										<li key={idx}>{item}</li>
									))}
								</ul>
							</div>
						)}
						{service.deliveryTimeDays && (
							<p className="text-sm"><span className="font-semibold">Delivery Time:</span> {service.deliveryTimeDays} days</p>
						)}
						{service.editingIncluded && <div className="text-sm text-green-700">✓ Editing Included</div>}
					</div>
				)

			case 'makeup_styling':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Makeup & Styling</h3>
						{service.services && service.services.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Services:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.services.map((svc, idx) => (
										<span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 text-sm rounded-full">
											{svc}
										</span>
									))}
								</div>
							</div>
						)}
						{service.makeupType && service.makeupType.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Makeup Types:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.makeupType.map((type, idx) => (
										<span key={idx} className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
											{type}
										</span>
									))}
								</div>
							</div>
						)}
						{service.productsUsed && service.productsUsed.length > 0 && (
							<p className="text-sm"><span className="font-semibold">Products:</span> {service.productsUsed.join(', ')}</p>
						)}
						{service.trialAvailable && <div className="text-sm text-green-700">✓ Trial Available</div>}
					</div>
				)

			case 'music_entertainment':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Entertainment Details</h3>
						{service.services && service.services.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Services:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.services.map((svc, idx) => (
										<span key={idx} className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded-full">
											{svc}
										</span>
									))}
								</div>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.soundSystemIncluded && <div className="text-sm text-green-700">✓ Sound System Included</div>}
							{service.lightingIncluded && <div className="text-sm text-green-700">✓ Lighting Included</div>}
							{service.indoorOutdoorSupported && <div className="text-sm text-green-700">✓ Indoor/Outdoor</div>}
						</div>
					</div>
				)

			case 'choreography':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Choreography Services</h3>
						{service.performanceTypes && service.performanceTypes.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Performance Types:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.performanceTypes.map((type, idx) => (
										<span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
											{type}
										</span>
									))}
								</div>
							</div>
						)}
						{service.danceStyles && service.danceStyles.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Dance Styles:</p>
								<p className="text-sm text-gray-600">{service.danceStyles.join(', ')}</p>
							</div>
						)}
						{service.rehearsalSessions && (
							<p className="text-sm"><span className="font-semibold">Rehearsal Sessions:</span> {service.rehearsalSessions}</p>
						)}
					</div>
				)

			case 'ritual_services':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Ritual Services</h3>
						{service.religionsSupported && service.religionsSupported.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Religions Supported:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.religionsSupported.map((religion, idx) => (
										<span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
											{religion}
										</span>
									))}
								</div>
							</div>
						)}
						{service.ceremoniesCovered && service.ceremoniesCovered.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Ceremonies:</p>
								<ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
									{service.ceremoniesCovered.map((ceremony, idx) => (
										<li key={idx}>{ceremony}</li>
									))}
								</ul>
							</div>
						)}
						{service.languagePreference && service.languagePreference.length > 0 && (
							<p className="text-sm"><span className="font-semibold">Languages:</span> {service.languagePreference.join(', ')}</p>
						)}
						{service.poojaSamagriIncluded && <div className="text-sm text-green-700">✓ Pooja Samagri Included</div>}
					</div>
				)

			case 'wedding_transport':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Transport Services</h3>
						{service.vehicleTypes && service.vehicleTypes.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Vehicle Types:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.vehicleTypes.map((vehicle, idx) => (
										<span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
											{vehicle}
										</span>
									))}
								</div>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.baraatGhodiAvailable && <div className="text-sm text-green-700">✓ Baraat/Ghodi Available</div>}
							{service.decorationIncluded && <div className="text-sm text-green-700">✓ Decoration Included</div>}
							{service.driverIncluded && <div className="text-sm text-green-700">✓ Driver Included</div>}
						</div>
					</div>
				)

			case 'invitations_gifting':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900">Invitations & Gifting</h3>
						{service.servicesOffered && service.servicesOffered.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-700">Services:</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{service.servicesOffered.map((svc, idx) => (
										<span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full">
											{svc}
										</span>
									))}
								</div>
							</div>
						)}
						{service.minimumOrderQty && (
							<p className="text-sm"><span className="font-semibold">Minimum Order Quantity:</span> {service.minimumOrderQty}</p>
						)}
						<div className="grid grid-cols-2 gap-3">
							{service.customizationAvailable && <div className="text-sm text-green-700">✓ Customization Available</div>}
							{service.deliveryAvailable && <div className="text-sm text-green-700">✓ Delivery Available</div>}
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<>
			<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
				<div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
					{/* Close Button */}
					<button
						onClick={onClose}
						className="sticky top-2 sm:top-4 right-2 sm:right-4 float-right bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
					>
						<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Image Carousel */}
					{service.images && service.images.length > 0 && (
						<div className="relative h-48 sm:h-64 md:h-80 bg-gray-200">
							<img
								src={service.images[currentImageIndex]}
								alt={service.serviceName}
								className="w-full h-full object-cover cursor-pointer"
								onClick={() => setIsImageViewerOpen(true)}
							/>
							{service.images.length > 1 && (
								<>
									<button
										onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? service.images.length - 1 : prev - 1))}
										className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 hover:bg-white transition-all"
									>
										<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
									</button>
									<button
										onClick={() => setCurrentImageIndex((prev) => (prev === service.images.length - 1 ? 0 : prev + 1))}
										className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 hover:bg-white transition-all"
									>
										<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</button>
									<div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
										{service.images.map((_, idx) => (
											<button
												key={idx}
												onClick={() => setCurrentImageIndex(idx)}
												className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50'}`}
											/>
										))}
									</div>
								</>
							)}
							{/* Click to expand hint */}
							<div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
								Click to expand
							</div>
						</div>
					)}

					{/* Content */}
					<div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
						{/* Header */}
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{service.serviceName}</h2>
							<p className="text-pink-600 font-medium text-sm sm:text-base">{service.ownerName}</p>
						</div>

						{/* Price */}
						<div className="bg-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
							<span className="text-2xl sm:text-3xl font-bold text-pink-600">
								₹{service.startingPrice.toLocaleString('en-IN')}
							</span>
							<span className="text-gray-600 ml-2 text-sm sm:text-base">/ {service.pricingUnit}</span>
						</div>

						{/* About Service */}
						<div>
							<h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">About Service</h3>
							<p className="text-gray-600 text-sm sm:text-base">{service.description}</p>
						</div>

						{/* Key Details */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div>
								<p className="text-xs sm:text-sm font-semibold text-gray-700">Experience</p>
								<p className="text-gray-600 text-sm sm:text-base">{service.experienceYears} years</p>
							</div>
							<div>
								<p className="text-xs sm:text-sm font-semibold text-gray-700">Location</p>
								<p className="text-gray-600 text-sm sm:text-base">{service.city}, {service.state}</p>
							</div>
						</div>

						{/* Highlights */}
						{service.highlights && service.highlights.length > 0 && (
							<div>
								<h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Highlights</h3>
								<ul className="list-disc list-inside text-gray-600 space-y-1 text-sm sm:text-base">
									{service.highlights.map((highlight, idx) => (
										<li key={idx}>{highlight}</li>
									))}
								</ul>
							</div>
						)}

						{/* Category-Specific Fields */}
						<div className="text-sm sm:text-base">
							{renderCategorySpecificFields()}
						</div>

						{/* Contact & Location */}
						<div className="border-t pt-4 sm:pt-6">
							<h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Contact & Location</h3>
							
							{!isContactUnlocked ? (
								// LOCKED STATE - Show unlock button
								<div className="text-center py-6 sm:py-8">
									<div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-pink-100 rounded-full mb-4">
										<svg className="w-7 h-7 sm:w-8 sm:h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
										Unlock contact details to connect with this vendor
									</p>
									
									<button
										onClick={handleUnlockContact}
										disabled={isUnlocking}
										className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
									>
										{isUnlocking ? 'Unlocking...' : uid ? 'View Contact Details (Use 1 Credit)' : 'Login to View Contact Details'}
									</button>
									
									{message && (
										<p className={`mt-3 sm:mt-4 text-xs sm:text-sm ${message.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
											{message}
										</p>
									)}
								</div>
							) : (
								// UNLOCKED STATE - Show contact details
								<div className="space-y-2 sm:space-y-3">
									<p className="text-xs sm:text-sm">
										<span className="font-semibold">Address:</span> {service.address}
									</p>
									<p className="text-xs sm:text-sm">
										<span className="font-semibold">Phone:</span>{' '}
										<a href={`tel:${service.phoneNumber}`} className="text-blue-600 hover:underline">
											{service.phoneNumber}
										</a>
									</p>
									{service.alternativePhoneNumber && (
										<p className="text-xs sm:text-sm">
											<span className="font-semibold">Alternative Phone:</span>{' '}
											<a href={`tel:${service.alternativePhoneNumber}`} className="text-blue-600 hover:underline">
												{service.alternativePhoneNumber}
											</a>
										</p>
									)}
									{service.googleMapLink && (
										<a
											href={service.googleMapLink}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-block text-blue-600 hover:underline text-xs sm:text-sm"
										>
											View on Google Maps →
										</a>
									)}
								</div>
							)}
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							{/* Add to Cart Button */}
							{!inCart ? (
								<button
									onClick={handleAddToCart}
									disabled={isAddingToCart}
									className="w-full bg-white border-2 border-pink-600 text-pink-600 hover:bg-pink-50 font-bold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
									{isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
								</button>
							) : (
								<div className="w-full bg-green-50 border-2 border-green-300 text-green-700 font-bold py-2.5 sm:py-3 rounded-lg text-sm sm:text-base flex items-center justify-center gap-2">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									Already in Cart
								</div>
							)}
							{cartMessage && (
								<p className={`text-xs sm:text-sm text-center ${cartMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
									{cartMessage}
								</p>
							)}

							{/* Contact Button - Only show if unlocked */}
							{isContactUnlocked && (
								<a
									href={`tel:${service.phoneNumber}`}
									className="block w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 sm:py-3 rounded-lg transition-colors text-center text-sm sm:text-base"
								>
									Contact Vendor
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Full Screen Image Viewer */}
			{isImageViewerOpen && (
				<div className="fixed inset-0 bg-black z-[60] flex items-center justify-center p-2 sm:p-4">
					{/* Close Button */}
					<button
						onClick={() => setIsImageViewerOpen(false)}
						className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 rounded-full p-2 hover:bg-white z-10 transition-all"
					>
						<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Image */}
					<div className="relative w-full h-full flex items-center justify-center">
						<img
							src={service.images[currentImageIndex]}
							alt={service.serviceName}
							className="max-w-full max-h-full object-contain"
						/>

						{/* Navigation Buttons */}
						{service.images.length > 1 && (
							<>
								<button
									onClick={() => {
										setCurrentImageIndex((prev) => (prev === 0 ? service.images.length - 1 : prev - 1))
									}}
									className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 sm:p-3 hover:bg-white transition-all"
								>
									<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
								</button>
								<button
									onClick={() => {
										setCurrentImageIndex((prev) => (prev === service.images.length - 1 ? 0 : prev + 1))
									}}
									className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 sm:p-3 hover:bg-white transition-all"
								>
									<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>

								{/* Image Counter */}
								<div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
									{currentImageIndex + 1} / {service.images.length}
								</div>
							</>
						)}
					</div>
				</div>
			)}
			
			{/* Buy Credits Modal */}
			<BuyCreditsModal
				isOpen={showBuyCreditsModal}
				onClose={() => setShowBuyCreditsModal(false)}
			/>
			
			{/* Phone Auth Modal */}
			<PhoneAuthModal
				isOpen={showPhoneAuthModal}
				onClose={() => setShowPhoneAuthModal(false)}
				onSuccess={handleAuthSuccess}
			/>
		</>
	)
}
