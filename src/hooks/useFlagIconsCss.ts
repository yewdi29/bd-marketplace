'use client'

import { useEffect } from 'react'

let loadPromise: Promise<unknown> | null = null

function loadFlagIconsCss() {
  if (!loadPromise) {
    loadPromise = import('flag-icons/css/flag-icons.min.css')
  }
  return loadPromise
}

/** Loads flag-icons CSS on demand instead of in the root layout bundle. */
export function useFlagIconsCss() {
  useEffect(() => {
    void loadFlagIconsCss()
  }, [])
}
