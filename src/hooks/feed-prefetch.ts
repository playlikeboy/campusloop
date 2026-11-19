/** Fraction of the scrollable list read before the next feed page is requested. */
export const PREFETCH_SCROLL_FRACTION = 0.6;

/**
 * True once the bottom of the viewport has passed `fraction` of the content.
 * Content that doesn't scroll yet (shorter than ~1.5 screens) always prefetches.
 */
export function scrolledPastFraction(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  fraction = PREFETCH_SCROLL_FRACTION
): boolean {
  if (!(scrollHeight > 0) || !(clientHeight > 0)) return false;
  if (scrollHeight <= clientHeight * 1.5) return true;
  return (scrollTop + clientHeight) / scrollHeight >= fraction;
}
