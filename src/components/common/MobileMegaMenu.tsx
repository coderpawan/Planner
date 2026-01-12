'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MdClose, MdChevronRight, MdPeople, MdPerson, MdKeyboardArrowDown, MdEventNote, MdBookmark, MdGroup, MdSettings, MdLogout, MdStorefront, MdFace, MdMusicNote, MdTheaterComedy, MdTempleHindu, MdDirectionsCar, MdCardGiftcard, MdShoppingCart, MdAccountBalanceWallet } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { MenuDataItem, slugToTitle, titleToSlug } from '@/lib/menuUtils'
import { filterMenuByCategory } from '@/lib/firestore-menu'
import { useCredits } from '@/contexts/CreditContext'
import { useCartCount } from '@/lib/cartUtils'

interface User {
  name: string;
  city: string;
}

interface MobileMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  user: User | null;
  menuItems: MenuDataItem[];
}

// Static left section items for Services menu
const servicesLeftLinks = [
	{ label: 'Wedding Planner', slug: 'wedding_planner', icon: MdPerson },
	{ label: 'Makeup Styling', slug: 'makeup_styling', icon: MdFace },
	{ label: 'Music Entertainment', slug: 'music_entertainment', icon: MdMusicNote },
	{ label: 'Choreography', slug: 'choreography', icon: MdTheaterComedy },
	{ label: 'Ritual Services', slug: 'ritual_services', icon: MdTempleHindu },
	{ label: 'Wedding Transport', slug: 'wedding_transport', icon: MdDirectionsCar },
	{ label: 'Invitations Gifting', slug: 'invitations_gifting', icon: MdCardGiftcard },
]

// Static left section items for Trending Ideas menu
const ideasLeftLinks = [
	'Punjabi Big Fat Wedding',
	'Minimal Pastel',
	'Beach Wedding',
	'Vintage Heritage',
	'Bengali Traditional',
	'Small Intimate Wedding',
]

export default function MobileMegaMenu({
	isOpen,
	onClose,
	onLoginClick,
	user,
	menuItems,
}: MobileMegaMenuProps) {
	const [activeSection, setActiveSection] = useState<'services' | 'budget' | 'ideas'>('services')
	const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
	const router = useRouter()
	const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
	const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
	const { credits, isLoading: creditsLoading } = useCredits()
	const { count: cartCount } = useCartCount(uid)

	const handleJoinUs = () => {
		onClose()
		if (role === 'Vendor') {
			router.push('/vendordashboard')
		} else if (role === 'Admin') {
			router.push('/admin')
		} else {
			router.push('/vendor')
		}
	}

	const handleStartPlanning = () => {
		onClose()
		onLoginClick()
	}

	const handleLogout = () => {
		setIsUserDropdownOpen(false)
		localStorage.removeItem('phone')
		localStorage.removeItem('city')
		localStorage.removeItem('name')
		localStorage.removeItem('role')
		window.location.reload()
	}

	if (!isOpen) return null

	// Get filtered menu items for current section
	const filteredItems = filterMenuByCategory(menuItems, activeSection)

	// Get navigation path based on menu type
	const getNavigationPath = (name: string) => {
		if (activeSection === 'services') return `/vendors/${name}`
		if (activeSection === 'budget') return `/budget/${name}`
		if (activeSection === 'ideas') return `/trending-ideas#${name}`
		return '/'
	}

	// Render left section based on menu type
	const renderLeftSection = () => {
		if (activeSection === 'budget') {
			// Budget has no left section
			return null
		}

		if (activeSection === 'services') {
			return (
				<div className="mb-6">
					<h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
						All Services
					</h3>
					<ul className="space-y-1">
						{servicesLeftLinks.map((item, idx) => {
							const IconComponent = item.icon
							return (
								<li key={idx}>
									<Link
											href={`/vendors/${item.slug}`}
										onClick={onClose}
										className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors active:bg-gray-100"
									>
										<div className="flex items-center gap-3">
											<IconComponent className="text-xl text-gray-600" />
											<span className="text-sm font-medium text-gray-900">
												{item.label}
											</span>
										</div>
										<MdChevronRight className="text-xl text-gray-400" />
									</Link>
								</li>
							)
						})}
					</ul>
				</div>
			)
		}

		if (activeSection === 'ideas') {
			return (
				<div className="mb-6">
					<h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
						All Themes
					</h3>
					<ul className="space-y-1">
						{ideasLeftLinks.map((title, idx) => {
							const slug = titleToSlug(title)
							return (
								<li key={idx}>
									<Link
										href={`/trending-ideas#${slug}`}
										onClick={onClose}
										className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors active:bg-gray-100"
									>
										<div className="flex items-center gap-3">
											<MdStorefront className="text-xl text-gray-600" />
											<span className="text-sm font-medium text-gray-900">
												{title}
											</span>
										</div>
										<MdChevronRight className="text-xl text-gray-400" />
									</Link>
								</li>
							)
						})}
					</ul>
				</div>
			)
		}

		return null
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
				onClick={onClose}
			/>

			{/* Mobile Bottom Sheet (< 768px) */}
			<div className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[90vh] flex flex-col shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
					<h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
						ShaadiSathi
					</h2>
					<button
						onClick={onClose}
						className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
						aria-label="Close menu"
					>
						<MdClose className="text-2xl" />
					</button>
				</div>

				{/* Tabs - Horizontal Scroll */}
				<div className="flex-shrink-0 border-b border-gray-200 overflow-x-auto scrollbar-hide">
					<div className="flex px-4 gap-2 min-w-max">
						{(['services', 'budget', 'ideas'] as const).map((key) => {
							const isActive = activeSection === key
							const label = key === 'services' ? 'Services' : key === 'budget' ? 'Budget' : 'Trending Ideas'
							return (
								<button
									key={key}
									onClick={() => setActiveSection(key)}
									className={`py-3 px-4 text-sm font-medium whitespace-nowrap transition-all ${
										isActive
											? 'text-black border-b-2 border-black'
											: 'text-gray-500 hover:text-gray-900'
									}`}
								>
									{label}
								</button>
							)
						})}
					</div>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto px-6 py-4">
					{/* Left Section (Services/Ideas only) */}
					{renderLeftSection()}

					{/* Cards from Firestore */}
					<div className="mb-6">
						<h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
							{activeSection === 'services' && 'Popular Services'}
							{activeSection === 'budget' && 'Budget Ranges'}
							{activeSection === 'ideas' && 'Trending Themes'}
						</h3>
						<div className="space-y-3">
							{filteredItems.slice(0, 4).map((item, idx) => (
								<Link
									key={idx}
									href={getNavigationPath(item.name)}
									onClick={onClose}
									className="block rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
								>
									<div className="relative h-32 w-full">
										<Image
											src={item.image}
											alt={slugToTitle(item.name)}
											fill
											className="object-cover"
											sizes="100vw"
										/>
									</div>
									<div className="p-4 bg-white">
										<p className="text-sm font-semibold text-gray-900">
											{slugToTitle(item.name)}
										</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>

				{/* Sticky Bottom CTA */}
				<div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0 space-y-2">
					{/* Cart Icon - Only show when logged in */}
					{user && (
						<Link
							href="/cart"
							onClick={onClose}
							className="w-full flex items-center justify-center gap-3 py-3 rounded-full border-2 border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 transition-colors relative"
						>
							<MdShoppingCart className="text-xl text-purple-600" />
							<span className="text-sm font-medium text-gray-900">View Cart</span>
							{cartCount > 0 && (
								<span className="absolute top-2 right-4 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
									{cartCount}
								</span>
							)}
						</Link>
					)}
					
					{/* Pricing Link */}
					<Link
						href="/price"
						onClick={onClose}
						className="w-full block text-center text-sm font-medium text-gray-900 py-3 rounded-full border-2 border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100 transition-colors"
					>
						View Pricing
					</Link>
					
					{user ? (
						<>							{/* Credits Display for User and Vendor Roles */}
							{(role === 'User' || role === 'Vendor') && (
								<div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-2">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-gray-600">Credits Remaining</span>
										<div className="flex items-center gap-1.5">
											<MdAccountBalanceWallet className="text-lg text-pink-600" />
											<span className="text-xl font-bold text-pink-600">
												{creditsLoading ? '...' : credits}
											</span>
										</div>
									</div>
								</div>
							)}
														{/* User Info Section */}
							<div className="bg-pink-50 rounded-2xl p-4 mb-2">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
											<MdPerson className="text-xl text-white" />
										</div>
										<div>
											<p className="text-sm font-semibold text-gray-900">
												Hi, {user.name.split(' ')[0]}
											</p>
											<p className="text-xs text-gray-600">{user.city}</p>
										</div>
									</div>
									<button
										onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
										className="p-2 hover:bg-pink-100 rounded-full transition-colors"
									>
										<MdKeyboardArrowDown className={`text-xl transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
									</button>
								</div>

								{/* User Menu Items */}
								{isUserDropdownOpen && (
									<div className="space-y-1 pt-2 border-t border-pink-200">
										<Link
											href="/my-plans"
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
											onClick={onClose}
										>
											<MdEventNote className="text-lg text-gray-600" />
											<span className="text-sm font-medium text-gray-900">My Plans</span>
										</Link>
										<Link
											href="/saved-cards"
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
											onClick={onClose}
										>
											<MdBookmark className="text-lg text-gray-600" />
											<span className="text-sm font-medium text-gray-900">Saved Cards</span>
										</Link>
										<Link
											href="/guest-list"
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
											onClick={onClose}
										>
											<MdGroup className="text-lg text-gray-600" />
											<span className="text-sm font-medium text-gray-900">Guest List</span>
										</Link>
										<Link
											href="/settings"
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
											onClick={onClose}
										>
											<MdSettings className="text-lg text-gray-600" />
											<span className="text-sm font-medium text-gray-900">Settings</span>
										</Link>
										<button
											onClick={handleLogout}
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
										>
											<MdLogout className="text-lg text-red-600" />
											<span className="text-sm font-medium text-red-600">Logout</span>
										</button>
									</div>
								)}
							</div>
						</>
					) : (
						<>
							<button
								onClick={handleStartPlanning}
								className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white text-sm font-semibold py-3 rounded-full hover:from-pink-600 hover:to-pink-700 transition-all shadow-md"
							>
								Start Planning
							</button>
						</>
					)}
					<button onClick={handleJoinUs} className="w-full text-sm font-medium text-gray-900 py-3 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
						<MdPeople className="text-lg" />
						<span>{role === 'Vendor' ? 'Vendor Dashboard' : role === 'Admin' ? 'Admin Dashboard' : 'Are you a vendor?'}</span>
					</button>
				</div>
			</div>

			{/* Tablet Centered Modal (768px - 1023px) */}
			<div className="hidden md:block lg:hidden fixed inset-0 z-50 flex items-center justify-center p-6">
				<div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
					{/* Header */}
					<div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 flex-shrink-0">
						<h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
							ShaadiSathi
						</h2>
						<button
							onClick={onClose}
							className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
							aria-label="Close menu"
						>
							<MdClose className="text-2xl" />
						</button>
					</div>

					{/* Tabs */}
					<div className="flex-shrink-0 border-b border-gray-200">
						<div className="flex px-8 gap-1">
							{(['services', 'budget', 'ideas'] as const).map((key) => {
								const isActive = activeSection === key
								const label = key === 'services' ? 'Services' : key === 'budget' ? 'Budget' : 'Trending Ideas'
								return (
									<button
										key={key}
										onClick={() => setActiveSection(key)}
										className={`flex-1 py-4 px-3 text-sm font-medium transition-all ${
											isActive
												? 'text-black border-b-2 border-black bg-gray-50'
												: 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
										}`}
									>
										{label}
									</button>
								)
							})}
						</div>
					</div>

					{/* Content - Two Column Layout */}
					<div className="flex-1 overflow-y-auto">
						<div className="grid grid-cols-12 gap-6 p-8">
							{/* Left: Sub Links (conditional) */}
							{activeSection !== 'budget' && (
								<div className="col-span-4">
									<h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
										{activeSection === 'services' ? 'All Services' : 'All Themes'}
									</h3>
									<ul className="space-y-1">
										{activeSection === 'services' && servicesLeftLinks.map((item, idx) => {
											const IconComponent = item.icon
											return (
												<li key={idx}>
													<Link
														href={`/vendors/${item.slug}`}
														onClick={onClose}
														className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors"
													>
														<div className="flex items-center gap-3">
															<IconComponent className="text-xl text-gray-600" />
															<span className="text-sm font-medium text-gray-900">
																{item.label}
															</span>
														</div>
														<MdChevronRight className="text-xl text-gray-400" />
													</Link>
												</li>
											)
										})}
										{activeSection === 'ideas' && ideasLeftLinks.map((title, idx) => {
											const slug = titleToSlug(title)
											return (
												<li key={idx}>
													<Link
														href={`/trending-ideas#${slug}`}
														onClick={onClose}
														className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors"
													>
														<div className="flex items-center gap-3">
															<MdStorefront className="text-xl text-gray-600" />
															<span className="text-sm font-medium text-gray-900">
																{title}
															</span>
														</div>
														<MdChevronRight className="text-xl text-gray-400" />
													</Link>
												</li>
											)
										})}
									</ul>
								</div>
							)}

							{/* Right: Cards in 2x2 Grid */}
							<div className={activeSection === 'budget' ? 'col-span-12' : 'col-span-8'}>
								<h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
									{activeSection === 'services' && 'Popular Services'}
									{activeSection === 'budget' && 'Budget Ranges'}
									{activeSection === 'ideas' && 'Trending Themes'}
								</h3>
								<div className="grid grid-cols-2 gap-4">
									{filteredItems.slice(0, 4).map((item, idx) => (
										<Link
											key={idx}
											href={getNavigationPath(item.name)}
											onClick={onClose}
											className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
										>
											<div className="relative h-40 w-full">
												<Image
													src={item.image}
													alt={slugToTitle(item.name)}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 100vw, 50vw"
												/>
											</div>
											<div className="p-4 bg-white">
												<p className="text-sm font-semibold text-gray-900 leading-tight">
													{slugToTitle(item.name)}
												</p>
											</div>
										</Link>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Sticky Bottom CTA */}
					<div className="px-8 py-6 bg-white border-t border-gray-200 flex-shrink-0">
						{/* Cart Icon - Only show when logged in */}
						{user && (
							<Link
								href="/cart"
								onClick={onClose}
								className="w-full flex items-center justify-center gap-3 py-3 rounded-full border-2 border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 transition-colors mb-3 relative"
							>
								<MdShoppingCart className="text-xl text-purple-600" />
								<span className="text-sm font-medium text-gray-900">View Cart</span>
								{cartCount > 0 && (
									<span className="absolute top-2 right-6 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
										{cartCount}
									</span>
								)}
							</Link>
						)}
						
						{/* Pricing Link */}
						<Link
							href="/price"
							onClick={onClose}
							className="w-full block text-center text-sm font-medium text-gray-900 py-3 rounded-full border-2 border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100 transition-colors mb-3"
						>
							View Pricing
						</Link>
						
						{user ? (
							<div className="space-y-3">
								{/* Credits Display for User and Vendor Roles */}
								{(role === 'User' || role === 'Vendor') && (
									<div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-600">Credits Remaining</span>
											<div className="flex items-center gap-2">
												<MdAccountBalanceWallet className="text-xl text-pink-600" />
												<span className="text-2xl font-bold text-pink-600">
													{creditsLoading ? '...' : credits}
												</span>
											</div>
										</div>
									</div>
								)}
								
								{/* User Info Section */}
								<div className="bg-pink-50 rounded-2xl p-4">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
												<MdPerson className="text-2xl text-white" />
											</div>
											<div>
												<p className="text-base font-semibold text-gray-900">
													Hi, {user.name.split(' ')[0]}
												</p>
												<p className="text-sm text-gray-600">{user.city}</p>
											</div>
										</div>
										<button
											onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
											className="p-2 hover:bg-pink-100 rounded-full transition-colors"
										>
											<MdKeyboardArrowDown className={`text-2xl transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
										</button>
									</div>

									{/* User Menu Items */}
									{isUserDropdownOpen && (
										<div className="grid grid-cols-2 gap-2 pt-3 border-t border-pink-200">
											<Link
												href="/my-plans"
												className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
												onClick={onClose}
											>
												<MdEventNote className="text-lg text-gray-600" />
												<span className="text-sm font-medium text-gray-900">My Plans</span>
											</Link>
											<Link
												href="/saved-cards"
												className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
												onClick={onClose}
											>
												<MdBookmark className="text-lg text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Saved Cards</span>
											</Link>
											<Link
												href="/guest-list"
												className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
												onClick={onClose}
											>
												<MdGroup className="text-lg text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Guest List</span>
											</Link>
											<Link
												href="/settings"
												className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-100 rounded-lg transition-colors"
												onClick={onClose}
											>
												<MdSettings className="text-lg text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Settings</span>
											</Link>
											<button
											    onClick={handleLogout}
												className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors"
											>
												<MdLogout className="text-lg text-red-600" />
												<span className="text-sm font-medium text-red-600">Logout</span>
											</button>
										</div>
									)}
								</div>
								<button onClick={handleJoinUs} className="w-full text-sm font-medium text-gray-900 py-3 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
									<MdPeople className="text-lg" />
									<span>{role === 'Vendor' ? 'Vendor Dashboard' : role === 'Admin' ? 'Admin Dashboard' : 'Are you a vendor?'}</span>
								</button>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3">
								<button
									onClick={handleStartPlanning}
									className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-sm font-semibold py-3 rounded-full hover:from-pink-600 hover:to-pink-700 transition-all shadow-md"
								>
									Start Planning
								</button>
								<button onClick={handleJoinUs} className="text-sm font-medium text-gray-900 py-3 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
									<MdPeople className="text-lg" />
								<span>{role === 'Vendor' ? 'Vendor Dashboard' : role === 'Admin' ? 'Admin Dashboard' : 'Are you a vendor?'}</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
