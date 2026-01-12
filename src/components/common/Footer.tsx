'use client'

import Link from 'next/link'
import { FaInstagram, FaYoutube, FaFacebookF, FaXTwitter } from 'react-icons/fa6'

export default function Footer() {
	const handleVendorRegister = () => {
		console.log('Vendor registration clicked')
	}

	return (
		<footer className="relative w-full bg-gradient-to-b from-black to-gray-950 text-white border-t border-gray-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-6">
					<div className="lg:col-span-2 space-y-6">
						<div>
							<h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
								ShaadiSathi
							</h3>
							<p className="text-xs text-gray-500">made with ❤️ in India</p>
						</div>

						<div className="hidden lg:block bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 p-4 rounded-xl">
							<h4 className="text-sm font-bold mb-1">Are you a wedding vendor?</h4>
							<p className="text-xs text-white/90 mb-3 leading-relaxed">
								Join our platform & get premium leads from verified couples across India.
							</p>
							<button
								onClick={handleVendorRegister}
								className="w-full py-2 px-3 bg-white text-purple-700 text-xs font-bold rounded-full hover:bg-gray-100 transition-colors"
							>
								Register as Vendor →
							</button>
						</div>
					</div>

					<div className="lg:col-span-2">
						<h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
							Planning & Tools
						</h4>
						<ul className="space-y-2">
							<li>
								<Link href="/card-design" className="text-xs text-gray-400 hover:text-white transition-colors">
									Invitation and Wedding Cards
								</Link>
							</li>
							<li>
								<Link href="/guest-list" className="text-xs text-gray-400 hover:text-white transition-colors">
									Guest List & RSVPs
								</Link>
							</li>
							<li>
								<Link href="/budget" className="text-xs text-gray-400 hover:text-white transition-colors">
									Budget Calculator
								</Link>
							</li>
							<li>
								<Link href="/vendors" className="text-xs text-gray-400 hover:text-white transition-colors">
									Vendor Marketplace
								</Link>
							</li>
							<li>
								<Link href="/checklist" className="text-xs text-gray-400 hover:text-white transition-colors">
									Wedding Checklist
								</Link>
							</li>
							<li>
								<Link href="/invitations" className="text-xs text-gray-400 hover:text-white transition-colors">
									Invitations
								</Link>
							</li>
						</ul>
					</div>

					<div className="hidden lg:block lg:col-span-2">
						<h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
							Ideas & Inspiration
						</h4>
						<ul className="space-y-2">
							<li>
								<Link href="/bridal-wear" className="text-xs text-gray-400 hover:text-white transition-colors">
									Bridal Wear
								</Link>
							</li>
							<li>
								<Link href="/mehndi-haldi" className="text-xs text-gray-400 hover:text-white transition-colors">
									Mehndi & Haldi Ideas
								</Link>
							</li>
							<li>
								<Link href="/decor" className="text-xs text-gray-400 hover:text-white transition-colors">
									Decor & Themes
								</Link>
							</li>
							<li>
								<Link href="/engagement" className="text-xs text-gray-400 hover:text-white transition-colors">
									Engagement Planning
								</Link>
							</li>
							<li>
								<Link href="/sangeet" className="text-xs text-gray-400 hover:text-white transition-colors">
									Sangeet Ideas
								</Link>
							</li>
							<li>
								<Link href="/real-weddings" className="text-xs text-gray-400 hover:text-white transition-colors">
									Real Indian Weddings
								</Link>
							</li>
						</ul>
					</div>

					<div className="hidden md:block lg:col-span-2">
						<h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
							Company
						</h4>
						<ul className="space-y-2">
							<li>
								<Link href="/about" className="text-xs text-gray-400 hover:text-white transition-colors">
									About Us
								</Link>
							</li>
							<li>
								<Link href="/how-it-works" className="text-xs text-gray-400 hover:text-white transition-colors">
									How It Works
								</Link>
							</li>
							<li>
								<Link href="/careers" className="text-xs text-gray-400 hover:text-white transition-colors">
									Careers
								</Link>
							</li>
							<li>
								<Link href="/press" className="text-xs text-gray-400 hover:text-white transition-colors">
									Media & Press
								</Link>
							</li>
							<li>
								<Link href="/partner" className="text-xs text-gray-400 hover:text-white transition-colors">
									Partner With Us
								</Link>
							</li>
							<li>
								<Link href="/blog" className="text-xs text-gray-400 hover:text-white transition-colors">
									Blog
								</Link>
							</li>
							<li>
								<Link href="/contact" className="text-xs text-gray-400 hover:text-white transition-colors">
									Contact Us
								</Link>
							</li>
						</ul>
					</div>

					<div className="hidden xl:block lg:col-span-2">
						<h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
							Support
						</h4>
						<ul className="space-y-2">
							<li>
								<Link href="/help" className="text-xs text-gray-400 hover:text-white transition-colors">
									Help Center
								</Link>
							</li>
							<li>
								<Link href="/chat" className="text-xs text-gray-400 hover:text-white transition-colors">
									Live Chat
								</Link>
							</li>
							<li>
								<Link href="/refund" className="text-xs text-gray-400 hover:text-white transition-colors">
									Refund Policy
								</Link>
							</li>
							<li>
								<Link href="/vendor-support" className="text-xs text-gray-400 hover:text-white transition-colors">
									Vendor Support
								</Link>
							</li>
							<li>
								<Link href="/report" className="text-xs text-gray-400 hover:text-white transition-colors">
									Report an Issue
								</Link>
							</li>
							<li>
								<Link href="/trust" className="text-xs text-gray-400 hover:text-white transition-colors">
									Safety & Trust
								</Link>
							</li>
						</ul>
					</div>

					<div className="lg:col-span-2">
						<h4 className="text-xs font-semibold mb-3 leading-tight">
							One powerful app for your complete wedding journey
						</h4>
						<div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl mb-3 flex items-center justify-center">
							<span className="text-3xl">📱</span>
						</div>
						<div className="space-y-2">
							<Link
								href="#"
								className="block w-full py-2 px-3 bg-white text-black text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center"
							>
								Download on Play Store
							</Link>
							<Link
								href="#"
								className="block w-full py-2 px-3 bg-white text-black text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center"
							>
								Download on App Store
							</Link>
						</div>
					</div>
				</div>

				<div className="border-t border-gray-800 pt-6">
					<div className="flex flex-col lg:flex-row items-center justify-between gap-4">
						<p className="text-xs text-gray-500 order-2 lg:order-1">
							© 2025 YourBrand Pvt. Ltd. All rights reserved.
						</p>

						<div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 order-1 lg:order-2">
							<Link href="/privacy" className="hover:text-white transition-colors">
								Privacy
							</Link>
							<span className="text-gray-700">|</span>
							<Link href="/terms" className="hover:text-white transition-colors">
								Terms
							</Link>
							<span className="text-gray-700">|</span>
							<Link href="/accessibility" className="hover:text-white transition-colors">
								Accessibility
							</Link>
							<span className="text-gray-700">|</span>
							<Link href="/data-policy" className="hover:text-white transition-colors">
								Data Policy
							</Link>
							<span className="text-gray-700">|</span>
							<Link href="/refunds" className="hover:text-white transition-colors">
								Refunds
							</Link>
							<span className="text-gray-700">|</span>
							<Link href="/vendor-terms" className="hover:text-white transition-colors">
								Vendor Terms
							</Link>
						</div>

						<div className="flex items-center gap-3 order-3">
							<Link
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors"
								aria-label="Instagram"
							>
								<FaInstagram className="text-sm" />
							</Link>
							<Link
								href="https://youtube.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors"
								aria-label="YouTube"
							>
								<FaYoutube className="text-sm" />
							</Link>
							<Link
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
								className="hidden md:flex w-8 h-8 rounded-full bg-gray-800 items-center justify-center hover:bg-blue-600 transition-colors"
								aria-label="Facebook"
							>
								<FaFacebookF className="text-sm" />
							</Link>
							<Link
								href="https://x.com"
								target="_blank"
								rel="noopener noreferrer"
								className="hidden md:flex w-8 h-8 rounded-full bg-gray-800 items-center justify-center hover:bg-gray-600 transition-colors"
								aria-label="X (Twitter)"
							>
								<FaXTwitter className="text-sm" />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}
