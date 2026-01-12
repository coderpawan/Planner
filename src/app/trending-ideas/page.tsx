'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getActiveTrendingIdeas, groupIdeasByTheme, THEMES } from '@/lib/firestore-trending-ideas-user'
import { TrendingIdea } from '@/lib/firestore-trending-ideas'
import IdeaCard from '@/components/trending/IdeaCard'
import IdeaDetailModal from '@/components/trending/IdeaDetailModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function TrendingIdeasPage() {
  const router = useRouter()
  const [ideasByTheme, setIdeasByTheme] = useState<Record<string, TrendingIdea[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedIdea, setSelectedIdea] = useState<TrendingIdea | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchIdeas()
  }, [])

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }
  }, [loading])

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

  const handleIdeaClick = (idea: TrendingIdea) => {
    setSelectedIdea(idea)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedIdea(null), 300)
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading trending ideas..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-1.5 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Trending Wedding Ideas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the most beautiful and inspiring wedding themes curated just for you
          </p>
        </div>

        <div className="space-y-16">
          {THEMES.map((theme) => {
            const ideas = ideasByTheme[theme] || []
            
            if (ideas.length === 0) {
              return null
            }

            const themeId = theme.toLowerCase().replace(/\s+/g, '-')

            return (
              <section key={theme} id={themeId} className="scroll-mt-20">
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    <h2 className="text-3xl font-bold text-gray-900">{theme}</h2>
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                      {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
                    </span>
                  </div>
                  <div className="h-1 w-20 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full"></div>
                </div>

                {ideas.length <= 3 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} onClick={() => handleIdeaClick(idea)} />
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                      {ideas.map((idea) => (
                        <div key={idea.id} className="flex-shrink-0 w-80">
                          <IdeaCard idea={idea} onClick={() => handleIdeaClick(idea)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {Object.values(ideasByTheme).every(ideas => ideas.length === 0) && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Ideas Available Yet</h3>
            <p className="text-gray-500">Check back soon for inspiring wedding ideas!</p>
          </div>
        )}
      </div>

      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
