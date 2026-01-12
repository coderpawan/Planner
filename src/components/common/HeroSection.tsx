'use client'

import { useState, useEffect, useRef } from 'react'
import { MdArrowForward, MdStar } from 'react-icons/md'
import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'

interface VideoSlide {
	id: string
	videoSrc: string
	brideName: string
	groomName: string
	city: string
	date: string
}

export default function HeroSection() {
	const [activeIndex, setActiveIndex] = useState(0)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [videoSlides, setVideoSlides] = useState<VideoSlide[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Fetch video slides from Firestore
	useEffect(() => {
		const fetchVideoSlides = async () => {
			try {
				const videosRef = collection(firestore, 'hero_section')
				const snapshot = await getDocs(videosRef)
				const videosData = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				})) as VideoSlide[]
				setVideoSlides(videosData)
			} catch (error) {
				console.error('Error fetching video slides:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchVideoSlides()
	}, [])

	// Auto-slide every 6 seconds
	useEffect(() => {
		if (videoSlides.length > 0) {
			intervalRef.current = setInterval(() => {
				handleNext()
			}, 6000)
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [activeIndex, videoSlides.length])

	// Play active video
	useEffect(() => {
		videoRefs.current.forEach((video, index) => {
			if (video) {
				if (index === activeIndex) {
					video.play().catch(err => console.log('Video play failed:', err))
				} else {
					video.pause()
					video.currentTime = 0
				}
			}
		})
	}, [activeIndex])

	const handleNext = () => {
		if (isTransitioning) return
		setIsTransitioning(true)
		setActiveIndex((prev) => (prev + 1) % videoSlides.length)
		setTimeout(() => setIsTransitioning(false), 500)
	}

	const handleDotClick = (index: number) => {
		if (isTransitioning || index === activeIndex) return
		setIsTransitioning(true)
		setActiveIndex(index)
		setTimeout(() => setIsTransitioning(false), 500)
		
		// Reset interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
		intervalRef.current = setInterval(() => {
			handleNext()
		}, 6000)
	}

	if (isLoading) {
		return (
			<section className="relative w-full h-screen overflow-hidden bg-black">
				<div className="absolute inset-0 flex items-center justify-center z-30">
					<p className="text-white text-2xl">Loading...</p>
				</div>
			</section>
		)
	}

	if (videoSlides.length === 0) {
		return null
	}

	const coupleName = `${videoSlides[activeIndex].brideName} & ${videoSlides[activeIndex].groomName}`

	return (
		<section className="relative w-full h-screen overflow-hidden bg-black">
			{/* Video Carousel */}
			<div className="absolute inset-0 w-full h-full">
				{videoSlides.map((slide, index) => (
					<div
						key={slide.id}
						className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
							index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
						}`}
					>
						<video
							ref={(el) => {
								videoRefs.current[index] = el
							}}
							src={slide.videoSrc}
							className="w-full h-full object-cover"
							muted
							loop
							playsInline
							preload="auto"
						/>
					</div>
				))}

				{/* Dark Gradient Overlay (bottom to top) */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />
			</div>

			{/* Couple Info Pill - Top Center */}
			<div className="absolute top-8 md:top-12 flex justify-center w-full z-30 animate-fade-in">
				<div className="bg-white/95 backdrop-blur-md rounded-full px-6 py-3 md:px-8 md:py-4 shadow-2xl border border-white/20">
					<div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
						<span className="font-bold text-gray-900">{coupleName}</span>
						<span className="text-gray-400">•</span>
						<span className="text-gray-700">{videoSlides[activeIndex].city}</span>
						<span className="text-gray-400">•</span>
						<span className="text-gray-600 text-xs md:text-sm">{videoSlides[activeIndex].date}</span>
					</div>
				</div>
			</div>

			{/* Carousel Dots Navigation */}
			<div className="absolute bottom-[280px] md:bottom-[320px] left-1/2 -translate-x-1/2 z-30 flex gap-3">
				{videoSlides.map((_, index) => (
					<button
						key={index}
						onClick={() => handleDotClick(index)}
						className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
							index === activeIndex
								? 'bg-white w-8 md:w-10'
								: 'bg-white/50 hover:bg-white/75'
						}`}
						aria-label={`Go to slide ${index + 1}`}
					/>
				))}
			</div>

			{/* Hero Content Block */}
			<div className="absolute bottom-0 left-0 right-0 z-30 pb-8 md:pb-16">
				<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
					{/* Main Heading */}
					<h1 
						className="text-center font-serif font-bold mb-6 md:mb-8 text-white animate-slide-up"
						style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.2' }}
					>
						Crafting Memorable Weddings
					</h1>

					{/* Stats Row */}
					<div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 lg:gap-12 mb-16 md:mb-16 animate-fade-in-delay">
						{/* Stat 1 */}
						<div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
							<div className="text-center">
								<div className="text-2xl md:text-3xl font-bold text-white">1000+</div>
								<div className="text-xs md:text-sm text-white/80">Weddings Done</div>
							</div>
						</div>

						{/* Stat 2 */}
						<div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
							<div className="flex items-center gap-2">
								<MdStar className="text-yellow-400 text-xl md:text-2xl" />
								<div className="text-center">
									<div className="text-2xl md:text-3xl font-bold text-white">4.9</div>
									<div className="text-xs md:text-sm text-white/80">Google Rating</div>
								</div>
							</div>
						</div>

						{/* Stat 3 */}
						<div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
							<div className="text-center">
								<div className="text-2xl md:text-3xl font-bold text-white">500+</div>
								<div className="text-xs md:text-sm text-white/80">Venue Partners</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Custom Animations */}
			<style jsx>{`
				@keyframes fade-in {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes slide-up {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fade-in {
					animation: fade-in 0.8s ease-out forwards;
				}

				.animate-slide-up {
					animation: slide-up 1s ease-out forwards;
				}

				.animate-fade-in-delay {
					animation: fade-in 1s ease-out 0.3s forwards;
					opacity: 0;
				}
			`}</style>
		</section>
	)
}
