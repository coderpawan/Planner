'use client'

import Link from 'next/link'
import { MdSavings, MdDiamond, MdAutoAwesome, MdWorkspacePremium } from 'react-icons/md'

interface BudgetCard {
	id: number
	range: string
	subtitle: string
	href: string
	gradient: string
	icon: React.ElementType
	iconBg: string
	textColor: string
	features: string[]
}

const budgetCards: BudgetCard[] = [
	{
		id: 1,
		range: 'Under 4 Lakh',
		subtitle: 'Simple & Beautiful Celebrations',
		href: '/budget/under-4-lakh',
		gradient: 'from-emerald-100 via-green-50 to-teal-100',
		icon: MdSavings,
		iconBg: 'bg-emerald-500',
		textColor: 'text-emerald-700',
		features: ['Intimate venues', 'Budget-friendly decor', 'Essential photography'],
	},
	{
		id: 2,
		range: '₹4–8 Lakh',
		subtitle: 'Elegant Weddings for Every Family',
		href: '/budget/4-8-lakh',
		gradient: 'from-blue-100 via-sky-50 to-cyan-100',
		icon: MdAutoAwesome,
		iconBg: 'bg-blue-500',
		textColor: 'text-blue-700',
		features: ['Mid-size venues', 'Professional services', 'Quality catering'],
	},
	{
		id: 3,
		range: '₹8–20 Lakh',
		subtitle: 'Grand Yet Affordable Options',
		href: '/budget/8-20-lakh',
		gradient: 'from-pink-100 via-rose-50 to-orange-100',
		icon: MdDiamond,
		iconBg: 'bg-pink-500',
		textColor: 'text-pink-700',
		features: ['Premium venues', 'Designer outfits', 'Live entertainment'],
	},
	{
		id: 4,
		range: '₹20 Lakh+',
		subtitle: 'Premium & Luxury Experiences',
		href: '/budget/20-lakh-plus',
		gradient: 'from-amber-100 via-yellow-50 to-orange-100',
		icon: MdWorkspacePremium,
		iconBg: 'bg-amber-500',
		textColor: 'text-amber-700',
		features: ['Luxury resorts', 'Celebrity makeup', 'Destination weddings'],
	},
]

export default function BudgetSection() {
	return (
		<section className="w-full bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-12 md:mb-16">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
						Plan Your Wedding on Any Budget
					</h2>
					<p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
						Choose a budget that fits your dream day—every wedding is beautiful ✨
					</p>
				</div>

				{/* Budget Cards Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
					{budgetCards.map((card) => {
						const IconComponent = card.icon
						return (
							<Link
								key={card.id}
								href={card.href}
								className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:scale-105 overflow-hidden"
							>
								{/* Gradient Background */}
								<div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
								
								{/* Decorative Circle */}
								<div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
								<div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

								{/* Content Container */}
								<div className="relative z-10 p-6 sm:p-8 flex flex-col h-full min-h-[320px] sm:min-h-[340px]">
									{/* Icon */}
									<div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
										<IconComponent className="text-3xl text-white" />
									</div>

									{/* Budget Range */}
									<h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 group-hover:underline decoration-2 underline-offset-4 transition-all">
										{card.range}
									</h3>

									{/* Subtitle */}
									<p className={`text-sm md:text-base font-medium ${card.textColor} mb-4`}>
										{card.subtitle}
									</p>

									{/* Features List */}
									<ul className="space-y-2 flex-grow">
										{card.features.map((feature, idx) => (
											<li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
												<span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
												<span>{feature}</span>
											</li>
										))}
									</ul>

									{/* CTA Arrow */}
									<div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:gap-3 transition-all">
										<span>Explore options</span>
										<svg
											className="w-5 h-5 group-hover:translate-x-1 transition-transform"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17 8l4 4m0 0l-4 4m4-4H3"
											/>
										</svg>
									</div>
								</div>

								{/* Hover Border Glow */}
								<div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-gray-300 transition-all duration-300" />
							</Link>
						)
					})}
				</div>

				{/* Trust Message */}
				<div className="mt-12 text-center">
					<p className="text-base text-gray-600 max-w-xl mx-auto">
						💖 Every budget creates beautiful memories. We help you plan the perfect celebration without stress.
					</p>
				</div>
			</div>
		</section>
	)
}
