'use client'

import { useState } from 'react'
import { MdCheckCircle, MdClose } from 'react-icons/md'
import Header from './Header'
import Footer from './Footer'

export default function PricingComponent() {
	const [amount, setAmount] = useState(5)
	const [showModal, setShowModal] = useState(false)
	const [error, setError] = useState('')

	const handleAmountChange = (value: number) => {
		if (value < 5) {
			setAmount(5)
			setError('Minimum amount is ₹5')
			return
		}
		if (value % 5 !== 0) {
			setError('Please enter a multiple of ₹5')
		} else {
			setError('')
		}
		setAmount(value)
	}

	const handleIncrement = () => {
		handleAmountChange(amount + 5)
	}

	const handleDecrement = () => {
		if (amount > 5) {
			handleAmountChange(amount - 5)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value) || 0
		handleAmountChange(value)
	}

	const handlePayment = () => {
		if (amount >= 5 && amount % 5 === 0) {
			setShowModal(true)
		}
	}

	const isValid = amount >= 5 && amount % 5 === 0

	return (
		<>
			<Header />
			<div className="min-h-screen bg-gradient-to-br from-pink-50 via-peach-50 to-orange-50 overflow-x-hidden">
				{/* Hero Section */}
				<section className="pt-16 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 w-full">
					<div className="max-w-4xl mx-auto text-center w-full">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 break-words">
							Plan Your Wedding for the Price of a Chai ☕
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-700 mb-3 sm:mb-4 max-w-2xl mx-auto px-2 break-words">
							No subscriptions. No hidden fees. Pay only when you need it.
						</p>
						<p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 break-words">
							Starting at just ₹5
						</p>
						
						<div className="inline-block bg-white rounded-xl sm:rounded-2xl shadow-lg px-6 sm:px-8 py-4 sm:py-6 border-2 border-pink-200 max-w-full">
							<p className="text-2xl sm:text-3xl font-bold text-pink-600 whitespace-nowrap">₹1 = 1 Credit</p>
							<p className="text-xs sm:text-sm text-gray-600 mt-2">Simple. Transparent. Fair.</p>
						</div>
					</div>
				</section>

				{/* Credit Purchase Section */}
				<section className="py-12 sm:py-16 px-4 sm:px-6 w-full">
					<div className="max-w-2xl mx-auto w-full">
						<div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border-2 border-pink-100 w-full">
							<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center break-words">
								Buy Credits Now
							</h2>
							
							<div className="space-y-4 sm:space-y-6 w-full">
								{/* Amount Input */}
								<div className="w-full">
									<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
										Enter Amount (₹)
									</label>
									<div className="flex items-center gap-2 sm:gap-4 w-full">
										<button
											onClick={handleDecrement}
											disabled={amount <= 5}
											className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-pink-100 hover:bg-pink-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-xl sm:text-2xl font-bold text-pink-600 disabled:text-gray-400 transition-colors"
										>
											−
										</button>
										<input
											type="number"
											value={amount}
											onChange={handleInputChange}
											min="5"
											step="5"
											className="flex-1 min-w-0 text-center text-3xl sm:text-4xl font-bold text-gray-900 border-2 border-gray-300 rounded-xl sm:rounded-2xl py-3 sm:py-4 focus:border-pink-500 focus:outline-none transition-colors"
										/>
										<button
											onClick={handleIncrement}
											className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-pink-100 hover:bg-pink-200 text-xl sm:text-2xl font-bold text-pink-600 transition-colors"
										>
											+
										</button>
									</div>
									{error && (
										<p className="text-red-500 text-xs sm:text-sm mt-2 text-center break-words">{error}</p>
									)}
								</div>

								{/* Credits Display */}
								<div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center w-full">
									<p className="text-xs sm:text-sm text-gray-600 mb-2">Credits you'll get</p>
									<p className="text-4xl sm:text-5xl font-bold text-pink-600 animate-pulse break-words">
										{amount}
									</p>
									<p className="text-xs sm:text-sm text-gray-600 mt-2">Credits</p>
								</div>

								{/* Pay Button */}
								<button
									onClick={handlePayment}
									disabled={!isValid}
									className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-base sm:text-lg py-4 sm:py-5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none break-words"
								>
									<span className="inline-block">Pay ₹{amount} • Get {amount} Credits Instantly</span>
								</button>
							</div>
						</div>
					</div>
				</section>

				{/* Trust Section */}
				<section className="py-12 sm:py-16 px-4 sm:px-6 bg-white w-full overflow-hidden">
					<div className="max-w-6xl mx-auto w-full">
						<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center break-words">
							Why Choose Pay-As-You-Go?
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
							{[
								{
									title: 'No Pressure',
									description: 'Start with ₹5, add more only when needed',
									emoji: '😌'
								},
								{
									title: 'Instant Access',
									description: 'Credits available immediately after payment',
									emoji: '⚡'
								},
								{
									title: 'No Subscriptions',
									description: 'Cancel anytime, no recurring charges',
									emoji: '🚫'
								},
								{
									title: 'Pocket-Money Pricing',
									description: 'Affordable for every budget',
									emoji: '💰'
								}
							].map((item, idx) => (
								<div
									key={idx}
									className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:shadow-lg transition-shadow w-full"
								>
									<div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{item.emoji}</div>
									<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">{item.title}</h3>
									<p className="text-xs sm:text-sm text-gray-600 break-words">{item.description}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Social Proof */}
				<section className="py-12 sm:py-16 px-4 sm:px-6 w-full overflow-hidden">
					<div className="max-w-4xl mx-auto w-full">
						<div className="bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center w-full">
							<p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 italic break-words">
								"Most couples start with just ₹5–₹10 to explore our platform"
							</p>
							<p className="text-base sm:text-lg text-gray-700 break-words">
								Join thousands of happy couples planning their dream wedding without breaking the bank
							</p>
							<div className="mt-6 sm:mt-8 flex justify-center gap-1 sm:gap-2 flex-wrap">
								{[1, 2, 3, 4, 5].map((star) => (
									<span key={star} className="text-yellow-400 text-2xl sm:text-3xl">★</span>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Credit Usage Section */}
				<section className="py-12 sm:py-16 px-4 sm:px-6 bg-white w-full overflow-hidden">
					<div className="max-w-4xl mx-auto w-full">
						<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 break-words">
							What Can You Do With Credits?
						</h2>
						<p className="text-center text-sm sm:text-base text-gray-600 mb-8 sm:mb-12 break-words">
							Simple pricing, maximum value
						</p>
						<div className="max-w-2xl mx-auto w-full">
							<div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl sm:rounded-2xl p-5 sm:p-8 hover:shadow-lg transition-shadow w-full">
								<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 w-full">
									<MdCheckCircle className="text-3xl sm:text-4xl text-pink-500 flex-shrink-0 mt-1" />
									<div className="flex-1 min-w-0 w-full">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 w-full">
											<h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
												View Complete Service Details
											</h3>
											<span className="text-2xl sm:text-3xl font-bold text-pink-600 whitespace-nowrap flex-shrink-0">1 Credit</span>
										</div>
										<p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 break-words">
											Get full access to all vendor service information with just 1 credit:
										</p>
										<ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-600 w-full">
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Service name and detailed description</span>
											</li>
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Vendor contact information (phone, email)</span>
											</li>
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Pricing and package details</span>
											</li>
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Service availability and location</span>
											</li>
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Photos, reviews, and ratings</span>
											</li>
											<li className="flex items-start gap-2 break-words">
												<span className="text-pink-500 flex-shrink-0">•</span>
												<span>Everything you need to make a decision</span>
											</li>
										</ul>
									</div>
								</div>
								<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-pink-200 w-full">
									<p className="text-center text-xs sm:text-sm text-gray-600 break-words">
										<span className="font-semibold text-pink-600">Browse for free</span> • Pay only when you want to see full details
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* FAQ Section */}
				<section className="py-12 sm:py-16 px-4 sm:px-6 w-full overflow-hidden">
					<div className="max-w-3xl mx-auto w-full">
						<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center break-words">
							Frequently Asked Questions
						</h2>
						<div className="space-y-4 sm:space-y-6 w-full">
							{
								[
									{
										q: 'What is the minimum payment?',
										a: 'The minimum payment is ₹5, and you can only purchase credits in multiples of ₹5.'
									},
									{
										q: 'Do credits expire?',
										a: 'No! Your credits never expire. Use them whenever you need them, at your own pace.'
									},
									{
										q: 'Can I buy credits multiple times?',
										a: 'Absolutely! You can add credits as many times as you want. No limits, no restrictions.'
									},
									{
										q: 'What if I run out of credits?',
										a: 'Simply come back and purchase more. It takes less than a minute!'
									},
									{
										q: 'Are there any hidden fees?',
										a: 'None. What you see is what you pay. ₹1 = 1 credit, always.'
									}
								].map((faq, idx) => (
									<div
										key={idx}
										className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow w-full"
									>
										<h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 break-words">{faq.q}</h3>
										<p className="text-sm sm:text-base text-gray-600 break-words">{faq.a}</p>
									</div>
								))
							}
						</div>
					</div>
				</section>

				{/* Final CTA */}
				<section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-pink-100 via-peach-100 to-orange-100 w-full overflow-hidden">
					<div className="max-w-3xl mx-auto text-center w-full">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 break-words">
							Weddings are expensive. <br />
							<span className="text-pink-600">Planning shouldn't be.</span>
						</h2>
						<p className="text-lg sm:text-xl text-gray-700 mb-8 sm:mb-10 px-2 break-words">
							Start your wedding planning journey with just ₹5
						</p>
						<button
							onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
							className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 whitespace-nowrap"
						>
							Start with ₹5
						</button>
					</div>
				</section>

				{/* Payment Modal */}
				{showModal && (
					<>
						<div
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
							onClick={() => setShowModal(false)}
						/>
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
							<div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative my-8">
								<button
									onClick={() => setShowModal(false)}
									className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
								>
									<MdClose className="text-xl sm:text-2xl" />
								</button>
								<div className="text-center w-full">
									<div className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
										<span className="text-4xl sm:text-5xl">💳</span>
									</div>
									<h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
										Payment Gateway Integration
									</h3>
									<p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 break-words">
										Payment gateway will be integrated here. This is a placeholder for now.
									</p>
									<div className="bg-pink-50 rounded-xl p-4 mb-5 sm:mb-6 w-full">
										<p className="text-xs sm:text-sm text-gray-600">Your purchase</p>
										<p className="text-2xl sm:text-3xl font-bold text-pink-600 my-2 break-words">₹{amount}</p>
										<p className="text-xs sm:text-sm text-gray-600">{amount} Credits</p>
									</div>
									<button
										onClick={() => setShowModal(false)}
										className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2.5 sm:py-3 rounded-full transition-colors"
									>
										Close
									</button>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
			<Footer />
		</>
	)
}
