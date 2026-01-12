'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MdClose, MdChevronLeft, MdChevronRight, MdZoomIn, MdZoomOut } from 'react-icons/md'

interface FullscreenImageViewerProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  alt: string
}

export default function FullscreenImageViewer({ 
  images, 
  initialIndex, 
  isOpen, 
  onClose,
  alt 
}: FullscreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoom(1)
  }, [initialIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden'

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentIndex])

  if (!isOpen) return null

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setZoom(1)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setZoom(1)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1))
  }

  const handleReset = () => {
    setZoom(1)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
      {/* Close Button - Always Visible */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-10"
        aria-label="Close viewer"
      >
        <MdClose className="text-2xl" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          aria-label="Zoom in"
        >
          <MdZoomIn className="text-xl" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          aria-label="Zoom out"
        >
          <MdZoomOut className="text-xl" />
        </button>
        {zoom > 1 && (
          <button
            onClick={handleReset}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full transition-colors text-sm"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <MdChevronLeft className="text-3xl" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <MdChevronRight className="text-3xl" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-auto cursor-move"
        style={{
          transform: `scale(${zoom})`,
          transition: 'transform 0.3s ease'
        }}
      >
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto">
          <Image
            src={images[currentIndex]}
            alt={`${alt} - Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setZoom(1)
              }}
              className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-pink-500 scale-110' 
                  : 'border-transparent hover:border-white/50'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center">
        <p>Use arrow keys or swipe to navigate • ESC to close</p>
      </div>
    </div>
  )
}
