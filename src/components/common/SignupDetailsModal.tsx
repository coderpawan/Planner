'use client'

import { useState } from 'react'
import { MdClose, MdPerson, MdLocationOn } from 'react-icons/md'

interface SignupDetailsModalProps {
	isOpen: boolean
	onClose: () => void
	mobile: string
	onContinue: (fullName: string, city: string) => void
}

export default function SignupDetailsModal({ isOpen, onClose, mobile, onContinue }: SignupDetailsModalProps) {
	const [fullName, setFullName] = useState('')
	const [city, setCity] = useState('')
	const [errors, setErrors] = useState({ fullName: '', city: '' })

	if (!isOpen) return null

	const handleContinue = () => {
		const newErrors = { fullName: '', city: '' }
		let hasError = false

		if (!fullName.trim()) {
			newErrors.fullName = 'Full name is required'
			hasError = true
		} else if (fullName.trim().length < 2) {
			newErrors.fullName = 'Name must be at least 2 characters'
			hasError = true
		}

		if (!city.trim()) {
			newErrors.city = 'City is required'
			hasError = true
		}

		setErrors(newErrors)

		if (hasError) return

		onContinue(fullName.trim(), city.trim())
	}

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Close"
				>
					<MdClose className="text-2xl" />
				</button>

				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<MdPerson className="text-3xl text-pink-500" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
					<p className="text-gray-600 text-sm">We'll personalize your experience</p>
				</div>

				{/* Form Fields */}
				<div className="space-y-5 mb-6">
					{/* Full Name */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Full Name <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={fullName}
							onChange={(e) => {
								setFullName(e.target.value)
								setErrors({ ...errors, fullName: '' })
							}}
							placeholder="Enter your full name"
							className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
								errors.fullName
									? 'border-red-500 focus:border-red-500'
									: 'border-gray-200 focus:border-pink-500'
							}`}
							autoFocus
							required
						/>
						{errors.fullName && (
							<p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
						)}
					</div>

					{/* City */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							City / Event Location <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={city}
							onChange={(e) => {
								setCity(e.target.value)
								setErrors({ ...errors, city: '' })
							}}
							placeholder="Enter your city"
							className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
								errors.city
									? 'border-red-500 focus:border-red-500'
									: 'border-gray-200 focus:border-pink-500'
							}`}
							required
						/>
						{errors.city && (
							<p className="text-red-500 text-sm mt-1">{errors.city}</p>
						)}
					</div>
				</div>

				{/* Continue Button */}
				<button
					onClick={handleContinue}
					className="w-full bg-pink-500 text-white font-semibold py-3 rounded-xl hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					Continue
				</button>

				{/* Mobile Display */}
				<p className="text-xs text-gray-500 text-center mt-4">
					Signing up with +91 {mobile}
				</p>
			</div>
		</div>
	)
}
