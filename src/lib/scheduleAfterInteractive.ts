/** Runs fn after load + idle so heavy client work stays off the critical path. */
export function scheduleAfterInteractive(fn: () => void): () => void {
  let idleId: number | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const run = () => {
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(fn, { timeout: 2000 })
    } else {
      timeoutId = setTimeout(fn, 1)
    }
  }

  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    run()
  } else if (typeof window !== 'undefined') {
    window.addEventListener('load', run, { once: true })
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('load', run)
    }
    if (idleId !== undefined && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleId)
    }
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}
