'use client'

import Link from 'next/link'

interface ServiceCategory {
	id: number
	key: string
	label: string
	description: string
	badge?: string
	hoverGradient: string
}

const serviceCategories: ServiceCategory[] = [
	{ id: 1, key: 'venue', label: 'Venues & Wedding Spaces', description: 'Find the perfect venue for your special day', badge: 'Popular', hoverGradient: 'from-pink-100 to-orange-100' },
	{ id: 2, key: 'wedding_planner', label: 'Wedding Planning & Coordination', description: 'Expert planners to organize your dream wedding', badge: 'Premium', hoverGradient: 'from-violet-100 to-purple-100' },
	{ id: 3, key: 'catering', label: 'Catering & Food Services', description: 'Delicious cuisine for every palate and budget', badge: 'Popular', hoverGradient: 'from-orange-100 to-red-100' },
	{ id: 4, key: 'decor', label: 'Wedding Decor & Styling', description: 'Transform your venue with stunning decorations', hoverGradient: 'from-purple-100 to-pink-100' },
	{ id: 5, key: 'photography', label: 'Photography & Videography', description: 'Capture every moment beautifully', badge: 'Popular', hoverGradient: 'from-rose-100 to-pink-100' },
	{ id: 6, key: 'makeup_styling', label: 'Makeup, Mehendi & Styling', description: 'Look your absolute best on your big day', hoverGradient: 'from-green-100 to-teal-100' },
	{ id: 7, key: 'music_entertainment', label: 'Music, DJ & Entertainment', description: 'Keep your guests dancing all night long', hoverGradient: 'from-cyan-100 to-blue-100' },
	{ id: 8, key: 'choreography', label: 'Choreography & Performances', description: 'Professional dance routines and performances', hoverGradient: 'from-amber-100 to-yellow-100' },
	{ id: 9, key: 'ritual_services', label: 'Pandit, Priest & Ritual Services', description: 'Traditional ceremonies conducted with care', hoverGradient: 'from-yellow-100 to-orange-100' },
	{ id: 10, key: 'wedding_transport', label: 'Wedding Transport & Baraat Services', description: 'Arrive in style with luxury transport options', badge: 'Luxury', hoverGradient: 'from-blue-100 to-indigo-100' },
	{ id: 11, key: 'invitations_gifting', label: 'Invitations, Gifts & Packaging', description: 'Beautiful invites and thoughtful gifts', hoverGradient: 'from-indigo-100 to-blue-100' },
]

export default function VendorMarketplace() {
	return (
		<section className="w-full bg-[#FFF8F0] py-16 md:py-24">
			<div className="max-w-7xl mx-auto px-6">
  				{/* Service Categories Grid */}
				<div className="text-center mb-10">
					<h2 className="text-3xl md:text-4xl font-bold text-black">
						Find vendors for every vibe
					</h2>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
					{serviceCategories.map((category) => (
						<Link
							key={category.id}
							href={`/vendors/${category.key}`}
							className="relative group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:scale-[1.03] overflow-hidden min-h-[140px] flex flex-col items-center justify-center p-6"
						>
							{/* Hover Gradient Background */}
							<div className={`absolute inset-0 bg-gradient-to-br ${category.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
							
							{/* Decorative Curved Shape */}
							<div className="absolute -bottom-8 -right-8 w-24 h-24 bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							
							{/* Content */}
							<div className="relative z-10 text-center">
								{/* Badge */}
								{category.badge && (
									<span className="inline-block px-3 py-1 mb-3 text-xs font-semibold rounded-full bg-black/10 text-gray-800">
										{category.badge}
									</span>
								)}
								
								{/* Label */}
								<h3 className="text-base md:text-lg font-bold text-black group-hover:underline decoration-2 underline-offset-4 transition-all duration-300">
									{category.label}
								</h3>
								
								{/* Description */}
								<p className="text-xs md:text-sm text-gray-600 mt-2">
									{category.description}
								</p>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	)
}
