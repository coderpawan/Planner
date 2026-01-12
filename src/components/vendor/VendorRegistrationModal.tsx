'use client'

import { useState, useRef, useEffect } from 'react'
import { MdClose, MdPhone, MdPerson, MdBusiness, MdLocationOn, MdCategory, MdCheckCircle, MdEmail, MdLock, MdVerified, MdExpandMore } from 'react-icons/md'
import { auth, db, firestore } from '@/lib/firebase-config'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'

interface VendorRegistrationModalProps {
	isOpen: boolean
	onClose: () => void
}

interface CityWithState {
	city: string
	state: string
}

export default function VendorRegistrationModal({ isOpen, onClose }: VendorRegistrationModalProps) {
	const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')
	const [formData, setFormData] = useState({
		businessName: '',
		ownerName: '',
		phoneNumber: '',
		alternativePhoneNumber: '',
		email: '',
		serviceCategories: [] as string[],
		yearsOfExperience: 0,
		cities: [] as CityWithState[]
	})
	
	// OTP and verification states
	const [otp, setOtp] = useState(['', '', '', '', '', ''])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [resendTimer, setResendTimer] = useState(0)
	
	// Verification tracking
	const [isPrimaryPhoneVerified, setIsPrimaryPhoneVerified] = useState(false)
	const [isPrimaryPhoneLocked, setIsPrimaryPhoneLocked] = useState(false)
	
	// Firebase confirmation results
	const [primaryConfirmationResult, setPrimaryConfirmationResult] = useState<ConfirmationResult | null>(null)
	
	// Service categories and cities from Firestore
	const [serviceCategories, setServiceCategories] = useState<string[]>([])
	const [isFetchingCategories, setIsFetchingCategories] = useState(false)
	const [operationalCities, setOperationalCities] = useState<CityWithState[]>([])
	const [isFetchingCities, setIsFetchingCities] = useState(false)
	const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)

	const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
	const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
	const cityDropdownRef = useRef<HTMLDivElement>(null)

	const experienceOptions = [
		'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '20+'
	]

	// Check if primary phone exists in localStorage on mount
	useEffect(() => {
		if (isOpen) {
			const storedPhone = localStorage.getItem('phone').replace('+91', '')
			if (storedPhone) {
				setFormData(prev => ({ ...prev, phoneNumber: storedPhone }))
				setIsPrimaryPhoneLocked(true)
				setIsPrimaryPhoneVerified(true)
			}
		}
	}, [isOpen])

	// Fetch service categories and cities from Firestore
	useEffect(() => {
		if (isOpen) {
			fetchServiceCategories()
			fetchOperationalCities()
		}
	}, [isOpen])

	// Close city dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
				setIsCityDropdownOpen(false)
			}
		}

		if (isCityDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isCityDropdownOpen])

	const fetchServiceCategories = async () => {
		setIsFetchingCategories(true)
		try {
			const categoriesRef = collection(firestore, 'ServiceCategories')
			const snapshot = await getDocs(categoriesRef)
			const categories = snapshot.docs.map(doc => doc.data().label as string)
			setServiceCategories(categories)
		} catch (error) {
			console.error('Error fetching service categories:', error)
			setError('Failed to load service categories')
		} finally {
			setIsFetchingCategories(false)
		}
	}

	// Fetch cities from OperationalCity collection
	const fetchOperationalCities = async () => {
		setIsFetchingCities(true)
		try {
			const citiesRef = collection(firestore, 'OperationalCity')
			const snapshot = await getDocs(citiesRef)
			const cities: CityWithState[] = snapshot.docs.map(doc => {
				const data = doc.data()
				return {
					city: data.city || data.name || '',
					state: data.state || ''
				}
			}).filter(item => item.city && item.state)
			
			// Sort cities alphabetically
			cities.sort((a, b) => a.city.localeCompare(b.city))
			setOperationalCities(cities)
		} catch (error) {
			console.error('Error fetching operational cities:', error)
			setError('Failed to load cities')
		} finally {
			setIsFetchingCities(false)
		}
	}

	// Timer for OTP resend
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
			return () => clearTimeout(timer)
		}
	}, [resendTimer])

	// Auto-close on success
	useEffect(() => {
		if (step === 'success') {
			const timer = setTimeout(() => {
				handleClose()
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [step])

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	// Cleanup recaptcha on unmount
	useEffect(() => {
		return () => {
			if (recaptchaVerifierRef.current) {
				recaptchaVerifierRef.current.clear()
			}
		}
	}, [])

	if (!isOpen) return null

	const handleInputChange = (field: keyof typeof formData, value: string | string[] | number | CityWithState[]) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	// Toggle city selection
	const toggleCitySelection = (cityWithState: CityWithState) => {
		const isSelected = formData.cities.some(
			c => c.city === cityWithState.city && c.state === cityWithState.state
		)
		
		if (isSelected) {
			handleInputChange(
				'cities',
				formData.cities.filter(c => !(c.city === cityWithState.city && c.state === cityWithState.state))
			)
		} else {
			handleInputChange('cities', [...formData.cities, cityWithState])
		}
	}

	// Remove city from selected list
	const removeCity = (cityWithState: CityWithState) => {
		handleInputChange(
			'cities',
			formData.cities.filter(c => !(c.city === cityWithState.city && c.state === cityWithState.state))
		)
	}

	// Check if city is selected
	const isCitySelected = (cityWithState: CityWithState) => {
		return formData.cities.some(
			c => c.city === cityWithState.city && c.state === cityWithState.state
		)
	}

	// Initialize recaptcha verifier
	const initializeRecaptcha = () => {
		if (!recaptchaVerifierRef.current) {
			recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
				size: 'invisible',
				callback: () => {
					// reCAPTCHA solved
				}
			})
		}
		return recaptchaVerifierRef.current
	}

	// Send OTP to primary phone
	const sendPrimaryOTP = async () => {
		if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
			setError('Valid 10-digit phone number enter karein')
			return
		}

		setIsLoading(true)
		setError('')

		try {
			const appVerifier = initializeRecaptcha()
			const phoneWithCode = `+91${formData.phoneNumber}`
			const confirmation = await signInWithPhoneNumber(auth, phoneWithCode, appVerifier)
			setPrimaryConfirmationResult(confirmation)
			setStep('otp')
			setResendTimer(30)
			console.log('Primary OTP sent to:', formData.phoneNumber)
		} catch (error: any) {
			console.error('Error sending primary OTP:', error)
			setError('OTP bhejne mein error. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	// Validate form before proceeding
	const validateForm = (): boolean => {
		// Required fields validation
		if (!formData.businessName.trim()) {
			setError('Business Name required hai')
			return false
		}
		if (!formData.ownerName.trim()) {
			setError('Owner Name required hai')
			return false
		}
		if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
			setError('Valid 10-digit phone number enter karein')
			return false
		}
		if (!isPrimaryPhoneVerified) {
			setError('Primary phone number verify karna zaroori hai')
			return false
		}
		if (formData.cities.length === 0) {
			setError('Kam se kam ek city select karein')
			return false
		}
		if (formData.serviceCategories.length === 0) {
			setError('Kam se kam ek service category select karein')
			return false
		}
		if (formData.yearsOfExperience < 0) {
			setError('Valid years of experience enter karein')
			return false
		}

		// Email validation (if provided)
		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			setError('Valid email ID enter karein')
			return false
		}

		return true
	}

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

		// If primary phone not locked, trigger OTP verification
		if (!isPrimaryPhoneLocked && !isPrimaryPhoneVerified) {
			await sendPrimaryOTP()
			return
		}

		// Validate all fields
		if (!validateForm()) {
			return
		}

		// Submit to Firestore
		await submitVendorData()
	}

	// Submit vendor data to UnverifiedVendors collection
	const submitVendorData = async () => {
		setIsLoading(true)
		setError('')

		try {
			// Generate human-readable timestamp
			const now = new Date()
			const options: Intl.DateTimeFormatOptions = {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			}
			const createdAt = new Intl.DateTimeFormat('en-IN', options).format(now)

			// Prepare document data with phone numbers in +91XXXXXXXXXX format
			const vendorData: any = {
				businessName: formData.businessName.trim(),
				ownerName: formData.ownerName.trim(),
				phoneNumber: `+91${formData.phoneNumber}`, // Add +91 prefix
				cities: formData.cities,
				serviceCategories: formData.serviceCategories,
				yearsOfExperience: formData.yearsOfExperience,
				role: 'vendor',
				verificationStatus: 'unverified',
				createdAt
			}

			// Add optional fields only if provided
			if (formData.alternativePhoneNumber) {
				vendorData.alternativePhoneNumber = `+91${formData.alternativePhoneNumber}` // Add +91 prefix
			}
			if (formData.email) {
				vendorData.email = formData.email.trim()
			}

			// Write to UnverifiedVendors collection
			const unverifiedVendorsRef = collection(firestore, 'UnverifiedVendors')
			await addDoc(unverifiedVendorsRef, vendorData)

			// Save primary phone to localStorage if not already saved
			if (!isPrimaryPhoneLocked) {
				localStorage.setItem('phoneNumber', `+91${formData.phoneNumber}`)
			}

			console.log('Vendor data submitted to UnverifiedVendors:', vendorData)
			setStep('success')
		} catch (error: any) {
			console.error('Error submitting vendor data:', error)
			setError('Registration mein error. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle OTP change for primary phone
	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return

		const newOtp = [...otp]
		newOtp[index] = value
		setOtp(newOtp)

		if (value && index < 5) {
			otpInputRefs.current[index + 1]?.focus()
		}

		if (newOtp.every(digit => digit !== '') && index === 5) {
			handlePrimaryOtpVerify(newOtp.join(''))
		}
	}

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			otpInputRefs.current[index - 1]?.focus()
		}
	}

	// Verify primary phone OTP
	const handlePrimaryOtpVerify = async (otpString: string) => {
		setError('')
		setIsLoading(true)

		try {
			if (!primaryConfirmationResult) {
				setError('OTP verification failed. Please resend OTP.')
				setIsLoading(false)
				return
			}

			await primaryConfirmationResult.confirm(otpString)
			setIsPrimaryPhoneVerified(true)
			localStorage.setItem('phoneNumber', formData.phoneNumber)
			setStep('form')
			console.log('Primary phone verified:', formData.phoneNumber)
		} catch (error: any) {
			console.error('Error verifying primary OTP:', error)
			setError('Invalid OTP. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleResendOtp = async () => {
		if (resendTimer > 0) return
		
		setOtp(['', '', '', '', '', ''])
		otpInputRefs.current[0]?.focus()
		await sendPrimaryOTP()
	}

	const handleClose = () => {
		setStep('form')
		setFormData({
			businessName: '',
			ownerName: '',
			phoneNumber: isPrimaryPhoneLocked ? formData.phoneNumber : '',
			alternativePhoneNumber: '',
			email: '',
			serviceCategories: [],
			yearsOfExperience: 0,
			cities: []
		})
		setOtp(['', '', '', '', '', ''])
		setError('')
		setResendTimer(0)
		setPrimaryConfirmationResult(null)
		setIsCityDropdownOpen(false)
		onClose()
	}

	// Check if form can be submitted
	const canSubmit = () => {
		return (
			formData.businessName.trim() &&
			formData.ownerName.trim() &&
			formData.phoneNumber &&
			isPrimaryPhoneVerified &&
			formData.cities.length > 0 &&
			formData.serviceCategories.length > 0 &&
			formData.yearsOfExperience >= 0 &&
			!isLoading
		)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
			<div id="recaptcha-container"></div>
			<div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-scale-in">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
							<MdBusiness className="text-3xl text-white" />
						</div>
						<div>
							<h2 className="text-2xl font-bold text-white">Vendor Registration</h2>
							<p className="text-sm text-white/90">Apna business badhao humare saath!</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
					>
						<MdClose className="text-2xl text-white" />
					</button>
				</div>

				{/* Content */}
				<div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
					{/* Form Step */}
					{step === 'form' && (
						<form onSubmit={handleFormSubmit} className="space-y-6">
							{/* Business Details */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<MdBusiness className="text-2xl text-purple-600" />
									Business Details
								</h3>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Business Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={formData.businessName}
											onChange={(e) => handleInputChange('businessName', e.target.value)}
											className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
											placeholder="Apne business ka naam enter karein"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Owner Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={formData.ownerName}
											onChange={(e) => handleInputChange('ownerName', e.target.value)}
											className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
											placeholder="Owner ka poora naam enter karein"
										/>
									</div>
								</div>
							</div>

							{/* Contact Details */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<MdPhone className="text-2xl text-pink-600" />
									Contact Details
								</h3>
								<div className="space-y-4">
									{/* Primary Phone Number */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Phone Number (Primary) <span className="text-red-500">*</span>
											{isPrimaryPhoneVerified && (
												<span className="ml-2 text-green-600 text-xs flex items-center gap-1 inline-flex">
													<MdVerified /> Verified
												</span>
											)}
										</label>
										<div className={`flex items-center gap-2 border-2 ${isPrimaryPhoneLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-lg px-4 py-3 ${!isPrimaryPhoneLocked && 'focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200'} transition-all`}>
											<span className="text-gray-600 font-medium">+91</span>
											<input
												type="tel"
												value={formData.phoneNumber}
												onChange={(e) => handleInputChange('phoneNumber', e.target.value.slice(0, 10))}
												placeholder="10-digit number"
												className={`flex-1 outline-none text-gray-900 ${isPrimaryPhoneLocked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
												maxLength={10}
												disabled={isPrimaryPhoneLocked}
											/>
											{isPrimaryPhoneLocked && <MdLock className="text-gray-400" />}
										</div>
										{isPrimaryPhoneLocked && (
											<p className="text-xs text-gray-500 mt-1">
												This number is locked and verified
											</p>
										)}
									</div>

									{/* Alternative Phone Number - No Verification */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Alternative Phone Number (Optional)
										</label>
										<div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
											<span className="text-gray-600 font-medium">+91</span>
											<input
												type="tel"
												value={formData.alternativePhoneNumber}
												onChange={(e) => handleInputChange('alternativePhoneNumber', e.target.value.slice(0, 10))}
												placeholder="10-digit number (optional)"
												className="flex-1 outline-none text-gray-900"
												maxLength={10}
											/>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											No verification required - optional contact number
										</p>
									</div>

									{/* Email */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
											<MdEmail className="text-lg text-blue-500" />
											Email ID (Optional)
										</label>
										<input
											type="email"
											value={formData.email}
											onChange={(e) => handleInputChange('email', e.target.value)}
											className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
											placeholder="your.email@example.com"
										/>
									</div>
								</div>
							</div>

							{/* Service Details */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<MdCategory className="text-2xl text-orange-600" />
									Service Details
								</h3>
								<div className="space-y-4">
									{/* Service Categories (Multi-select) */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Service Categories <span className="text-red-500">*</span>
										</label>
										{isFetchingCategories ? (
											<div className="flex items-center justify-center py-4 text-gray-500">
												<div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
												Loading categories...
											</div>
										) : (
											<div className="border-2 border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
												{serviceCategories.map((category) => (
													<label key={category} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
														<input
															type="checkbox"
															checked={formData.serviceCategories.includes(category)}
															onChange={(e) => {
																if (e.target.checked) {
																	handleInputChange('serviceCategories', [...formData.serviceCategories, category])
																} else {
																	handleInputChange('serviceCategories', formData.serviceCategories.filter(c => c !== category))
																}
															}}
															className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
														/>
														<span className="text-gray-700">{category}</span>
													</label>
												))}
											</div>
										)}
										{formData.serviceCategories.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-2">
												{formData.serviceCategories.map((cat) => (
													<span key={cat} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
														{cat}
													</span>
												))}
											</div>
										)}
									</div>

									{/* Years of Experience */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Years of Experience <span className="text-red-500">*</span>
										</label>
										<select
											value={formData.yearsOfExperience}
											onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value))}
											className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
										>
											<option value={0}>Select karo</option>
											{experienceOptions.map((exp) => (
												<option key={exp} value={exp === '20+' ? 20 : parseInt(exp)}>{exp} {exp === '20+' ? '' : 'years'}</option>
											))}
										</select>
									</div>

									{/* Cities (Custom Multi-select with State) */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
											<MdLocationOn className="text-lg text-red-500" />
											Cities <span className="text-red-500">*</span>
										</label>
										
										{/* Custom Dropdown */}
										<div ref={cityDropdownRef} className="relative">
											<button
												type="button"
												onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
												className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all flex items-center justify-between text-left"
											>
												<span className="text-gray-700">
													{formData.cities.length > 0
														? `${formData.cities.length} city selected`
														: 'Select cities'}
												</span>
												<MdExpandMore className={`text-2xl text-gray-500 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
											</button>

											{/* Dropdown Menu */}
											{isCityDropdownOpen && (
												<div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
													{isFetchingCities ? (
														<div className="flex items-center justify-center py-8 text-gray-500">
															<div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
															Loading cities...
														</div>
													) : operationalCities.length === 0 ? (
														<div className="px-4 py-8 text-center text-gray-500">
															No cities available
														</div>
													) : (
														operationalCities.map((cityWithState, index) => (
															<label
																key={`${cityWithState.city}-${cityWithState.state}-${index}`}
																className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
															>
																<input
																	type="checkbox"
																	checked={isCitySelected(cityWithState)}
																	onChange={() => toggleCitySelection(cityWithState)}
																	className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
																/>
																<div className="flex-1">
																	<div className="font-bold text-gray-900">{cityWithState.city}</div>
																	<div className="text-xs text-gray-500">{cityWithState.state}</div>
																</div>
															</label>
														))
													)}
												</div>
											)}
										</div>

										{/* Selected Cities Display */}
										{formData.cities.length > 0 && (
											<div className="mt-3 flex flex-wrap gap-2">
												{formData.cities.map((cityWithState, index) => (
													<div
														key={`${cityWithState.city}-${cityWithState.state}-${index}`}
														className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-2"
													>
														<div>
															<div className="font-bold">{cityWithState.city}</div>
															<div className="text-xs">{cityWithState.state}</div>
														</div>
														<button
															type="button"
															onClick={() => removeCity(cityWithState)}
															className="ml-1 text-purple-700 hover:text-purple-900"
														>
															<MdClose className="text-lg" />
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>

							{error && (
								<div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700 text-sm">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={!canSubmit()}
								className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
							>
								{isLoading ? 'Processing...' : 'Register Now'}
							</button>
						</form>
					)}

					{/* Primary OTP Step */}
					{step === 'otp' && (
						<div className="space-y-6">
							<div className="text-center">
								<p className="text-sm text-gray-600 mb-2">OTP bheja gaya hai</p>
								<p className="text-lg font-semibold text-gray-900">
									+91 {formData.phoneNumber}
									<button
										onClick={() => setStep('form')}
										className="ml-3 text-sm text-purple-600 hover:text-purple-700 font-normal"
									>
										Change
									</button>
								</p>
							</div>

							<div className="flex gap-3 justify-center my-8">
								{otp.map((digit, index) => (
									<input
										key={index}
										ref={(el) => {
											otpInputRefs.current[index] = el
										}}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleOtpChange(index, e.target.value)}
										onKeyDown={(e) => handleOtpKeyDown(index, e)}
										className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
									/>
								))}
							</div>

							{error && (
								<div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700 text-sm text-center">
									{error}
								</div>
							)}

							<div className="text-center">
								<p className="text-sm text-gray-600 mb-3">OTP nahi mila?</p>
								<button
									onClick={handleResendOtp}
									disabled={resendTimer > 0}
									className="text-sm font-semibold text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
								>
									{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
								</button>
							</div>

							{isLoading && (
								<div className="flex items-center justify-center gap-2 text-sm text-gray-600">
									<div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
									Verifying...
								</div>
							)}
						</div>
					)}

					{/* Success Step */}
					{step === 'success' && (
						<div className="text-center py-12">
							<div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
								<MdCheckCircle className="text-6xl text-green-600" />
							</div>
							<h3 className="text-3xl font-bold text-gray-900 mb-3">Registration Submitted!</h3>
							<p className="text-lg text-gray-700 mb-2">
								Aapka registration successful hai! 🎉
							</p>
							<p className="text-base text-gray-600">
								Verification pending approval. Hamare team 24 hours mein aapse contact karegi.
							</p>
						</div>
					)}
				</div>
			</div>

			<style jsx>{`
				@keyframes scale-in {
					from {
						transform: scale(0.9);
						opacity: 0;
					}
					to {
						transform: scale(1);
						opacity: 1;
					}
				}
				.animate-scale-in {
					animation: scale-in 0.3s ease-out;
				}
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #f1f1f1;
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: linear-gradient(to bottom, #9333ea, #ec4899);
					border-radius: 10px;
				}
			`}</style>
		</div>
	)
}
