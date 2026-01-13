'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MdPeople, MdMenu, MdPerson, MdLogout, MdKeyboardArrowDown, MdEventNote, MdBookmark, MdGroup, MdSettings, MdStorefront, MdFace, MdMusicNote, MdTheaterComedy, MdTempleHindu, MdDirectionsCar, MdCardGiftcard, MdAccountBalanceWallet, MdShoppingCart } from 'react-icons/md'
import MobileMegaMenu from './MobileMegaMenu'
import { useRouter } from 'next/navigation'
import PhoneAuthModal from '../auth/PhoneAuthModal'
import { fetchMenuItems, filterMenuByCategory } from '@/lib/firestore-menu'
import { MenuDataItem, slugToTitle, titleToSlug } from '@/lib/menuUtils'
import Image from 'next/image'
import { useCredits } from '@/contexts/CreditContext'
import { useCartCount } from '@/lib/cartUtils'

const navItems = [
	{
		label: 'Services',
		hasDropdown: true,
		menuKey: 'services' as const,
	},
	{
		label: 'Budget',
		hasDropdown: true,
		menuKey: 'budget' as const,
	},
	{
		label: 'Trending Ideas',
		hasDropdown: true,
		menuKey: 'ideas' as const,
	},
	{
		label: 'Pricing',
		hasDropdown: false,
		href: '/price',
	},
]

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

interface DropdownMenuProps {
	isOpen: boolean
	menuKey: 'services' | 'budget' | 'ideas'
	menuItems: MenuDataItem[]
}

function DropdownMenu({ isOpen, menuKey, menuItems }: DropdownMenuProps) {
	if (!isOpen) return null

	const filteredItems = filterMenuByCategory(menuItems, menuKey)

	// Get navigation path based on menu type
	const getNavigationPath = (name: string) => {
		if (menuKey === 'services') return `/vendors/${name}`
		if (menuKey === 'budget') return `/budget/${name}`
		if (menuKey === 'ideas') return `/trending-ideas#${name}`
		return '/'
	}

	// Render left section based on menu type
	const renderLeftSection = () => {
		if (menuKey === 'budget') {
			// Budget has no left section
			return null
		}

		if (menuKey === 'services') {
			return (
				<div className="w-64 flex-shrink-0 pr-8 border-r border-gray-200">
					<h3 className="text-sm font-semibold text-black mb-4">
						Services &rarr;
					</h3>
					<ul className="flex flex-col space-y-3">
						{servicesLeftLinks.map((item, idx) => {
							const IconComponent = item.icon
							return (
								<li key={idx}>
									<Link
											href={`/vendors/${item.slug}`}
										className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition duration-150 w-full text-left"
									>
										<IconComponent className="text-lg flex-shrink-0" />
										<span className="text-sm font-medium text-gray-900 hover:text-black">
											{item.label}
										</span>
									</Link>
								</li>
							)
						})}
					</ul>
				</div>
			)
		}

		if (menuKey === 'ideas') {
			return (
				<div className="w-64 flex-shrink-0 pr-8 border-r border-gray-200">
					<h3 className="text-sm font-semibold text-black mb-4">
						Trending Ideas &rarr;
					</h3>
					<ul className="flex flex-col space-y-3">
						{ideasLeftLinks.map((title, idx) => {
							const slug = titleToSlug(title)
							return (
								<li key={idx}>
									<Link
										href={`/trending-ideas#${slug}`}
										className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition duration-150 w-full text-left"
									>
										<MdStorefront className="text-lg flex-shrink-0" />
										<span className="text-sm font-medium text-gray-900 hover:text-black">
											{title}
										</span>
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
		<div className="absolute left-0 right-0 top-[80px] w-full bg-white shadow-2xl z-50 border-b border-gray-100">
			<div className="max-w-6xl mx-auto px-6 py-8">
				<div className="flex gap-12">
					{/* Left Column - Menu Items (conditional) */}
					{renderLeftSection()}

					{/* Right Column - Feature Cards */}
					<div className={`${menuKey === 'budget' ? 'w-full' : 'flex-1'} min-w-0`}>
						<h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-6">
							{menuKey === 'services' && 'Popular Services'}
							{menuKey === 'budget' && 'Budget Ranges'}
							{menuKey === 'ideas' && 'Trending Themes'}
						</h4>
						<div className="grid grid-cols-4 gap-6">
							{filteredItems.slice(0, 4).map((item, idx) => (
								<Link
									key={idx}
									href={getNavigationPath(item.name)}
									className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition duration-200 cursor-pointer bg-white flex flex-col h-full"
								>
									<div className="relative h-48 w-full flex-shrink-0 bg-gray-100">
										<Image
											src={item.image}
											alt={slugToTitle(item.name)}
											fill
											className="object-cover"
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
										/>
									</div>
									<div className="p-4 flex-1 flex items-center justify-center">
										<p className="text-sm font-medium text-gray-900 text-center leading-tight">
											{slugToTitle(item.name)}
										</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function MainNavbar() {
	const [openDropdown, setOpenDropdown] = useState<string | null>(null)
	const [hoveredItem, setHoveredItem] = useState<string | null>(null)
	const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
	const [user, setUser] = useState<{ name: string; city: string } | null>(null)
	const [menuItems, setMenuItems] = useState<MenuDataItem[]>([])
	const navRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const userDropdownRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
	const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null
	const { credits, isLoading: creditsLoading } = useCredits()
	const { count: cartCount } = useCartCount(uid)

	// Fetch menu items from Firestore on mount
	useEffect(() => {
		async function loadMenuItems() {
			const items = await fetchMenuItems()
			setMenuItems(items)
		}
		loadMenuItems()
	}, [])

	const handleJoinUs = () => {
		if(role === 'Vendor'){
			router.push('/vendordashboard');
		} else if(role === 'Admin'){
			router.push('/admin');
		} else {
			router.push('/vendor');
		}
	}

	const handleStartPlanning = () => {
		setIsPhoneModalOpen(true)
	}

	// Close user dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
				setIsUserDropdownOpen(false)
			}
		}

		if (isUserDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isUserDropdownOpen])

	const toggleDropdown = (label: string) => {
		setOpenDropdown(openDropdown === label ? null : label)
	}

	const handleLogout = () => {
		setIsUserDropdownOpen(false);
		localStorage.removeItem("uid");
		localStorage.removeItem("phone");
		localStorage.removeItem("city");
		localStorage.removeItem("name");
		localStorage.removeItem("role");
		window.location.reload();
	}

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20)
		}
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const isClickOnNav = navRef.current && navRef.current.contains(event.target as Node)
			const isClickOnDropdown = dropdownRef.current && dropdownRef.current.contains(event.target as Node)

			if (!isClickOnNav && !isClickOnDropdown) {
				setOpenDropdown(null)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	useEffect(() => {
	    const name = localStorage.getItem('name');
	    const city = localStorage.getItem('city');
		if(name && city){
			setUser({ name, city });
		}		
	}, []);


	useEffect(() => {
		if (isMobileMenuOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isMobileMenuOpen])

	return (
		<>
			<header
				ref={navRef}
				className={`w-full border-b border-gray-200 relative z-40 transition-all duration-300 ${isScrolled
					? 'bg-white/95 backdrop-blur-md shadow-lg'
					: 'bg-transparent'
					}`}
				style={{ overflow: 'visible' }}
			>
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						{/* Logo */}
						<Link
							href="/"
							className="text-2xl font-bold tracking-tight text-black hover:opacity-75 transition duration-200 whitespace-nowrap flex-shrink-0"
						>
							ShaadiSathi
						</Link>

						{/* Center Navigation */}
						<nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
							{navItems.map((item) => (
								<div
									key={item.label}
									className="relative"
									onMouseEnter={() => setHoveredItem(item.label)}
									onMouseLeave={() => setHoveredItem(null)}
								>
									{item.hasDropdown ? (
										<button
											onClick={() => toggleDropdown(item.label)}
											className={`text-sm font-medium transition duration-200 pb-1 relative whitespace-nowrap ${openDropdown === item.label
												? 'text-black'
												: 'text-gray-900 hover:text-black'
												}`}
										>
											{item.label}
											<span
												className={`absolute bottom-0 left-0 w-full h-0.5 bg-black transition-opacity duration-200 ${openDropdown === item.label || hoveredItem === item.label
													? 'opacity-100'
													: 'opacity-0'
													}`}
											></span>
										</button>
									) : (
										<Link
											href={item.href || "#"}
											className="text-sm font-medium text-gray-900 hover:text-black transition duration-200 pb-1 relative whitespace-nowrap inline-block"
										>
											{item.label}
											<span
												className={`absolute bottom-0 left-0 w-full h-0.5 bg-black transition-opacity duration-200 ${hoveredItem === item.label
													? 'opacity-100'
													: 'opacity-0'
													}`}
											></span>
										</Link>
									)}
								</div>
							))}
						</nav>

						{/* Right Actions */}
						<div className="hidden lg:flex items-center gap-6 flex-shrink-0">
							<button onClick={handleJoinUs} className="text-sm font-medium text-gray-900 hover:text-black transition duration-200 flex items-center gap-1.5 whitespace-nowrap">
								<MdPeople className="text-lg" />
								{role === 'Vendor' ? <span>Vendor Dashboard</span> : role ==='Admin' ? <span>Admin Dashboard</span> : <span>Are you a vendor?</span>}
							</button>

							{/* Cart Icon - Only show when logged in */}
							{user && (
								<Link 
									href="/cart"
									className="relative text-gray-900 hover:text-black transition duration-200"
								>
									<MdShoppingCart className="text-2xl" />
									{cartCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
											{cartCount}
										</span>
									)}
								</Link>
							)}

							{user ? (
								<div className="relative" ref={userDropdownRef}>
									<button
										onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
										className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors"
									>
										<MdPerson className="text-lg text-pink-600" />
										<span className="text-sm font-medium text-gray-900">
											Hi, {user.name.split(' ')[0]}
										</span>
										<MdKeyboardArrowDown className={`text-lg transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
									</button>

									{/* User Dropdown Menu */}
									{isUserDropdownOpen && (
										<div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[9999]">
											{/* Credits Display for User and Vendor Roles */}
											{(role === 'User' || role === 'Vendor') && (
												<>
													<div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-2xl">
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
													<div className="border-t border-gray-100 my-2" />
												</>
											)}
											
											<Link
												href="/my-plans"
												className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
												onClick={() => setIsUserDropdownOpen(false)}
											>
												<MdEventNote className="text-xl text-gray-600" />
												<span className="text-sm font-medium text-gray-900">My Plans</span>
											</Link>
											<Link
												href="/saved-cards"
												className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
												onClick={() => setIsUserDropdownOpen(false)}
											>
												<MdBookmark className="text-xl text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Saved Cards</span>
											</Link>
											<Link
												href="/guest-list"
												className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
												onClick={() => setIsUserDropdownOpen(false)}
											>
												<MdGroup className="text-xl text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Guest List</span>
											</Link>
											<Link
												href="/settings"
												className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
												onClick={() => setIsUserDropdownOpen(false)}
											>
												<MdSettings className="text-xl text-gray-600" />
												<span className="text-sm font-medium text-gray-900">Settings</span>
											</Link>
											<div className="border-t border-gray-100 my-2" />
											<button
												onClick={() => { handleLogout() }}
												className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
											>
												<MdLogout className="text-xl text-red-600" />
												<span className="text-sm font-medium text-red-600">Logout</span>
											</button>
										</div>
									)}
								</div>

							) : (
								<button
									onClick={handleStartPlanning}
									className="bg-pink-500 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-pink-600 transition duration-200 whitespace-nowrap shadow-md hover:shadow-lg"
								>
									Start Planning
								</button>
							)}
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setIsMobileMenuOpen(true)}
							className="lg:hidden w-10 h-10 flex items-center justify-center text-black hover:bg-gray-100 rounded-lg transition-colors"
							aria-label="Open menu"
						>
							<MdMenu className="text-2xl" />
						</button>
					</div>
				</div>
			</header>

			{/* Render dropdown for desktop */}
			<div ref={dropdownRef}>
				{navItems.map((item) =>
					item.hasDropdown && item.menuKey && (
						<DropdownMenu
							key={item.label}
							isOpen={openDropdown === item.label}
							menuKey={item.menuKey}
							menuItems={menuItems}
						/>
					)
				)}
			</div>

			{/* Mobile Mega Menu */}
			<MobileMegaMenu
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				onLoginClick={handleStartPlanning}
				user={user}
				menuItems={menuItems}
			/>

			<PhoneAuthModal
				isOpen={isPhoneModalOpen}
				onClose={() => setIsPhoneModalOpen(false)}
				onSuccess={(phone) => console.log('Verified:', phone)}
			/>
		</>
	)
}
