/** Custom event so MobileMenu (and others) can open the global FeedbackWidget panel. */
export const FEEDBACK_OPEN_EVENT = 'bd:open-feedback'

export function openFeedbackPanel() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FEEDBACK_OPEN_EVENT))
}
