'use client'

import MainNavbar from '@/components/common/MainNavbar'
import HeroSection from '@/components/common/HeroSection'
import VendorMarketplace from '@/components/common/VendorMarketplace'
import TrendingIdeasSection from '@/components/common/TrendingIdeasSection'
import Testimonials from '@/components/common/Testimonials'
import Footer from '@/components/common/Footer'
import VendorSection from '@/components/common/VendorSection'
import BudgetSection from '@/components/common/BudgetSection'

export default function Home() {
	return (
		<>
			<MainNavbar />
			<HeroSection />
			<BudgetSection />
			<VendorMarketplace />
			<TrendingIdeasSection />
			<Testimonials />
			<VendorSection />
			<Footer />
		</>
	)
}
