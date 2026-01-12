'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveTrendingIdeas, groupIdeasByTheme, THEMES } from '@/lib/firestore-trending-ideas-user'
import { TrendingIdea } from '@/lib/firestore-trending-ideas'
import Image from 'next/image'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

export default function TrendingIdeasSection() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [ideasByTheme, setIdeasByTheme] = useState<Record<string, TrendingIdea[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      const ideas = await getActiveTrendingIdeas()
      const grouped = groupIdeasByTheme(ideas)
      setIdeasByTheme(grouped)
    } catch (error) {
      console.error('Error fetching trending ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getThemeThumbnail = (theme: string) => {
    const themeIdeas = ideasByTheme[theme]
    if (themeIdeas && themeIdeas.length > 0 && themeIdeas[0].thumbnailUrl) {
      return themeIdeas[0].thumbnailUrl
    }
    return null
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trending Wedding Ideas</h2>
            <p className="text-gray-600 text-lg">Discover the latest trends for your perfect wedding</p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Trending Wedding Ideas</h2>
          <p className="text-gray-600 text-lg">Discover the latest trends for your perfect wedding</p>
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white/90 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <MdChevronLeft className="text-3xl text-gray-800" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {THEMES.map((theme) => {
              const thumbnail = getThemeThumbnail(theme)
              const ideaCount = ideasByTheme[theme]?.length || 0

              return (
                <div
                  key={theme}
                  onClick={() => router.push(`/trending-ideas#${theme.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="flex-shrink-0 w-80 h-96 rounded-xl overflow-hidden cursor-pointer group/card relative transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={theme}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2 transform transition-transform group-hover/card:translate-y-[-4px]">
                      {theme}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'} available
                    </p>
                  </div>

                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">Explore</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white/90 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <MdChevronRight className="text-3xl text-gray-800" />
          </button>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/trending-ideas')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-pink-600 text-white font-semibold rounded-full hover:bg-pink-700 transform transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Explore All Ideas
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
