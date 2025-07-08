'use client'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  A11y,
  Autoplay,
  EffectCoverflow,
  Keyboard,
  Mousewheel,
  Navigation,
  Pagination,
} from 'swiper/modules'
// Import Swiper core and required modules
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperCore } from 'swiper/types'

import { getCharacterImage } from '@/lib/characterUtils'

import type { BrainRotCharacter } from '../types/characters'
// Import custom styles
import styles from './BrainRotCarousel.module.css'

interface BrainRotCarouselProps {
  characters: BrainRotCharacter[]
  selectedCharacter: BrainRotCharacter | null
  onCharacterSelect: (character: BrainRotCharacter) => void
  className?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

interface CarouselStats {
  currentSlide: number
  totalSlides: number
  isAutoplayRunning: boolean
}

export default function BrainRotCarousel({
  characters,
  selectedCharacter,
  onCharacterSelect,
  className = '',
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: BrainRotCarouselProps) {
  const t = useTranslations('Characters')

  // Refs for Swiper instances
  const swiperRef = useRef<SwiperCore | null>(null)
  // Ref for the last slide to trigger loading more
  const lastSlideRef = useRef<HTMLDivElement>(null)

  // Memoized breakpoints configuration
  const breakpoints = React.useMemo(
    () => ({
      320: {
        slidesPerView: 1,
        spaceBetween: 20,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        },
      },
      480: {
        slidesPerView: 1,
        spaceBetween: 20,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        },
      },
      768: {
        slidesPerView: 1.5,
        spaceBetween: 30,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        },
      },
      1024: {
        slidesPerView: 2.5,
        spaceBetween: 30,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        },
      },
      1280: {
        slidesPerView: 3,
        spaceBetween: 30,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        },
      },
    }),
    [],
  )

  // Calculate if we have enough slides for proper looping
  // We need at least as many slides as the maximum slidesPerView across all breakpoints
  const maxSlidesPerView = Math.max(
    1, // 320px and 480px breakpoints
    1.5, // 768px breakpoint
    2.5, // 1024px breakpoint
    3, // 1280px breakpoint
  )

  // Enable loop only when we have enough slides to avoid Swiper warnings
  // We need at least double the max slides per view for seamless looping
  const hasEnoughSlidesForLoop =
    characters.length >= Math.ceil(maxSlidesPerView * 2)

  // For very small datasets (1-2 characters), we'll duplicate them to enable looping
  const shouldDuplicateForLoop = characters.length > 0 && characters.length < 4
  const displayCharacters = shouldDuplicateForLoop
    ? [...characters, ...characters, ...characters].slice(
        0,
        Math.max(6, characters.length * 3),
      )
    : characters

  // Final loop decision: enable if we have enough original slides OR if we're using duplicated slides
  const enableLoop = hasEnoughSlidesForLoop || shouldDuplicateForLoop

  // Track current slide for lazy loading
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Lazy loading: Track which slides are near the viewport
  const [nearViewportSlides, setNearViewportSlides] = useState<Set<number>>(
    new Set([0, 1, 2]),
  )

  // Update near viewport slides when current slide changes
  useEffect(() => {
    const currentIndex = currentSlideIndex
    const totalSlides = displayCharacters.length
    const buffer = 2 // Load 2 slides before and after current

    const newNearViewportSlides = new Set<number>()

    for (let i = -buffer; i <= buffer; i++) {
      let index = currentIndex + i

      // Handle wrapping for loop mode
      if (enableLoop && totalSlides > 0) {
        if (index < 0) index = totalSlides + index
        if (index >= totalSlides) index = index - totalSlides
      } else {
        // For non-loop mode, clamp to boundaries
        index = Math.max(0, Math.min(totalSlides - 1, index))
      }

      if (index >= 0 && index < totalSlides) {
        newNearViewportSlides.add(index)
      }
    }

    setNearViewportSlides(newNearViewportSlides)
  }, [currentSlideIndex, displayCharacters.length, enableLoop])

  // State management
  const [stats, setStats] = useState<CarouselStats>({
    currentSlide: 0,
    totalSlides: displayCharacters.length,
    isAutoplayRunning: true,
  })

  // Handlers
  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    const newSlide = swiper.realIndex
    setCurrentSlideIndex(newSlide) // Update for virtual rendering
    setStats((prev) => {
      if (prev.currentSlide !== newSlide) {
        return {
          ...prev,
          currentSlide: newSlide,
        }
      }
      return prev
    })
  }, [])

  const handleSwiperInit = useCallback((swiper: SwiperCore) => {
    swiperRef.current = swiper
  }, [])

  const toggleAutoplay = useCallback(() => {
    if (!swiperRef.current) return

    if (stats.isAutoplayRunning) {
      swiperRef.current.autoplay.stop()
    } else {
      swiperRef.current.autoplay.start()
    }

    setStats((prev) => ({
      ...prev,
      isAutoplayRunning: !prev.isAutoplayRunning,
    }))
  }, [stats.isAutoplayRunning])

  const goToSlide = useCallback(
    (index: number) => {
      if (!swiperRef.current) return
      // Use slideToLoop only when loop is enabled, otherwise use slideTo
      if (enableLoop) {
        swiperRef.current.slideToLoop(index)
      } else {
        swiperRef.current.slideTo(index)
      }
    },
    [enableLoop],
  )

  const handleCharacterClick = useCallback(
    (character: BrainRotCharacter) => {
      onCharacterSelect(character)
      // Find the index in the display array and slide to it
      const index = displayCharacters.findIndex((c) => c.id === character.id)
      if (index !== -1) {
        goToSlide(index)
      }
    },
    [displayCharacters, onCharacterSelect, goToSlide],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!swiperRef.current) return

      // Don't interfere with input fields
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          swiperRef.current.slidePrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          swiperRef.current.slideNext()
          break
        case ' ':
          e.preventDefault()
          toggleAutoplay()
          break
        case 'Home':
          e.preventDefault()
          goToSlide(0)
          break
        case 'End':
          e.preventDefault()
          goToSlide(displayCharacters.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAutoplay, goToSlide, displayCharacters.length])

  // Intersection observer to load more characters seamlessly
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '50px', // Trigger 50px before the element comes into view
      },
    )

    const currentRef = lastSlideRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoading, characters.length])

  // Calculate which slide should have the observer
  const triggerLoadIndex = Math.max(0, displayCharacters.length - 3) // Trigger 3 slides before the end

  // Handle empty state
  if (characters.length === 0) {
    return (
      <div
        className={`${styles.brainRotCarouselContainer || 'brain-rot-carousel-container'} ${className}`}
      >
        <div className="text-center py-12">
          <p className="text-white/60 text-lg">{t('noCharacters')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.brainRotCarouselContainer || 'brain-rot-carousel-container'} ${className}`}
    >
      {/* Main Carousel */}
      <div className="relative">
        <Swiper
          modules={[
            Navigation,
            Pagination,
            Autoplay,
            EffectCoverflow,
            Keyboard,
            Mousewheel,
            A11y,
          ]}
          onSwiper={handleSwiperInit}
          onSlideChange={handleSlideChange}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          loop={enableLoop}
          slidesPerView={3}
          spaceBetween={30}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          centeredSlidesBounds={!enableLoop}
          slideToClickedSlide={true}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3,
            renderBullet: (index: number, className: string) => {
              const character = displayCharacters[index]
              return `<span class="${className}" title="${character?.name || `Slide ${index + 1}`}"></span>`
            },
          }}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: true,
          }}
          keyboard={{
            enabled: true,
            onlyInViewport: true,
          }}
          mousewheel={{
            enabled: true,
            sensitivity: 1,
            thresholdDelta: 50,
          }}
          breakpoints={breakpoints}
          loopAdditionalSlides={enableLoop ? 2 : 0}
          initialSlide={0}
          watchSlidesProgress={true}
          updateOnWindowResize={true}
          observeParents={true}
          observeSlideChildren={true}
          className={styles.brainRotMainCarousel || 'brain-rot-main-carousel'}
        >
          {displayCharacters.map((character, index) => (
            <SwiperSlide key={`${character.id}-${index}`}>
              <div
                ref={index === triggerLoadIndex ? lastSlideRef : undefined}
                onClick={() => handleCharacterClick(character)}
                className={`group cursor-pointer transition-all duration-300 rounded-2xl p-6 border-2 backdrop-blur-sm h-full flex flex-col relative overflow-hidden w-full max-w-xs mx-auto ${
                  selectedCharacter?.id === character.id
                    ? 'border-purple-400 bg-purple-500/20 shadow-2xl shadow-purple-500/50'
                    : 'border-purple-500/30 bg-black/20 hover:border-purple-400/70 hover:bg-purple-500/15 hover:shadow-lg hover:shadow-purple-500/25'
                } transform-gpu`}
                role="button"
                tabIndex={0}
                aria-label={`Select ${character.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCharacterClick(character)
                  }
                }}
              >
                {/* Character Image */}
                <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                  {nearViewportSlides.has(index) ? (
                    <Image
                      src={`/images/characters/${getCharacterImage(character)}`}
                      alt={character.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    // Placeholder for lazy-loaded images
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/10 to-pink-600/10 flex items-center justify-center">
                      <div className="text-purple-300/50 text-sm">
                        Loading...
                      </div>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Character Info */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-purple-300 mb-3 text-center group-hover:text-purple-200 transition-colors">
                    {character.name}
                  </h3>

                  <p className="text-sm text-gray-400 text-center mb-4 flex-1 line-clamp-4 group-hover:text-gray-300 leading-relaxed">
                    {character.description}
                  </p>

                  {/* Character Motifs */}
                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {character.motifs?.slice(0, 3).map((motif, motifIndex) => (
                      <span
                        key={motifIndex}
                        className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30"
                      >
                        {motif}
                      </span>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {selectedCharacter?.id === character.id && (
                    <div className="text-center">
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-4 py-2 rounded-full font-semibold animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        {t('selected')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button
          className={`swiper-button-prev-custom !absolute !left-2 !top-1/2 !-translate-y-1/2 !z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border border-transparent hover:border-white/30 active:border-white/50 cursor-pointer ${styles.swiperButtonPrevCustom || ''}`}
          title={t('previousCharacter')}
        >
          <ChevronLeft className="w-6 h-6 text-white/90 hover:text-white transition-colors duration-200" />
        </button>

        <button
          className={`swiper-button-next-custom !absolute !right-2 !top-1/2 !-translate-y-1/2 !z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border border-transparent hover:border-white/30 active:border-white/50 cursor-pointer ${styles.swiperButtonNextCustom || ''}`}
          title={t('nextCharacter')}
        >
          <ChevronRight className="w-6 h-6 text-white/90 hover:text-white transition-colors duration-200" />
        </button>
      </div>
    </div>
  )
}
