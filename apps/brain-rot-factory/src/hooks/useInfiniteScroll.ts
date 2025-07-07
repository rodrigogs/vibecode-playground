'use client'

import { useEffect } from 'react'

interface UseInfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.8,
  rootMargin = '0px',
}: UseInfiniteScrollProps): void {
  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !isLoading) {
          onLoadMore()
        }
      },
      { threshold, rootMargin },
    )

    // Observe the last few slides in the carousel
    const lastSlides = document.querySelectorAll(
      '.swiper-slide:nth-last-child(-n+3)',
    )
    lastSlides.forEach((slide) => observer.observe(slide))

    return () => {
      lastSlides.forEach((slide) => observer.unobserve(slide))
    }
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin])
}
