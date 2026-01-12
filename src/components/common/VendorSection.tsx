'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdArrowForward } from 'react-icons/md'

export default function VendorSection() {
	const router = useRouter()

	const handleJoinUs = () => {
		router.push('/vendor')
	}

	return (
		<section className="w-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-20">
			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					{/* Left Content */}
					<div className="space-y-6">
						<h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
							Are you a vendor?
						</h2>
						<p className="text-xl text-gray-700 leading-relaxed">
							Kya aap apne wedding services ko aur zyada logo tak pahuchana chahte hain?{' '}
							<span className="font-semibold text-pink-600">Hamare platform se judo!</span>
						</p>
						<button
							onClick={handleJoinUs}
							className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
						>
							Join Us
							<MdArrowForward className="text-2xl" />
						</button>
						
						<div className="flex items-center gap-8 pt-4">
							<div>
								<p className="text-3xl font-bold text-purple-600">1000+</p>
								<p className="text-sm text-gray-600">Vendors</p>
							</div>
							<div>
								<p className="text-3xl font-bold text-pink-600">20k+</p>
								<p className="text-sm text-gray-600">Customers</p>
							</div>
							<div>
								<p className="text-3xl font-bold text-orange-600">9+</p>
								<p className="text-sm text-gray-600">Services</p>
							</div>
						</div>
					</div>

					{/* Right Image Collage */}
					<div className="relative h-[500px] hidden lg:block">
						<div className="absolute top-0 left-0 w-3/5 h-3/5 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
							<Image
								src="/images/Invitation cards/Testing/card-1.webp"
								alt="Wedding Venue"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="absolute bottom-0 right-0 w-3/5 h-3/5 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
							<Image
								src="/images/Invitation cards/Testing/card-2.webp"
								alt="Bridal Makeup"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/5 h-2/5 rounded-2xl overflow-hidden shadow-2xl z-10 hover:scale-110 transition-transform duration-300">
							<Image
								src="/images/Invitation cards/Testing/card-3.webp"
								alt="Wedding Photography"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
					</div>

					{/* Mobile Image */}
					<div className="lg:hidden relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
						<Image
							src="/images/Invitation cards/Testing/card-1.webp"
							alt="Wedding Vendors"
							fill
							className="object-cover"
							unoptimized
						/>
					</div>
				</div>
			</div>
		</section>
	)
}
