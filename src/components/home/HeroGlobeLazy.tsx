'use client'

import dynamic from 'next/dynamic'
import { GlobePlaceholderStatic } from '@/components/home/GlobePlaceholderStatic'

const HeroGlobe = dynamic(() => import('@/components/home/HeroGlobe'), {
  ssr: false,
  loading: () => <GlobePlaceholderStatic />,
})

export default function HeroGlobeLazy() {
  return <HeroGlobe />
}
