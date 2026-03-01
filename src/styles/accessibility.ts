/**
 * Reusable visually hidden styles for accessible-only content.
 * Use when rendering headings/labels meant for assistive tech only.
 */
export const srOnly = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute' as const,
  whiteSpace: 'nowrap' as const,
  width: 1,
} as const
