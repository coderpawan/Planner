'use client'

import { useRef, useState, useEffect } from 'react'
import { TrendingIdea } from '@/lib/firestore-trending-ideas'
import { MdClose, MdFullscreen, MdFullscreenExit, MdLocationOn } from 'react-icons/md'

interface IdeaDetailModalProps {
  idea: TrendingIdea | null
  isOpen: boolean
  onClose: () => void
}

export default function IdeaDetailModal({ idea, isOpen, onClose }: IdeaDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [isOpen])

  if (!isOpen || !idea) return null

  const handleFullscreen = async () => {
    if (!videoContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : url
  }

  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Budget on request'
    if (min === max) return `₹${min.toLocaleString()}`
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{idea.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="text-3xl" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-semibold">
              {idea.theme}
            </span>
            {idea.isTrending && (
              <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                Trending
              </span>
            )}
          </div>

          <div ref={videoContainerRef} className="relative mb-6 rounded-xl overflow-hidden bg-black group">
            {idea.videoType === 'youtube' ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={getYouTubeEmbedUrl(idea.videoUrl)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                ref={videoRef}
                src={idea.videoUrl}
                controls
                autoPlay
                muted
                className="w-full"
              />
            )}
            
            <button
              onClick={handleFullscreen}
              className="absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
            >
              {isFullscreen ? (
                <MdFullscreenExit className="text-2xl" />
              ) : (
                <MdFullscreen className="text-2xl" />
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Idea</h3>
              <p className="text-gray-700 leading-relaxed">{idea.shortDescription}</p>
              {idea.longDescription && (
                <p className="text-gray-600 mt-3 leading-relaxed">{idea.longDescription}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-5 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Estimated Budget</h4>
                <p className="text-2xl font-bold text-pink-600">
                  {formatBudget(idea.estimatedBudgetRange?.min || 0, idea.estimatedBudgetRange?.max || 0)}
                </p>
              </div>

              {idea.cityPreference && idea.cityPreference.length > 0 && (
                <div className="bg-blue-50 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MdLocationOn className="text-blue-600" />
                    Recommended Cities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {idea.cityPreference.map((city, index) => (
                      <span key={index} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {idea.cultureTags && idea.cultureTags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Culture Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {idea.cultureTags.map((tag, index) => (
                    <span key={index} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {idea.relatedServices && idea.relatedServices.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Related Services</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {idea.relatedServices.map((service, index) => (
                    <div key={index} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 text-center">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-full hover:from-pink-700 hover:to-purple-700 transform transition-all hover:scale-105 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
