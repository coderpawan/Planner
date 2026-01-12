'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { MdArrowForward, MdCheckCircle, MdGroups, MdStars, MdTrendingUp, MdChevronLeft, MdChevronRight } from 'react-icons/md'
import MainNavbar from '@/components/common/MainNavbar'
import Footer from '@/components/common/Footer'
import VendorRegistrationModal from '@/components/vendor/VendorRegistrationModal'

export default function VendorPage() {
	const [showModal, setShowModal] = useState(false)
	const carouselRef = useRef<HTMLDivElement>(null)

	const categories = [
		{
			id: 'venues',
			title: 'Venues',
			description: 'Banquet halls, wedding gardens, resorts, aur destination wedding spaces',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		},
		{
			id: 'photographers',
			title: 'Photographers',
			description: 'Wedding photography, pre-wedding shoots, candid videos',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		},
		{
			id: 'catering',
			title: 'Catering',
			description: 'Traditional Indian food, multi-cuisine, live counters',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		},
		{
			id: 'mehendi',
			title: 'Mehendi Artists',
			description: 'Bridal mehendi, traditional designs, modern patterns',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		},
		{
			id: 'makeup',
			title: 'Bridal Makeup',
			description: 'HD makeup, airbrush, traditional bridal look',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		},
		{
			id: 'decoration',
			title: 'Decoration',
			description: 'Mandap decoration, stage setup, floral arrangements',
			image: 'images/Invitation cards/Testing/Card-1.webp'
		}
	]

	const scrollCarousel = (direction: 'left' | 'right') => {
		if (carouselRef.current) {
			const scrollAmount = 400
			const newScrollPosition = direction === 'left' 
				? carouselRef.current.scrollLeft - scrollAmount
				: carouselRef.current.scrollLeft + scrollAmount
			
			carouselRef.current.scrollTo({
				left: newScrollPosition,
				behavior: 'smooth'
			})
		}
	}

	return (
		<>
			<MainNavbar />

			{/* Hero Section */}
			<section className="relative min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 overflow-hidden">
				<div className="absolute inset-0 bg-black/20" />
				
				<div className="relative max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12 min-h-screen">
					{/* Left Content */}
					<div className="flex-1 text-white space-y-8">
						<h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in">
							Boost Your Business With Our Platform
						</h1>
						<p className="text-2xl md:text-3xl leading-relaxed">
							Hamare <span className="font-bold text-yellow-300">3 lakh+ users</span> ban sakte hain aapke agle customers!
						</p>
						<button
							onClick={() => setShowModal(true)}
							className="inline-flex items-center gap-3 px-10 py-5 bg-white text-purple-600 font-bold text-xl rounded-full hover:bg-yellow-300 transform hover:scale-105 transition-all duration-300 shadow-2xl"
						>
							Register Now
							<MdArrowForward className="text-2xl" />
						</button>

						{/* Trust Badges */}
						<div className="flex flex-wrap gap-6 pt-8">
							<div className="flex items-center gap-2">
								<MdCheckCircle className="text-3xl text-yellow-300" />
								<span className="text-lg">Free Registration</span>
							</div>
							<div className="flex items-center gap-2">
								<MdCheckCircle className="text-3xl text-yellow-300" />
								<span className="text-lg">Quick Approval</span>
							</div>
							<div className="flex items-center gap-2">
								<MdCheckCircle className="text-3xl text-yellow-300" />
								<span className="text-lg">Get More Clients</span>
							</div>
						</div>
					</div>

					{/* Right Decorative Collage */}
					<div className="flex-1 relative h-[600px] hidden lg:block">
						<div className="absolute inset-0">
							<div className="absolute top-0 right-0 w-3/5 h-2/5 rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform rotate-6">
								<Image src="images/Invitation cards/Testing/Card-1.webp" alt="Vendor" fill className="object-cover" unoptimized />
							</div>
							<div className="absolute bottom-20 left-0 w-3/5 h-2/5 rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform -rotate-6">
								<Image src="images/Invitation cards/Testing/Card-1.webp" alt="Vendor" fill className="object-cover" unoptimized />
							</div>
							<div className="absolute top-1/3 right-1/4 w-2/5 h-2/5 rounded-3xl overflow-hidden shadow-2xl border-8 border-white z-10">
								<Image src="images/Invitation cards/Testing/Card-1.webp" alt="Vendor" fill className="object-cover" unoptimized />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow">
							<MdGroups className="text-6xl text-purple-600 mx-auto mb-4" />
							<h3 className="text-5xl font-bold text-purple-600 mb-2">1000+</h3>
							<p className="text-xl text-gray-700 font-semibold">Vendors Joined</p>
						</div>
						<div className="text-center p-8 bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow">
							<MdStars className="text-6xl text-pink-600 mx-auto mb-4" />
							<h3 className="text-5xl font-bold text-pink-600 mb-2">9+</h3>
							<p className="text-xl text-gray-700 font-semibold">Services Offered</p>
						</div>
						<div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow">
							<MdTrendingUp className="text-6xl text-orange-600 mx-auto mb-4" />
							<h3 className="text-5xl font-bold text-orange-600 mb-2">20,000+</h3>
							<p className="text-xl text-gray-700 font-semibold">Happy Customers</p>
						</div>
					</div>
				</div>
			</section>

			{/* Steps Section */}
			<section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
				<div className="max-w-7xl mx-auto px-6">
					<h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
						Get Started in 3 Easy Steps
					</h2>
					<p className="text-xl text-center text-gray-600 mb-16">
						Registration kaafi simple hai, bas 3 steps follow karo!
					</p>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Step 1 */}
						<div className="relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
							<div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
								1
							</div>
							<div className="pt-6">
								<h3 className="text-2xl font-bold text-gray-900 mb-4">Fill Details</h3>
								<p className="text-gray-600">
									Apni basic details aur service category bataiye. Sirf 2 minute lagenge!
								</p>
							</div>
						</div>

						{/* Step 2 */}
						<div className="relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
							<div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
								2
							</div>
							<div className="pt-6">
								<h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Verification</h3>
								<p className="text-gray-600">
									OTP se phone number verify karo. Hamare team 24 hours mein aapse contact karegi.
								</p>
							</div>
						</div>

						{/* Step 3 */}
						<div className="relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
							<div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
								3
							</div>
							<div className="pt-6">
								<h3 className="text-2xl font-bold text-gray-900 mb-4">Get Listed & Grow</h3>
								<p className="text-gray-600">
									Aapki profile live ho jayegi aur customers directly aapse contact kar payenge!
								</p>
							</div>
						</div>
					</div>

					<div className="text-center mt-12">
						<button
							onClick={() => setShowModal(true)}
							className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
						>
							Register Now
							<MdArrowForward className="text-2xl" />
						</button>
					</div>
				</div>
			</section>

			{/* Vendor Categories Carousel */}
			<section className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-6">
					<h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
						Choose Your Service Category
					</h2>
					<p className="text-xl text-center text-gray-600 mb-16">
						Apni service select karo aur grow karo apna business!
					</p>

					{/* Carousel Container */}
					<div className="relative">
						{/* Left Arrow */}
						<button
							onClick={() => scrollCarousel('left')}
							className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors -ml-6"
							aria-label="Previous"
						>
							<MdChevronLeft className="text-3xl text-gray-800" />
						</button>

						{/* Carousel */}
						<div
							ref={carouselRef}
							className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
							style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
						>
							{categories.map((category) => (
								<div
									key={category.id}
									className="flex-shrink-0 w-[350px] bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 snap-center"
								>
									<div className="relative h-64">
										<Image
											src={category.image}
											alt={category.title}
											fill
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="p-6">
										<h3 className="text-2xl font-bold text-gray-900 mb-3">{category.title}</h3>
										<p className="text-gray-600">{category.description}</p>
									</div>
								</div>
							))}
						</div>

						{/* Right Arrow */}
						<button
							onClick={() => scrollCarousel('right')}
							className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors -mr-6"
							aria-label="Next"
						>
							<MdChevronRight className="text-3xl text-gray-800" />
						</button>
					</div>

					{/* Register Button Below Carousel */}
					<div className="text-center mt-12">
						<button
							onClick={() => setShowModal(true)}
							className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
						>
							Register Now
							<MdArrowForward className="text-2xl" />
						</button>
					</div>
				</div>
			</section>

			<Footer />

			<VendorRegistrationModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
			/>

			<style jsx>{`
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
			`}</style>
		</>
	)
}
