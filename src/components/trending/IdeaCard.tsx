'use client'

import { TrendingIdea } from '@/lib/firestore-trending-ideas'
import Image from 'next/image'
import { MdPlayCircle, MdLocationOn } from 'react-icons/md'

interface IdeaCardProps {
  idea: TrendingIdea
  onClick: () => void
}

export default function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Budget on request'
    if (min === max) return `₹${min.toLocaleString()}`
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="relative h-56 overflow-hidden">
        {idea.thumbnailUrl ? (
          <Image
            src={idea.thumbnailUrl}
            alt={idea.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-300 to-purple-400" />
        )}
        
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <MdPlayCircle className="text-4xl text-pink-600" />
          </div>
        </div>

        {idea.isTrending && (
          <div className="absolute top-4 right-4 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Trending
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {idea.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {idea.shortDescription}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Budget</span>
            <span className="text-gray-900 font-semibold">
              {formatBudget(idea.estimatedBudgetRange?.min || 0, idea.estimatedBudgetRange?.max || 0)}
            </span>
          </div>

          {idea.cityPreference && idea.cityPreference.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <MdLocationOn className="text-pink-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600 line-clamp-1">
                {idea.cityPreference.slice(0, 3).join(', ')}
                {idea.cityPreference.length > 3 && ` +${idea.cityPreference.length - 3}`}
              </span>
            </div>
          )}
        </div>

        {idea.cultureTags && idea.cultureTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {idea.cultureTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
