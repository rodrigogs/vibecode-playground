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

import type { BrainRotCharacter } from '../types/characters'
// Import custom styles
import styles from './BrainRotCarousel.module.css'

interface BrainRotCarouselProps {
  characters: BrainRotCharacter[]
  selectedCharacter: BrainRotCharacter | null
  onCharacterSelect: (character: BrainRotCharacter) => void
  className?: string
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
}: BrainRotCarouselProps) {
  const t = useTranslations('Characters')

  // Refs for Swiper instances
  const swiperRef = useRef<SwiperCore | null>(null)

  // State management
  const [stats, setStats] = useState<CarouselStats>({
    currentSlide: 0,
    totalSlides: characters.length,
    isAutoplayRunning: true,
  })

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

  // Handlers
  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    const newSlide = swiper.realIndex
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

  const goToSlide = useCallback((index: number) => {
    if (!swiperRef.current) return
    swiperRef.current.slideToLoop(index)
  }, [])

  const handleCharacterClick = useCallback(
    (character: BrainRotCharacter) => {
      onCharacterSelect(character)
      // Find the index and slide to it
      const index = characters.findIndex((c) => c.id === character.id)
      if (index !== -1) {
        goToSlide(index)
      }
    },
    [characters, onCharacterSelect, goToSlide],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!swiperRef.current) return

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
          goToSlide(characters.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAutoplay, goToSlide, characters.length])

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
          loop={true}
          slidesPerView={3}
          spaceBetween={30}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          centeredSlidesBounds={true}
          slideToClickedSlide={true}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3,
            renderBullet: (index: number, className: string) => {
              const character = characters[index]
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
          loopAdditionalSlides={2}
          initialSlide={0}
          watchSlidesProgress={true}
          updateOnWindowResize={true}
          observeParents={true}
          observeSlideChildren={true}
          className={styles.brainRotMainCarousel || 'brain-rot-main-carousel'}
        >
          {characters.map((character, index) => (
            <SwiperSlide key={character.id}>
              <div
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
                  <Image
                    src={`/images/${character.image}`}
                    alt={character.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />

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
                        Selected
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
