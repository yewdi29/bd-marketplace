'use client'

import MuxPlayer from '@mux/mux-player-react'
import type { ComponentProps, CSSProperties } from 'react'

/** Matches `--orange` / tailwind `orange.DEFAULT` — see DESIGN_SYSTEM.md */
const BRAND_ORANGE = '#FF6B35'

interface Props {
  playbackId: string
  title: string
  objectFit?: 'cover' | 'contain'
  className?: string
  style?: CSSProperties
}

export default function GalleryMuxPlayer({
  playbackId,
  title,
  objectFit = 'cover',
  className,
  style,
}: Props) {
  const playerStyle = {
    width: '100%',
    height: '100%',
    '--media-object-fit': objectFit,
    ...style,
  } as ComponentProps<typeof MuxPlayer>['style']

  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      accentColor={BRAND_ORANGE}
      metadata={{ video_title: title }}
      className={className}
      style={playerStyle}
    />
  )
}
