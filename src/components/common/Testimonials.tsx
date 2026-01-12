'use client'

import { useState, useEffect, useRef } from 'react'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'

interface Testimonial {
	id: string
	brideName: string
	groomName: string
	city: string
	budget: string
	review: string
}

export default function IndianTestimonials() {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isHovered, setIsHovered] = useState(false)
	const [testimonials, setTestimonials] = useState<Testimonial[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Fetch testimonials from Firestore
	useEffect(() => {
		const fetchTestimonials = async () => {
			try {
				const testimonialsRef = collection(firestore, 'testimonial')
				const snapshot = await getDocs(testimonialsRef)
				const testimonialsData = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				})) as Testimonial[]
				setTestimonials(testimonialsData)
			} catch (error) {
				console.error('Error fetching testimonials:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchTestimonials()
	}, [])

	const nextTestimonial = () => {
		setCurrentIndex((prev) => (prev + 1) % testimonials.length)
	}

	const prevTestimonial = () => {
		setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
	}

	// Auto-slide every 6 seconds
	useEffect(() => {
		if (!isHovered && testimonials.length > 0) {
			intervalRef.current = setInterval(() => {
				nextTestimonial()
			}, 6000)
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [isHovered, testimonials.length])

	if (isLoading) {
		return (
			<section className="relative w-full bg-gradient-to-br from-yellow-400 via-orange-300 to-pink-300 py-20 md:py-28">
				<div className="max-w-5xl mx-auto px-6 text-center">
					<p className="text-2xl text-black">Loading testimonials...</p>
				</div>
			</section>
		)
	}

	if (testimonials.length === 0) {
		return null
	}

	return (
		<>
			<section className="relative w-full bg-gradient-to-br from-yellow-400 via-orange-300 to-pink-300 py-20 md:py-28 overflow-hidden">
				{/* Decorative Blobs */}
				<div className="absolute top-0 left-0 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
				<div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-400/20 rounded-full blur-2xl" />

				<div className="relative z-10 max-w-5xl mx-auto px-6">
					{/* Heading */}
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black text-center mb-16 leading-tight">
						5-Star Wedding Stories from Happy Indian Couples
					</h2>

					{/* Testimonial Card */}
					<div
						className="relative"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						{/* Navigation Buttons */}
						<button
							onClick={prevTestimonial}
							className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-xl hover:bg-pink-500 hover:text-white transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-pink-300"
							aria-label="Previous testimonial"
						>
							<MdChevronLeft className="text-3xl" />
						</button>

						<button
							onClick={nextTestimonial}
							className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-xl hover:bg-pink-500 hover:text-white transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-pink-300"
							aria-label="Next testimonial"
						>
							<MdChevronRight className="text-3xl" />
						</button>

						{/* Testimonial Content */}
						<div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 min-h-[400px] flex flex-col justify-center">
							<div
								key={currentIndex}
								className="animate-fadeIn"
							>
								{/* Quote */}
								<p className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-900 text-center mb-8 leading-relaxed">
									"{testimonials[currentIndex].review}"
								</p>

								{/* Couple Info */}
								<div className="text-center">
									<p className="text-lg md:text-xl font-bold text-black mb-2">
										– {testimonials[currentIndex].brideName} & {testimonials[currentIndex].groomName}
									</p>
									<p className="text-base md:text-lg text-gray-700">
										{testimonials[currentIndex].city} | Budget: {testimonials[currentIndex].budget}
									</p>
								</div>
							</div>

							{/* Dots Indicator */}
							<div className="flex justify-center gap-2 mt-10">
								{testimonials.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentIndex(index)}
										className={`w-3 h-3 rounded-full transition-all duration-300 ${
											index === currentIndex
												? 'bg-pink-500 w-8'
												: 'bg-gray-400 hover:bg-gray-600'
										}`}
										aria-label={`Go to testimonial ${index + 1}`}
									/>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Fade Animation */}
				<style jsx>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
					.animate-fadeIn {
						animation: fadeIn 0.5s ease-out;
					}
				`}</style>
			</section>
		</>
	)
}
