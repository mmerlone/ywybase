import type { ReactElement } from 'react'
import type { Metadata } from 'next'

import { Mui7PhoneInputDemo } from './Mui7PhoneInputDemo'

export const metadata: Metadata = {
  title: 'mui7-phone-input Demo',
  description: 'Interactive demo page for the @mmerlone/mui7-phone-number component in YwyBase.',
}

export default function Page(): ReactElement {
  return <Mui7PhoneInputDemo />
}
